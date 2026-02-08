import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/login
 * Email-only login - creates user if doesn't exist
 * Body: { email }
 */
router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Valid email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Try to find existing user
        let { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .single();

        // Create new user if doesn't exist
        if (error || !user) {
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([{ email: normalizedEmail }])
                .select()
                .single();

            if (createError) {
                throw createError;
            }
            user = newUser;
        }

        // Generate JWT token
        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/auth/me
 * Get current user from token
 */
router.get('/me', authMiddleware, async (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            email: req.user.email,
            created_at: req.user.created_at,
        },
    });
});

export default router;
