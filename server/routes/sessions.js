import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * GET /api/sessions
 * List all chat sessions for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const user = req.user;

        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Sessions list error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/sessions
 * Create a new session for the authenticated user
 * Body: { title? }
 */
router.post('/', async (req, res) => {
    try {
        const { title } = req.body;
        const user = req.user;

        const { data, error } = await supabase
            .from('sessions')
            .insert([{ title: title || 'New Chat', user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Session create error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/sessions/:id/messages
 * Get messages for a session (must belong to user)
 */
router.get('/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Verify session belongs to user
        const { data: session } = await supabase
            .from('sessions')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('session_id', id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Messages list error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/sessions/:id
 * Delete a session and its messages (must belong to user)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // Verify session belongs to user
        const { data: session } = await supabase
            .from('sessions')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Delete messages first (cascade should handle this but being explicit)
        await supabase.from('messages').delete().eq('session_id', id);

        // Delete session
        const { error } = await supabase.from('sessions').delete().eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Session delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
