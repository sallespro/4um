import fs from 'fs/promises';
import path from 'path';
import { generateEmbeddings, computeSimilarities, initializeEmbeddings } from './embeddings.js';

// In-memory store for document chunks and embeddings
let documentIndex = [];

/**
 * Chunk text into smaller pieces
 * @param {string} text - Text to chunk
 * @param {number} chunkSize - Maximum characters per chunk
 * @param {number} overlap - Overlap between chunks
 * @returns {string[]} - Array of chunks
 */
function chunkText(text, chunkSize = 500, overlap = 100) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end).trim());
        start = end - overlap;
        if (start >= text.length - overlap) break;
    }

    return chunks.filter(c => c.length > 0);
}

/**
 * Initialize RAG by indexing markdown files
 * @param {string} pagesDir - Path to the pages directory
 */
export async function initializeRAG(pagesDir) {
    await initializeEmbeddings();

    const files = await fs.readdir(pagesDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    console.log(`📚 Indexing ${mdFiles.length} markdown files...`);

    for (const file of mdFiles) {
        const filePath = path.join(pagesDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const chunks = chunkText(content);

        for (const chunk of chunks) {
            const [embedding] = await generateEmbeddings(chunk, 'document');
            documentIndex.push({
                file,
                content: chunk,
                embedding,
            });
        }

        console.log(`  ✓ Indexed ${file} (${chunks.length} chunks)`);
    }

    console.log(`✅ Indexed ${documentIndex.length} total chunks`);
}

/**
 * Search for relevant documents
 * @param {string} query - Search query
 * @param {number} topK - Number of results to return
 * @returns {Promise<Array>} - Ranked results
 */
export async function searchDocuments(query, topK = 3) {
    if (documentIndex.length === 0) {
        return [];
    }

    const [queryEmbedding] = await generateEmbeddings(query, 'query');
    const documentEmbeddings = documentIndex.map(doc => doc.embedding);
    const similarities = computeSimilarities(queryEmbedding, documentEmbeddings);

    // Rank and return top-k
    const ranked = similarities
        .map((score, index) => ({
            ...documentIndex[index],
            score,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    // Remove embedding from response
    return ranked.map(({ embedding, ...rest }) => rest);
}

/**
 * Get context for a chat query
 * @param {string} query - User's message
 * @returns {Promise<string>} - Context string
 */
export async function getRAGContext(query) {
    const results = await searchDocuments(query, 3);

    if (results.length === 0) {
        return null;
    }

    return results
        .map((r, i) => `[${i + 1}] From ${r.file}:\n${r.content}`)
        .join('\n\n');
}

export default { initializeRAG, searchDocuments, getRAGContext };
