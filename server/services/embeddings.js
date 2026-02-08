import { AutoModel, AutoTokenizer, matmul } from '@huggingface/transformers';

let model = null;
let tokenizer = null;

const MODEL_ID = 'onnx-community/embeddinggemma-300m-ONNX';

/**
 * Initialize the embedding model
 */
export async function initializeEmbeddings() {
    if (model && tokenizer) return;

    console.log('📦 Loading embedding model...');
    tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
    model = await AutoModel.from_pretrained(MODEL_ID, {
        dtype: 'q8', // Quantized for faster inference, less memory
    });
    console.log('✅ Embedding model loaded');
}

/**
 * Generate embeddings for text
 * @param {string|string[]} texts - Text or array of texts to embed
 * @param {string} type - 'query' or 'document'
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export async function generateEmbeddings(texts, type = 'document') {
    if (!model || !tokenizer) {
        await initializeEmbeddings();
    }

    const prefixes = {
        query: 'task: search result | query: ',
        document: 'title: none | text: ',
    };

    const textsArray = Array.isArray(texts) ? texts : [texts];
    const prefixedTexts = textsArray.map(t => prefixes[type] + t);

    const inputs = await tokenizer(prefixedTexts, { padding: true });
    const { sentence_embedding } = await model(inputs);

    return sentence_embedding.tolist();
}

/**
 * Compute cosine similarity between query and documents
 * @param {number[]} queryEmbedding - Query embedding vector
 * @param {number[][]} documentEmbeddings - Array of document embedding vectors
 * @returns {number[]} - Similarity scores
 */
export function computeSimilarities(queryEmbedding, documentEmbeddings) {
    const similarities = documentEmbeddings.map(docEmb => {
        const dotProduct = queryEmbedding.reduce((sum, val, i) => sum + val * docEmb[i], 0);
        const normQuery = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
        const normDoc = Math.sqrt(docEmb.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (normQuery * normDoc);
    });
    return similarities;
}

export default { initializeEmbeddings, generateEmbeddings, computeSimilarities };
