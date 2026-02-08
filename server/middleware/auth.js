import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cloudpilot-secret-key';

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id and email
 * @returns {string} - JWT token
 */
export function generateToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded token or null
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Authentication middleware
 * Extracts user from JWT and attaches to req.user
 */
export async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user from database
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

    if (error || !user) {
        return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export async function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (decoded) {
            const { data: user } = await supabase
                .from('users')
                .select('*')
                .eq('id', decoded.userId)
                .single();

            if (user) {
                req.user = user;
            }
        }
    }

    next();
}

export default { generateToken, verifyToken, authMiddleware, optionalAuthMiddleware };
