import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import OpenAI from 'openai';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
import { generatePDF } from '../lib/pdf.js';
import fs from 'fs';
import { resend } from '../lib/resend.js';
import { render } from '@react-email/render';
import { BundleEmail } from '../templates/BundleEmail.js';
import React from 'react';

// GET /api/bundles - List all bundles for the user
router.get('/', authMiddleware, async (req, res) => {
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
router.post('/', authMiddleware, async (req, res) => {
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
router.get('/:id', authMiddleware, async (req, res) => {
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
router.put('/:id', authMiddleware, async (req, res) => {
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
router.delete('/:id', authMiddleware, async (req, res) => {
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
router.post('/:id/run', authMiddleware, async (req, res) => {
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

        const systemPrompt = `You are an AI assistant tasked with analyzing multiple chat sessions to generate a professional PDF presentation.
The user will provide a "Bundle Prompt" which is your instruction, and "Context" which contains the content of several chat sessions.
Your goal is to follow the Bundle Prompt exactly, using the provided Context.
Always return your response in Markdown format.
CRITICAL: Use "---" on its own line to separate major sections or slides. Each "---" will trigger a new page in the generated PDF report.
Aim for a clean, structure presentation with one major topic per page.`;

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

        // Save result to DB
        const { data: savedResult, error: saveError } = await supabase
            .from('bundle_results')
            .insert([{
                bundle_id: id,
                result_content: result
            }])
            .select()
            .single();

        if (saveError) {
            console.error('Error saving result:', saveError);
        }

        res.json({ result, resultId: savedResult?.id });

    } catch (error) {
        console.error('Bundle run error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/bundles/:id/results - List results for a bundle
router.get('/:id/results', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const { data, error } = await supabase
            .from('bundle_results')
            .select('*')
            .eq('bundle_id', id)
            .order('created_at', { ascending: false });

        // Verify ownership via join or separate check if needed, 
        // but RLS should handle it. However, RLS policy for select uses EXISTS(bundles...)
        // so it should be fine.

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/bundles/results/:id/pdf - Generate and download PDF (PUBLIC)
router.get('/results/:id/pdf', optionalAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch result
        const { data: result, error } = await supabase
            .from('bundle_results')
            .select('*, bundles(title, user_id)')
            .eq('id', id)
            .single();

        if (error || !result) return res.status(404).json({ error: 'Result not found' });

        // 2. Generate PDF
        const filename = `result_${id}`;
        const title = result.bundles?.title || 'Bundle Result';
        const userEmail = req.user?.email || 'CloudPilot User';

        const pdfPath = await generatePDF(result.result_content, title, filename, userEmail);

        // 3. Serve PDF
        const isView = req.query.view === 'true';
        if (isView) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
            res.sendFile(pdfPath);
        } else {
            res.download(pdfPath, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`);
        }

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// POST /api/bundles/results/:id/email - Send result via email
router.post('/results/:id/email', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // 1. Fetch result
        const { data: result, error } = await supabase
            .from('bundle_results')
            .select('*, bundles(title, user_id)')
            .eq('id', id)
            .single();

        if (error || !result) return res.status(404).json({ error: 'Result not found' });

        if (result.bundles.user_id !== user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // 2. Prepare PDF (ensure it exists)
        const filename = `result_${id}`;
        const title = result.bundles?.title || 'Bundle Report';
        const userEmail = user.email;

        // Just ensure PDF is available (generates if missing)
        const pdfPath = await generatePDF(result.result_content, title, filename, userEmail);

        // 3. Prepare Email
        // We need an absolute URL for the PDF preview. 
        // In local dev, we'll use the server's address. 
        // In production, users should set a BASE_URL env var.
        const baseUrl = process.env.BASE_URL || `http://${req.get('host')}`;
        const pdfUrl = `${baseUrl}/api/bundles/results/${id}/pdf?view=true`;

        const emailHtml = await render(React.createElement(BundleEmail, {
            title,
            pdfUrl,
            userEmail
        }));

        // 4. Send Email
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'CloudPilot <onboarding@resend.dev>', // Resend default for testing
            to: [userEmail],
            subject: `Relatório Disponível: ${title}`,
            html: emailHtml,
        });

        if (emailError) {
            console.error('Resend error:', emailError);
            return res.status(500).json({ error: 'Failed to send email' });
        }

        res.json({ success: true, messageId: emailData.id });

    } catch (error) {
        console.error('Email send error:', error);
        res.status(500).json({ error: 'Failed to process email request' });
    }
});

export default router;
