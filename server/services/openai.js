import OpenAI from 'openai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = 'o3-mini';

/**
 * Generate a chat completion using OpenAI
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} context - Optional RAG context to inject
 * @returns {Promise<{content: string, usage: {prompt_tokens: number, completion_tokens: number, total_tokens: number}}>}
 */
export async function generateCompletion(messages, context = null) {
    const systemMessage = {
        role: 'system',
        content: context
            ? `You are CloudPilot, a helpful AI assistant. Use the following context to inform your responses:\n\n${context}\n\nAnswer the user's questions based on this context when relevant.`
            : 'You are CloudPilot, a helpful AI assistant.',
    };

    const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [systemMessage, ...messages],
    });

    return {
        content: response.choices[0].message.content,
        usage: response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
}

/**
 * Discover available tools from an external MCP server
 */
async function discoverMcpTools(mcpServerUrl) {
    const mcpClient = new Client({ name: 'cloudpilot-chat', version: '1.0.0' });
    const baseUrl = new URL(mcpServerUrl);
    let transport;

    try {
        transport = new StreamableHTTPClientTransport(baseUrl);
        await mcpClient.connect(transport);
        console.log('MCP: Connected via StreamableHTTP');
    } catch (err) {
        console.log(`MCP: StreamableHTTP failed (${err.message}), trying SSE...`);
        const sseUrl = new URL(mcpServerUrl.replace(/\/mcp$/, '/sse'));
        transport = new SSEClientTransport(sseUrl);
        await mcpClient.connect(transport);
        console.log('MCP: Connected via SSE');
    }

    const result = await mcpClient.request({ method: 'tools/list', params: {} }, ListToolsResultSchema);
    const toolNames = (result.tools || []).map(t => t.name);
    console.log('MCP: Discovered tools:', toolNames);

    await transport.close();
    return toolNames;
}

/**
 * Generate a completion using OpenAI Responses API with external MCP tools
 * @param {string} input - The user's message
 * @param {string} mcpServerUrl - URL of the external MCP server
 * @param {string} context - Optional RAG context
 * @returns {Promise<{content: string, usage: object}>}
 */
export async function generateCompletionWithMCP(input, mcpServerUrl, context = null) {
    // Discover available tools
    let toolNames = [];
    try {
        toolNames = await discoverMcpTools(mcpServerUrl);
    } catch (err) {
        console.warn('MCP: Tool discovery failed:', err.message);
        toolNames = ['fetch'];
    }

    if (toolNames.length === 0) {
        toolNames = ['fetch'];
    }

    const mcpTool = {
        type: 'mcp',
        server_label: 'external',
        server_url: mcpServerUrl,
        require_approval: {
            never: { tool_names: toolNames }
        }
    };

    const systemPrompt = context
        ? `You are CloudPilot, a helpful AI assistant. Use the following context to inform your responses:\n\n${context}\n\nAnswer the user's questions based on this context when relevant. You also have access to external tools via MCP. Use the fetch tool when the user asks you to retrieve data from URLs.`
        : 'You are CloudPilot, a helpful AI assistant. You have access to external tools via MCP. Use the fetch tool when the user asks you to retrieve data from URLs.';

    console.log('MCP: Calling OpenAI Responses API with tools:', toolNames);

    const resp = await openai.responses.create({
        model: DEFAULT_MODEL,
        tools: [mcpTool],
        input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input }
        ],
    });

    console.log('MCP: Response received, length:', resp.output_text?.length);

    return {
        content: resp.output_text,
        usage: resp.usage
            ? { prompt_tokens: resp.usage.input_tokens || 0, completion_tokens: resp.usage.output_tokens || 0, total_tokens: (resp.usage.input_tokens || 0) + (resp.usage.output_tokens || 0) }
            : { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
}

export default openai;
