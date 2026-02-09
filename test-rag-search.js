import { initializeRAG, searchDocuments } from './server/services/rag.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testRAG() {
    const pagesDir = path.join(__dirname, 'pages');
    console.log('--- Initializing RAG ---');
    await initializeRAG(pagesDir);

    const queries = [
        "qual o nome das empresas investidas pela area de venture capital?",
        "Quem é Liqi?",
        "investimentos venture capital"
    ];

    for (const query of queries) {
        console.log(`\n--- Testing Query: "${query}" ---`);
        const results = await searchDocuments(query, 5);
        if (results.length === 0) {
            console.log("No results found.");
        } else {
            results.forEach((r, i) => {
                console.log(`[${i + 1}] Score: ${r.score.toFixed(4)} | File: ${r.file}`);
                console.log(`Content: ${r.content.substring(0, 200)}...`);
            });
        }
    }
}

testRAG().catch(console.error);
