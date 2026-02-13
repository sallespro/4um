import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Service Role Key');
} else {
    try {
        const url = new URL(supabaseUrl);
        console.log(`📡 Supabase client initialized for: ${url.hostname}`);
    } catch (e) {
        console.error('❌ Invalid Supabase URL format:', supabaseUrl);
    }
}

export const supabase = createClient(supabaseUrl, supabaseKey);
