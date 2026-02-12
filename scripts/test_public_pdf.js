
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BASE_URL = 'http://localhost:3001';

async function test() {
    try {
        console.log('--- Public PDF Access Test ---');

        // 1. Get a recent result ID
        const { data: result, error } = await supabase
            .from('bundle_results')
            .select('id')
            .limit(1)
            .single();

        if (error || !result) {
            console.error('No results found to test with.');
            return;
        }

        const resultId = result.id;
        console.log(`Testing with result ID: ${resultId}`);

        // 2. Test Public Access (No Auth Header)
        console.log('\nTesting PUBLIC PDF access (No Auth)...');
        const pubResponse = await fetch(`${BASE_URL}/api/bundles/results/${resultId}/pdf?view=true`);
        console.log('Status:', pubResponse.status);
        if (pubResponse.ok && pubResponse.headers.get('content-type') === 'application/pdf') {
            console.log('✅ SUCCESS: Public PDF access works!');
        } else {
            console.log('❌ FAILED: Public PDF access rejected or wrong content type.');
        }

        // 3. Test Private Access (Should be blocked)
        console.log('\nTesting PRIVATE bundle listing (No Auth)...');
        const privResponse = await fetch(`${BASE_URL}/api/bundles/`);
        console.log('Status:', privResponse.status);
        if (privResponse.status === 401 || privResponse.status === 403) {
            console.log('✅ SUCCESS: Management route properly protected.');
        } else {
            console.log('❌ FAILED: Management route is too permissive!');
        }

    } catch (err) {
        console.error('Test error:', err);
    }
}

test();
