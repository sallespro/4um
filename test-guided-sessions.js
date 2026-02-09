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
    console.log('🚀 Starting Guided Sessions API Tests...');

    // 1. Create Test User
    const email = `test-${Date.now()}@guided.com`;
    console.log(`\n👤 Creating test user: ${email}`);

    // We insert directly into public.users since auth.users is managed by Supabase Auth 
    // but our app seems to rely on public.users syncing or being the source of truth for app data linkage?
    // Let's check schema.sql... public.users exists. 
    // authMiddleware checks public.users.

    const { data: user, error: userError } = await supabase
        .from('users')
        .insert([{
            email,
            password_hash: 'dummy_hash_for_testing'
        }])
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
        // 3. Create Guided Session
        console.log('\n📝 Testing CREATE...');
        const newSession = {
            title: 'Test Session',
            description: 'A test guided session',
            questions: ['Q1?', 'Q2?']
        };

        const createRes = await fetch(`${API_URL}/guided-sessions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newSession)
        });

        if (!createRes.ok) throw new Error(`Create failed: ${createRes.status} ${await createRes.text()}`);
        const created = await createRes.json();

        if (created.title === newSession.title && created.questions.length === 2) {
            console.log('✅ Created successfully:', created.id);
        } else {
            throw new Error('Created data mismatch');
        }

        // 4. List Guided Sessions
        console.log('\nBn Testing LIST...');
        const listRes = await fetch(`${API_URL}/guided-sessions`, { headers });
        if (!listRes.ok) throw new Error(`List failed: ${listRes.status}`);
        const list = await listRes.json();

        const found = list.find(s => s.id === created.id);
        if (found) {
            console.log(`✅ Session found in list of ${list.length}`);
        } else {
            throw new Error('Session not found in list');
        }

        // 5. Update Guided Session
        console.log('\n✏️ Testing UPDATE...');
        const updateData = {
            title: 'Updated Title',
            questions: ['Q1?', 'Q2?', 'Q3?']
        };
        const updateRes = await fetch(`${API_URL}/guided-sessions/${created.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updateData)
        });

        if (!updateRes.ok) throw new Error(`Update failed: ${updateRes.status}`);
        const updated = await updateRes.json();

        if (updated.title === 'Updated Title' && updated.questions.length === 3) {
            console.log('✅ Updated successfully');
        } else {
            throw new Error('Update data mismatch');
        }

        // 6. Delete Guided Session
        console.log('\n🗑️ Testing DELETE...');
        const deleteRes = await fetch(`${API_URL}/guided-sessions/${created.id}`, {
            method: 'DELETE',
            headers
        });

        if (!deleteRes.ok) throw new Error(`Delete failed: ${deleteRes.status}`);
        console.log('✅ Deleted successfully');

        // Verify deletion
        const verifyRes = await fetch(`${API_URL}/guided-sessions/${created.id}`, { headers });
        if (verifyRes.status === 404) {
            console.log('✅ Verification confirmed: 404 Not Found');
        } else {
            throw new Error('Session still exists after delete');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    } finally {
        // Cleanup User
        console.log('\n🧹 Cleaning up...');
        await supabase.from('users').delete().eq('id', user.id);
        console.log('✅ Test user deleted');
    }
}

runTests();
