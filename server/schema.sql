-- PostgreSQL schema for custom-chatbot

CREATE TABLE IF NOT EXISTS assistants (
	id SERIAL PRIMARY KEY,
	open_ai_assistant_id TEXT NOT NULL,
	name TEXT NOT NULL,
	system_prompt TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS threads (
	id SERIAL PRIMARY KEY,
	openai_threadid TEXT NOT NULL,
	thread_title TEXT NOT NULL,
	assistant_id INTEGER NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_type WHERE typname = 'message_role'
	) THEN
		CREATE TYPE message_role AS ENUM ('system', 'user', 'assistant');
	END IF;
END$$;

CREATE TABLE IF NOT EXISTS messages (
	id SERIAL PRIMARY KEY,
	thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
	role message_role NOT NULL,
	content TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_threads_assistant_id ON threads(assistant_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id_created_at ON messages(thread_id, created_at);


