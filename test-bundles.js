import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'cloudpilot-secret-key';
const API_URL = 'http://localhost:3001/api';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runTests() {
    console.log('🚀 Starting Bundles API Tests...');

    // 1. Create Test User
    const email = `test-bundle-${Date.now()}@guided.com`;
    console.log(`\n👤 Creating test user: ${email}`);

    const { data: user, error: userError } = await supabase
        .from('users')
        .insert([{ email, password_hash: 'dummy' }]) // password_hash is optional but good practice
        .select()
        .single();

    if (userError) {
        console.error('Failed to create user:', userError);
        process.exit(1);
    }
    console.log('✅ User created:', user.id);

    // 2. Generate Token
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        // 3. Create Dummy Sessions & Messages
        console.log('\n📝 Creating dummy sessions...');
        const { data: session1 } = await supabase.from('sessions').insert([{ user_id: user.id, title: 'Session 1' }]).select().single();
        const { data: session2 } = await supabase.from('sessions').insert([{ user_id: user.id, title: 'Session 2' }]).select().single();

        await supabase.from('messages').insert([
            { session_id: session1.id, user_id: user.id, role: 'user', content: 'The sky is blue.' },
            { session_id: session1.id, user_id: user.id, role: 'assistant', content: 'Correct.' },
            { session_id: session2.id, user_id: user.id, role: 'user', content: 'Grass is green.' },
            { session_id: session2.id, user_id: user.id, role: 'assistant', content: 'Indeed.' }
        ]);
        console.log('✅ Dummy sessions created:', [session1.id, session2.id]);

        // 4. Create Bundle
        console.log('\n📦 Testing CREATE Bundle...');
        const newBundle = {
            title: 'Test Bundle',
            prompt: 'Summarize the colors mentioned.',
            target_session_ids: [session1.id, session2.id]
        };

        const createRes = await fetch(`${API_URL}/bundles`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newBundle)
        });

        if (!createRes.ok) throw new Error(`Create failed: ${createRes.status} ${await createRes.text()}`);
        const created = await createRes.json();
        console.log('✅ Bundle created:', created.id);

        // 5. Run Bundle (Generation)
        console.log('\n⚙️ Testing RUN Bundle...');
        const runRes = await fetch(`${API_URL}/bundles/${created.id}/run`, {
            method: 'POST',
            headers
        });

        if (!runRes.ok) throw new Error(`Run failed: ${runRes.status} ${await runRes.text()}`);
        const runResult = await runRes.json();
        console.log('✅ Bundle Result:', runResult.result ? 'Recieved Output' : 'No Output');
        console.log('   Preview:', runResult.result.slice(0, 100) + '...');

        // 6. Delete Bundle
        console.log('\n🗑️ Testing DELETE Bundle...');
        const deleteRes = await fetch(`${API_URL}/bundles/${created.id}`, {
            method: 'DELETE',
            headers
        });
        if (!deleteRes.ok) throw new Error(`Delete failed: ${deleteRes.status}`);
        console.log('✅ Bundle deleted');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await supabase.from('users').delete().eq('id', user.id);
        console.log('✅ Test user deleted');
    }
}

runTests();
