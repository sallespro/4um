import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRouter from './routes/auth.js';
import chatRouter from './routes/chat.js';
import sessionsRouter from './routes/sessions.js';
import ragRouter from './routes/rag.js';
import webhooksRouter from './routes/webhooks.js';
import guidedSessionsRouter from './routes/guided-sessions.js';
import bundlesRouter from './routes/bundles.js';

// Middleware
import { authMiddleware } from './middleware/auth.js';

// Services
import { initializeRAG, watchPages } from './services/rag.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Public routes (no auth required)
app.use('/api/auth', authRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/rag', ragRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes (auth required)
app.use('/api/chat', authMiddleware, chatRouter);
app.use('/api/sessions', authMiddleware, sessionsRouter);
app.use('/api/guided-sessions', authMiddleware, guidedSessionsRouter);
app.use('/api/bundles', authMiddleware, bundlesRouter);

// Serve static files from Vite build in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    // Handle client-side routing
    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// Initialize RAG and start server
async function startServer() {
    const pagesDir = path.join(__dirname, '../pages');
    console.log('🚀 Initializing RAG system...');
    await initializeRAG(pagesDir);
    console.log('✅ RAG system initialized');

    // Start watching for changes
    watchPages(pagesDir);

    app.listen(PORT, () => {
        console.log(`🌐 Server running at http://localhost:${PORT}`);
    });
}

startServer().catch(console.error);

export default app;
