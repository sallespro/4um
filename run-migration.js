import fs from 'fs';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.VITE_SUPABASE_URL;
const dbKey = process.env.SUPABASE_ACCESS_TOKEN; // Using access token as password for connection pooling if enabled, or direct connection string if available. 

// Construct connection string for Supabase pooling (transaction mode usually port 6543)
// Format: postgres://[db-user]:[db-password]@aws-0-[region].pooler.supabase.com:6543/[db-name]
// We need to parse project ref from URL
const projectRef = dbUrl.replace('https://', '').split('.')[0];
const region = 'sa-east-1'; // User's region from previous error message
// Password is actually usually the DB password, not access token. 
// However, the previous psql command failed because psql wasn't found, not auth. 
// AND the user provided `SUPABASE_ACCESS_TOKEN` which might be the DB password or the CLI token.
// Let's assume the user meant the DB password when they said "credentials at .env". 
// Wait, `SUPABASE_ACCESS_TOKEN` usually is for management API. 
// But let's try to connect using the connection string format for Supabase.

// connectionString: `postgres://postgres.${projectRef}:${process.env.SUPABASE_ACCESS_TOKEN}@aws-0-${region}.pooler.supabase.com:6543/postgres`
// The password might be wrong if SUPABASE_ACCESS_TOKEN is not the DB password. 
// But let's try. 

// If that fails, we might need the actual DB password which isn't in .env usually.
// Alternative: Use Supabase Management API via `supabase-js` if possible to run SQL? No.
// Alternative: Use `supabase db push` with linking? 

async function run() {
    const client = new pg.Client({
        connectionString: `postgres://postgres.${projectRef}:${process.env.SUPABASE_ACCESS_TOKEN}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sqlPath = path.join('/Users/rrocsal/.gemini/antigravity/brain/5e588cb8-954a-49cc-ab5b-841769b5a850/migrations/guided_sessions.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log('Migration executed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

run();
