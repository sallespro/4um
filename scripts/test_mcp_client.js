import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_URL = 'http://localhost:3001/api/mcp';
const TEST_EMAIL = 'cloud2pilot@gmail.com';

async function test() {
    console.log('--- MCP Client Test ---\n');

    // 1. Create client and connect
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));

    console.log('Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected!\n');

    // 2. List tools
    console.log('Listing tools...');
    const { tools } = await client.listTools();
    console.log('Available tools:', tools.map(t => t.name));

    const askTool = tools.find(t => t.name === 'ask');
    if (!askTool) {
        console.error('❌ "ask" tool not found!');
        await client.close();
        return;
    }
    console.log('✅ "ask" tool found!\n');
    console.log('Schema:', JSON.stringify(askTool.inputSchema, null, 2), '\n');

    // 3. Call ask tool with batch questions
    console.log('Calling ask tool with batch questions...');
    const result = await client.callTool({
        name: 'ask',
        arguments: {
            email: TEST_EMAIL,
            questions: [
                'What is CloudPilot and what can it do?',
                'How does the bundle feature work?'
            ],
        },
    });

    console.log('\n--- Result ---');
    for (const content of result.content) {
        console.log(content.text);
    }

    if (result.isError) {
        console.error('\n❌ Tool returned an error.');
    } else {
        console.log('\n✅ Tool call succeeded!');
    }

    // 4. Cleanup
    await client.close();
    console.log('\nDisconnected. Test complete.');
}

test().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
