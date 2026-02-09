import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import OpenAI from 'openai';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET /api/bundles - List all bundles for the user
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const { data, error } = await supabase
            .from('bundles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Bundles list error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/bundles - Create a new bundle
router.post('/', async (req, res) => {
    try {
        const { title, prompt, target_session_ids } = req.body;
        const user = req.user;

        if (!title || !prompt) {
            return res.status(400).json({ error: 'Title and prompt are required' });
        }

        const { data, error } = await supabase
            .from('bundles')
            .insert([{
                user_id: user.id,
                title,
                prompt,
                target_session_ids: target_session_ids || []
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Create bundle error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/bundles/:id - Get a specific bundle
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const { data, error } = await supabase
            .from('bundles')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Bundle not found' });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/bundles/:id - Update a bundle
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, prompt, target_session_ids } = req.body;
        const user = req.user;

        const { data, error } = await supabase
            .from('bundles')
            .update({
                title,
                prompt,
                target_session_ids,
                updated_at: new Date()
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/bundles/:id - Delete a bundle
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const { error } = await supabase
            .from('bundles')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/bundles/:id/run - Execute a bundle
router.post('/:id/run', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // 1. Fetch Bundle
        const { data: bundle, error: bundleError } = await supabase
            .from('bundles')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (bundleError || !bundle) return res.status(404).json({ error: 'Bundle not found' });

        // 2. Fetch Sessions Content
        const sessionIds = bundle.target_session_ids;
        if (!sessionIds || sessionIds.length === 0) {
            return res.status(400).json({ error: 'No sessions selected in this bundle' });
        }

        // Fetch messages for all selected sessions
        // We need to fetch messages where session_id is IN sessionIds AND user_id is user.id
        // Supabase-js 'in' filter: .in('session_id', sessionIds)
        const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('session_id, role, content, created_at')
            .in('session_id', sessionIds)
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (msgError) throw msgError;

        // Group messages by session for clarity in context
        // Or just provide a flat context stream if order matters across sessions?
        // Usually grouping by session is better context.
        const sessionContexts = sessionIds.map(sid => {
            const sessionMsgs = messages.filter(m => m.session_id === sid);
            if (sessionMsgs.length === 0) return '';
            return `Session ID: ${sid}\n` + sessionMsgs.map(m => `${m.role}: ${m.content}`).join('\n');
        }).join('\n\n---\n\n');

        const systemPrompt = `You are an AI assistant tasked with analyzing multiple chat sessions to generate a specific output.
The user will provide a "Bundle Prompt" which is your instruction, and "Context" which contains the content of several chat sessions.
Your goal is to follow the Bundle Prompt exactly, using the provided Context.
Always return your response in Markdown format suitable for a presentation or report.`;

        const userContent = `Context:\n${sessionContexts}\n\nBundle Prompt:\n${bundle.prompt}`;

        // 3. Call OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent }
            ],
            temperature: 0.7,
        });

        const result = completion.choices[0].message.content;

        res.json({ result });

    } catch (error) {
        console.error('Bundle run error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
