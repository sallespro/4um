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
            console.error('Failed to store email:', error);
            // Still return 200 to acknowledge receipt
        }

        console.log(`📧 Received email from ${data.from}: ${data.subject}`);

        res.json({ received: true, processed: true });
    } catch (error) {
        console.error('Webhook error:', error);
        // Return 200 to prevent retries
        res.json({ received: true, error: error.message });
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
