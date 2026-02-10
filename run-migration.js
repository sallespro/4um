import fs from 'fs';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.VITE_SUPABASE_URL;
const dbKey = process.env.SUPABASE_ACCESS_TOKEN;

// Construct connection string for Supabase pooling (transaction mode usually port 6543)
// Format: postgres://[db-user]:[db-password]@aws-0-[region].pooler.supabase.com:6543/[db-name]
const projectRef = dbUrl.replace('https://', '').split('.')[0];
const region = 'sa-east-1'; // Default region, might need adjustment

async function run() {
    console.log(`Connecting to project ${projectRef} in ${region}...`);
    const client = new pg.Client({
        connectionString: `postgres://postgres.${projectRef}:${dbKey}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sqlPath = path.join(__dirname, 'supabase/migrations/20260209213000_bundle_results.sql');
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
