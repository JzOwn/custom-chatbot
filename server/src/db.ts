import 'dotenv/config';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL is not set');
}

export const pool = new Pool({ connectionString: databaseUrl });

export type DbAssistant = {
	id: number;
	open_ai_assistant_id: string;
	name: string;
	system_prompt: string;
	created_at: string;
};

export type DbThread = {
	id: number;
	openai_threadid: string;
	thread_title: string;
	assistant_id: number;
	created_at: string;
};

export type DbMessage = {
	id: number;
	thread_id: number;
	role: 'system' | 'user' | 'assistant';
	content: string;
	created_at: string;
};

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
	return pool.query(text, params);
}


