import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * POST /api/webhooks/email
 * Receives email webhooks from Resend
 * Expects: { type: 'email.received', data: { ... } }
 */
router.post('/email', async (req, res) => {
    try {
        const event = req.body;

        // Only process email.received events
        if (event.type !== 'email.received') {
            return res.json({ received: true, processed: false });
        }

        const { data } = event;

        // Store the received email
        const { error } = await supabase
            .from('received_emails')
            .insert([{
                email_id: data.email_id,
                from_address: data.from,
                to_addresses: data.to || [],
                subject: data.subject,
                message_id: data.message_id,
                raw_data: data,
            }]);

        if (error) {
            console.error('❌ Failed to store email in Supabase:', JSON.stringify(error, null, 2));
            // Return error in response for debugging (only in development or specific tests)
            return res.status(500).json({
                received: true,
                processed: false,
                error: 'Database storage failed',
                details: error
            });
        }

        console.log(`📧 Received email from ${data.from}: ${data.subject}`);

        res.json({ received: true, processed: true });
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ received: true, error: error.message });
    }
});

/**
 * GET /api/webhooks/email
 * List received emails (for debugging)
 */
router.get('/email', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('received_emails')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
