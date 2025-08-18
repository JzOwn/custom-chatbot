import 'dotenv/config';
import { Pool } from 'pg';
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
}
export const pool = new Pool({ connectionString: databaseUrl });
export async function query(text, params) {
    return pool.query(text, params);
}
