import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { generateCompletion, generateCompletionWithMCP } from '../services/openai.js';
import { getRAGContext } from '../services/rag.js';

const router = Router();

/**
 * POST /api/chat
 * Send a message and get an AI response
 * Body: { sessionId, message, mcpServerUrl? }
 * Requires auth - user from req.user
 */
router.post('/', async (req, res) => {
    try {
        const { sessionId, message, mcpServerUrl } = req.body;
        const user = req.user;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get RAG context for the message
        const context = await getRAGContext(message);

        let responseContent, usage;

        if (mcpServerUrl) {
            // Use OpenAI Responses API with external MCP tools
            console.log('Chat: Using MCP server at', mcpServerUrl);
            ({ content: responseContent, usage } = await generateCompletionWithMCP(message, mcpServerUrl, context));
        } else {
            // Standard completion flow
            let messages = [];
            if (sessionId) {
                const { data: history } = await supabase
                    .from('messages')
                    .select('content, role')
                    .eq('session_id', sessionId)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true })
                    .limit(20);

                if (history) {
                    messages = history;
                }
            }
            messages.push({ role: 'user', content: message });
            ({ content: responseContent, usage } = await generateCompletion(messages, context));
        }

        // Save messages to database if sessionId provided
        if (sessionId) {
            // Insert messages with token counts
            const { error: insertError } = await supabase.from('messages').insert([
                { session_id: sessionId, user_id: user.id, content: message, role: 'user', tokens: usage.prompt_tokens },
                { session_id: sessionId, user_id: user.id, content: responseContent, role: 'assistant', tokens: usage.completion_tokens },
            ]);

            if (insertError) {
                console.error('Failed to insert messages:', insertError);
            }

            // Update session total_tokens
            const { data: session, error: fetchError } = await supabase
                .from('sessions')
                .select('total_tokens')
                .eq('id', sessionId)
                .single();

            if (fetchError) {
                console.error('Failed to fetch session for token update:', fetchError);
            } else if (session) {
                const { error: updateError } = await supabase
                    .from('sessions')
                    .update({
                        total_tokens: (session.total_tokens || 0) + usage.total_tokens,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', sessionId);

                if (updateError) {
                    console.error('Failed to update session tokens:', updateError);
                }
            }
        }

        res.json({
            response: responseContent,
            context: context ? 'RAG context was used' : null,
            usage,
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
