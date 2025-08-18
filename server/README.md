Backend (Hono + PostgreSQL + OpenAI)

Quick start

1. Copy environment variables

   - Create a `.env` file in `server/` using the following keys:

   OPENAI_API_KEY=your_key
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/custom_chatbot
   PORT=8787

2. Install and run

   - From `server/`:

   npm i
   npm run dev

Database schema (no migration)

Run the SQL below in your PostgreSQL database:

```sql
-- assistants
CREATE TABLE IF NOT EXISTS assistants (
    id SERIAL PRIMARY KEY,
    open_ai_assistant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- threads
CREATE TABLE IF NOT EXISTS threads (
    id SERIAL PRIMARY KEY,
    openai_threadid TEXT NOT NULL,
    assistant_id INTEGER NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- messages
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

CREATE INDEX IF NOT EXISTS idx_threads_assistant_id ON threads(assistant_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id_created_at ON messages(thread_id, created_at);
```

API

- POST `/api/assistant` body: `{ name, instructions, model? }`
- PUT `/api/assistant/:id` body: `{ name?, instructions? }`
- GET `/api/assistant`
- GET `/api/assistant/:id`
- POST `/api/thread/:assistantId` body: `{ title }`
- GET `/api/threads/:assistantId`
- GET `/api/messages/:threadId`
- POST `/api/chat/:assistantId` body: `{ threadId, content }` (Server-Sent Events stream: `token`, `message_completed`, `done`, `error`)

Notes

- Uses OpenAI Assistants v2, threads, and streamed runs.
- Store OpenAI Assistant ID alongside local assistant row.

