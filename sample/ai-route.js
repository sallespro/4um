import express from 'express';
import OpenAI from 'openai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import {
    ListToolsResultSchema
} from '@modelcontextprotocol/sdk/types.js';

// MCP tool interface for type safety
// Note: These interfaces are removed since this is now JavaScript

export async function createAIRouter() {
    const router = express.Router();

    // POST /ai endpoint
    router.post('/', async (req, res) => {
        try {
            console.log('Received request to /ai endpoint');

            const { input, model = 'o3-mini' } = req.body;

            if (!input) {
                return res.status(400).json({
                    error: 'Missing required field: input'
                });
            }

            if (!process.env.OPENAI_API_KEY) {
                return res.status(500).json({
                    error: 'OpenAI API key not configured'
                });
            }

            const client = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });

            // Get MCP server URL for tool discovery
            const mcpServerUrl = process.env.AI_MCP_SERVER_URL || 'https://cool.cloudpilot.com.br/mcp';

            console.log('Discovering available tools from MCP server at:', mcpServerUrl);

            // Discover available tools using proper MCP client
            let availableTools = [];
            try {
                // Create MCP client
                const mcpClient = new Client({
                    name: 'ai-route-client',
                    version: '1.0.0'
                });

                // Try to connect with proper transport
                const baseUrl = new URL(mcpServerUrl);
                let transport;

                try {
                    // Try StreamableHTTP transport first
                    transport = new StreamableHTTPClientTransport(baseUrl);
                    await mcpClient.connect(transport);
                    console.log('Connected using StreamableHTTP transport');
                } catch (error) {
                    console.log(`StreamableHTTP transport failed: ${error}, falling back to SSE`);
                    // Fall back to SSE transport
                    const sseUrl = new URL(mcpServerUrl.replace('/mcp', '/sse'));
                    transport = new SSEClientTransport(sseUrl);
                    await mcpClient.connect(transport);
                    console.log('Connected using SSE transport');
                }

                // Use ListToolsRequest to discover tools
                const toolsRequest = {
                    method: 'tools/list',
                    params: {}
                };

                const toolsResult = await mcpClient.request(toolsRequest, ListToolsResultSchema);

                if (toolsResult.tools && toolsResult.tools.length > 0) {
                    availableTools = toolsResult.tools.map((tool) => tool.name);
                    console.log('Discovered MCP tools:', availableTools);
                } else {
                    console.log('No tools discovered from MCP server');
                }

                // Close the transport connection
                await transport.close();

            } catch (error) {
                console.warn('Error discovering tools from MCP server:', {
                    error: error instanceof Error ? error.message : error,
                    url: mcpServerUrl
                });
            }

            // Fallback to default tools if discovery fails
            if (availableTools.length === 0) {
                availableTools = ['echo', 'start-notification-stream', 'fetch'];
                console.log('Using fallback tools:', availableTools);
            }

            // Configure MCP tool with discovered tools and no approval requirements
            const mcpTool = {
                type: 'mcp',
                server_label: 'cool',
                server_url: mcpServerUrl,
                require_approval: {
                    never: {
                        tool_names: availableTools
                    }
                }
            };

            console.log('Making OpenAI responses API request with MCP tools:', availableTools);

            // Make OpenAI responses API call with MCP tools (exact format from example)
            const resp = await client.responses.create({
                model: model || 'o3-mini',
                tools: [mcpTool],
                input: input
            });

            console.log('OpenAI response received:', resp.output_text);

            return res.json({
                success: true,
                response: resp.output_text,
                model_used: model || 'o3-mini',
                mcp_server_url: mcpServerUrl,
                tools_discovered: availableTools,
                tools_used: mcpTool
            });

        } catch (error) {
            console.error('Error in /ai endpoint:', error);

            return res.status(500).json({
                error: 'Internal server error',
                details: error.message
            });
        }
    });

    // GET /ai endpoint for health check
    router.get('/', (req, res) => {
        res.json({
            status: 'AI endpoint is available',
            usage: {
                POST: 'Submit input for AI processing with MCP tools',
                body: {
                    input: 'string (required) - Your input text for the AI',
                    model: 'string (optional) - OpenAI model, defaults to o3-mini'
                }
            }
        });
    });

    return router;
}