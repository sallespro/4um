/**
 * Test script: External MCP server fetch tool integration
 * Tests the chat API with an external MCP server URL
 */
import 'dotenv/config';

const API_URL = 'http://localhost:3001';
const TEST_EMAIL = 'cloud2pilot@gmail.com';
const MCP_SERVER_URL = 'https://cool.cloudpilot.com.br/mcp';

async function getToken() {
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_EMAIL }),
    });
    const data = await res.json();
    return data.token;
}

async function test() {
    console.log('--- External MCP Fetch Tool Test ---\n');

    // 1. Get auth token
    console.log('Authenticating...');
    const token = await getToken();
    console.log('✅ Authenticated\n');

    // 2. Create a session
    console.log('Creating session...');
    const sessionRes = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title: 'MCP Fetch Test' }),
    });
    const session = await sessionRes.json();
    console.log('✅ Session created:', session.id, '\n');

    // 3. Send chat message with MCP server URL
    console.log('Sending chat message with MCP fetch tool...');
    console.log('MCP Server:', MCP_SERVER_URL);
    console.log('Message: Fetch https://r.jina.ai/https://www.4um.com.br and summarize\n');

    const chatRes = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            sessionId: session.id,
            message: 'Use the fetch tool to get content from https://r.jina.ai/https://www.4um.com.br and tell me a brief summary of what this company does.',
            mcpServerUrl: MCP_SERVER_URL,
        }),
    });

    if (!chatRes.ok) {
        const err = await chatRes.text();
        console.error('❌ Chat failed:', err);
        process.exit(1);
    }

    const chatData = await chatRes.json();
    console.log('--- AI Response ---');
    console.log(chatData.response);
    console.log('\n--- Usage ---');
    console.log(chatData.usage);
    console.log('\n✅ Test complete!');
}

test().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
