
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'cloudpilot-secret-key';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BASE_URL = 'http://localhost:3001';

async function test() {
    try {
        console.log('--- Email Delivery Test ---');

        // 1. Get/Create a user in public.users with the specific email Resend allows
        const testEmail = 'cloud2pilot@gmail.com';
        let { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', testEmail)
            .single();

        if (userError || !user) {
            console.log('Test user not found in public.users. Creating one...');
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([{
                    email: testEmail,
                    password_hash: 'not-needed',
                    full_name: 'Resend Verified User'
                }])
                .select()
                .single();
            if (createError) throw createError;
            user = newUser;
        }
        console.log(`Using user: ${user.email} (${user.id})`);

        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            aud: 'authenticated',
            role: 'authenticated'
        }, JWT_SECRET, { expiresIn: '1h' });

        // 2. Find a bundle or create one if needed
        let { data: bundles, error: bError } = await supabase
            .from('bundles')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

        if (bError || !bundles || bundles.length === 0) {
            console.log('No bundles found for this user. Creating a test bundle...');
            const { data: newBundle, error: nbError } = await supabase
                .from('bundles')
                .insert([{
                    user_id: user.id,
                    title: 'Test Email Bundle',
                    prompt: 'Summarize our sessions.',
                    target_session_ids: []
                }])
                .select()
                .single();
            if (nbError) throw nbError;
            bundles = [newBundle];
        }
        const bundleId = bundles[0].id;
        console.log(`Using bundle: ${bundleId}`);

        // 3. Create a mock result if none exists
        let resultId;
        const { data: results, error: rError } = await supabase
            .from('bundle_results')
            .select('id')
            .eq('bundle_id', bundleId)
            .limit(1);

        if (rError || !results || results.length === 0) {
            console.log('Creating mock result...');
            const { data: newResult, error: nrError } = await supabase
                .from('bundle_results')
                .insert([{
                    bundle_id: bundleId,
                    result_content: '# Test Title\n\nContent for testing email.\n\n---\n\n# Page 2\nMore content.'
                }])
                .select()
                .single();
            if (nrError) throw nrError;
            resultId = newResult.id;
        } else {
            resultId = results[0].id;
        }
        console.log(`Using result: ${resultId}`);

        // 4. Call Email API
        console.log('Calling Email API...');
        const response = await fetch(`${BASE_URL}/api/bundles/results/${resultId}/email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);

        if (response.ok) {
            console.log('\n✅ Success! Email request processed.');
        } else {
            console.log('\n❌ Failed to send email.');
        }

    } catch (err) {
        console.error('Test error:', err);
    }
}

test();
