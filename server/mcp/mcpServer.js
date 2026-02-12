import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { generateCompletion } from '../services/openai.js';
import { getRAGContext } from '../services/rag.js';

/**
 * Create a new MCP server instance with the `ask` tool registered.
 * Each request gets its own server instance (stateless pattern).
 */
export function createMcpServer() {
    const server = new McpServer(
        {
            name: 'cloudpilot-mcp',
            version: '1.0.0',
        },
        { capabilities: { logging: {} } }
    );

    server.tool(
        'ask',
        'Ask CloudPilot AI one or more questions. Requires the user email and an array of questions. Creates a session and returns answers for each question.',
        {
            email: z.string().email().describe('User email address (must exist in the system)'),
            questions: z.array(z.string()).min(1).describe('Array of questions to ask CloudPilot'),
        },
        async ({ email, questions }) => {
            // 1. Resolve user by email
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id, email')
                .eq('email', email)
                .single();

            if (userError || !user) {
                return {
                    content: [{ type: 'text', text: `Error: User with email "${email}" not found.` }],
                    isError: true,
                };
            }

            // 2. Create a new MCP session
            const sessionTitle = `MCP: ${questions[0].substring(0, 60)}${questions[0].length > 60 ? '...' : ''}`;
            const { data: session, error: sessionError } = await supabase
                .from('sessions')
                .insert([{
                    user_id: user.id,
                    title: sessionTitle,
                    source: 'mcp',
                }])
                .select()
                .single();

            if (sessionError) {
                return {
                    content: [{ type: 'text', text: `Error creating session: ${sessionError.message}` }],
                    isError: true,
                };
            }

            // 3. Process each question sequentially (maintaining conversation context)
            const answers = [];
            const conversationHistory = [];
            let totalTokens = 0;

            for (const question of questions) {
                try {
                    // Get RAG context
                    const context = await getRAGContext(question);

                    // Build messages with conversation history
                    const messages = [...conversationHistory, { role: 'user', content: question }];

                    // Generate completion
                    const { content: responseContent, usage } = await generateCompletion(messages, context);

                    // Update conversation history
                    conversationHistory.push({ role: 'user', content: question });
                    conversationHistory.push({ role: 'assistant', content: responseContent });

                    // Store messages in DB
                    await supabase.from('messages').insert([
                        {
                            session_id: session.id,
                            user_id: user.id,
                            content: question,
                            role: 'user',
                            tokens: usage.prompt_tokens,
                        },
                        {
                            session_id: session.id,
                            user_id: user.id,
                            content: responseContent,
                            role: 'assistant',
                            tokens: usage.completion_tokens,
                        },
                    ]);

                    totalTokens += usage.total_tokens;
                    answers.push({ question, answer: responseContent });
                } catch (err) {
                    answers.push({ question, answer: `Error: ${err.message}` });
                }
            }

            // 4. Update session token count
            await supabase
                .from('sessions')
                .update({ total_tokens: totalTokens, updated_at: new Date().toISOString() })
                .eq('id', session.id);

            // 5. Return structured results
            const resultText = answers
                .map((a, i) => `## Question ${i + 1}\n**Q:** ${a.question}\n\n**A:** ${a.answer}`)
                .join('\n\n---\n\n');

            return {
                content: [{
                    type: 'text',
                    text: `Session created: ${session.id}\n\n${resultText}`,
                }],
            };
        }
    );

    return server;
}
