import { Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from '../mcp/mcpServer.js';

const router = Router();

/**
 * POST /api/mcp — StreamableHTTP handler
 * Creates a fresh server + transport per request (stateless pattern).
 */
router.post('/', async (req, res) => {
    const server = createMcpServer();
    try {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // stateless
        });

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);

        res.on('close', () => {
            transport.close();
            server.close();
        });
    } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error',
                },
                id: null,
            });
        }
    }
});

/**
 * GET /api/mcp — Not supported (SSE not needed for stateless)
 */
router.get('/', (req, res) => {
    res.writeHead(405).end(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed.' },
        id: null,
    }));
});

/**
 * DELETE /api/mcp — Not supported
 */
router.delete('/', (req, res) => {
    res.writeHead(405).end(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed.' },
        id: null,
    }));
});

export default router;
