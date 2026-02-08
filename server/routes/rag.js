import { Router } from 'express';
import { searchDocuments } from '../services/rag.js';

const router = Router();

/**
 * GET /api/rag/search
 * Search documents using RAG
 * Query params: q (query), k (top-k results, default 3)
 */
router.get('/search', async (req, res) => {
    try {
        const { q, k = 3 } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const results = await searchDocuments(q, parseInt(k, 10));
        res.json({ query: q, results });
    } catch (error) {
        console.error('RAG search error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
