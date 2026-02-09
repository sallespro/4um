import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * GET /api/guided-sessions
 * List all guided sessions for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const user = req.user;

        const { data, error } = await supabase
            .from('guided_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Guided sessions list error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/guided-sessions
 * Create a new guided session
 */
router.post('/', async (req, res) => {
    try {
        const { title, description, questions } = req.body;
        const user = req.user;

        if (!title || !questions || !Array.isArray(questions)) {
            return res.status(400).json({ error: 'Invalid input' });
        }

        const { data, error } = await supabase
            .from('guided_sessions')
            .insert([{
                title,
                description,
                questions,
                user_id: user.id
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Guided session create error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/guided-sessions/:id
 * Get a specific guided session
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const { data, error } = await supabase
            .from('guided_sessions')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Guided session not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Guided session get error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/guided-sessions/:id
 * Update a guided session
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, questions } = req.body;
        const user = req.user;

        const updates = {
            updated_at: new Date().toISOString()
        };

        if (title) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (questions) updates.questions = questions;

        const { data, error } = await supabase
            .from('guided_sessions')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Guided session update error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/guided-sessions/:id
 * Delete a guided session
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const { error } = await supabase
            .from('guided_sessions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Guided session delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
