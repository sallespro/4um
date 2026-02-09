import fs from 'fs/promises';
import path from 'path';
import chokidar from 'chokidar';
import { generateEmbeddings, computeSimilarities, initializeEmbeddings } from './embeddings.js';

// In-memory store for document chunks and embeddings
let documentIndex = [];

/**
 * Chunk text into smaller pieces
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
 * Re-index a single file
 */
async function indexFile(pagesDir, filename) {
    try {
        const filePath = path.join(pagesDir, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const chunks = chunkText(content);

        // Remove old chunks for this file
        documentIndex = documentIndex.filter(doc => doc.file !== filename);

        // Add new chunks
        for (const chunk of chunks) {
            const [embedding] = await generateEmbeddings(chunk, 'document');
            documentIndex.push({
                file: filename,
                content: chunk,
                embedding,
            });
        }
        console.log(`  ✓ Indexed ${filename} (${chunks.length} chunks)`);
    } catch (error) {
        console.error(`  ✗ Failed to index ${filename}:`, error.message);
    }
}

/**
 * Initialize RAG by indexing markdown files
 */
export async function initializeRAG(pagesDir) {
    await initializeEmbeddings();

    const files = await fs.readdir(pagesDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    console.log(`📚 Initializing RAG: Indexing ${mdFiles.length} markdown files...`);

    for (const file of mdFiles) {
        await indexFile(pagesDir, file);
    }

    console.log(`✅ Initial indexing complete: ${documentIndex.length} total chunks`);
}

/**
 * Watch pages directory for changes and update index
 */
export function watchPages(pagesDir) {
    const watcher = chokidar.watch(pagesDir, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true // we already did initial indexing
    });

    console.log(`👁️  Watching for changes in ${pagesDir}...`);

    watcher
        .on('add', filename => {
            const base = path.basename(filename);
            if (base.endsWith('.md')) {
                console.log(`📄 File added: ${base}, re-indexing...`);
                indexFile(pagesDir, base);
            }
        })
        .on('change', filename => {
            const base = path.basename(filename);
            if (base.endsWith('.md')) {
                console.log(`✏️  File changed: ${base}, updating index...`);
                indexFile(pagesDir, base);
            }
        })
        .on('unlink', filename => {
            const base = path.basename(filename);
            if (base.endsWith('.md')) {
                console.log(`🗑️  File removed: ${base}, removing from index...`);
                documentIndex = documentIndex.filter(doc => doc.file !== base);
                console.log(`  ✓ Removed ${base}. Total chunks: ${documentIndex.length}`);
            }
        });

    return watcher;
}

/**
 * Search for relevant documents
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

export default { initializeRAG, watchPages, searchDocuments, getRAGContext };
