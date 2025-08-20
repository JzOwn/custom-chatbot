import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import { serve } from '@hono/node-server';
import { openai } from './openai.js';
import { query } from './db.js';

const app = new Hono();

app.use('*', cors());

// Health
app.get('/api/health', (c) => c.json({ ok: true }));

// Assistants
app.post('/api/assistant', async (c) => {
	try {
		const body = await c.req.json<{ name: string; instructions: string; model?: string }>();
		const { name, instructions, model } = body;
		if (!name || !instructions) return c.json({ error: 'name and instructions are required' }, 400);

		const created = await openai.beta.assistants.create({
			name,
			instructions,
			model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
		});

		const result = await query<{ id: number }>(
			'INSERT INTO assistants (open_ai_assistant_id, name, system_prompt) VALUES ($1, $2, $3) RETURNING id',
			[created.id, name, instructions]
		);

		return c.json({ id: result.rows[0].id, open_ai_assistant_id: created.id, name, system_prompt: instructions });
	} catch (err: any) {
		return c.json({ error: err?.message || 'Failed to create assistant' }, 500);
	}
});

app.put('/api/assistant/:id', async (c) => {
	try {
		const id = Number(c.req.param('id'));
		if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);
		const body = await c.req.json<{ name?: string; instructions?: string }>();
		const { name, instructions } = body;
		if (!name && !instructions) return c.json({ error: 'Nothing to update' }, 400);

		const existing = await query<{ open_ai_assistant_id: string }>('SELECT open_ai_assistant_id FROM assistants WHERE id=$1', [id]);
		if (existing.rows.length === 0) return c.json({ error: 'Assistant not found' }, 404);
		const openAiAssistantId = existing.rows[0].open_ai_assistant_id;

		await openai.beta.assistants.update(openAiAssistantId, {
			name: name || undefined,
			instructions: instructions || undefined,
		});

		const updates: string[] = [];
		const values: any[] = [];
		let idx = 1;
		if (name) {
			updates.push(`name=$${idx++}`);
			values.push(name);
		}
		if (instructions) {
			updates.push(`system_prompt=$${idx++}`);
			values.push(instructions);
		}
		values.push(id);
		await query(`UPDATE assistants SET ${updates.join(', ')} WHERE id=$${idx}`, values);

		const updated = await query('SELECT id, open_ai_assistant_id, name, system_prompt, created_at FROM assistants WHERE id=$1', [id]);
		return c.json(updated.rows[0]);
	} catch (err: any) {
		return c.json({ error: err?.message || 'Failed to update assistant' }, 500);
	}
});

app.get('/api/assistant', async (c) => {
	const res = await query('SELECT id, open_ai_assistant_id, name, system_prompt, created_at FROM assistants ORDER BY created_at');
	return c.json(res.rows);
});

app.get('/api/assistant/:id', async (c) => {
	const id = Number(c.req.param('id'));
	if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);
	const res = await query('SELECT id, open_ai_assistant_id, name, system_prompt, created_at FROM assistants WHERE id=$1', [id]);
	if (res.rows.length === 0) return c.json({ error: 'Not found' }, 404);
	return c.json(res.rows[0]);
});

// Threads
app.post('/api/thread/:assistantId', async (c) => {
	try {
		const assistantId = Number(c.req.param('assistantId'));
		if (!Number.isFinite(assistantId)) return c.json({ error: 'Invalid assistantId' }, 400);
		const assistantRes = await query<{ open_ai_assistant_id: string }>('SELECT open_ai_assistant_id FROM assistants WHERE id=$1', [assistantId]);
		if (assistantRes.rows.length === 0) return c.json({ error: 'Assistant not found' }, 404);

		const body = await c.req.json<{ title: string }>();
		const title = body?.title?.trim();
		if (!title) return c.json({ error: 'title is required' }, 400);

		const oaThread = await openai.beta.threads.create();
		const thrRes = await query<{ id: number; openai_threadid: string; thread_title: string; assistant_id: number }>(
			'INSERT INTO threads (openai_threadid, thread_title, assistant_id) VALUES ($1, $2, $3) RETURNING id, openai_threadid, thread_title, assistant_id',
			[oaThread.id, title, assistantId]
		);
		return c.json(thrRes.rows[0]);
	} catch (err: any) {
		return c.json({ error: err?.message || 'Failed to create thread' }, 500);
	}
});

app.get('/api/threads/:assistantId', async (c) => {
	const assistantId = Number(c.req.param('assistantId'));
	if (!Number.isFinite(assistantId)) return c.json({ error: 'Invalid assistantId' }, 400);
	const res = await query('SELECT id, openai_threadid, thread_title, assistant_id, created_at FROM threads WHERE assistant_id=$1 ORDER BY created_at DESC', [assistantId]);
	return c.json(res.rows);
});

// Messages
app.get('/api/messages/:threadId', async (c) => {
	const threadId = Number(c.req.param('threadId'));
	if (!Number.isFinite(threadId)) return c.json({ error: 'Invalid threadId' }, 400);
	const res = await query('SELECT id, thread_id, role, content, openai_message_id, created_at FROM messages WHERE thread_id=$1 ORDER BY created_at ASC', [threadId]);
	return c.json(res.rows);
});

// Sync messages from OpenAI
app.post('/api/sync/:threadId', async (c) => {
	try {
		const threadId = Number(c.req.param('threadId'));
		if (!Number.isFinite(threadId)) return c.json({ error: 'Invalid threadId' }, 400);

		const threadRow = await query<{ openai_threadid: string }>('SELECT openai_threadid FROM threads WHERE id=$1', [threadId]);
		if (threadRow.rows.length === 0) return c.json({ error: 'Thread not found' }, 404);

		const openaiThreadId = threadRow.rows[0].openai_threadid;
		
		// Delete all existing messages for this thread
		await query('DELETE FROM messages WHERE thread_id = $1', [threadId]);
		
		// Get messages from OpenAI
		const messages = await openai.beta.threads.messages.list(openaiThreadId, {
			order: 'asc'
		});

		let synced = 0;
		for (const message of messages.data) {
			const content = message.content[0]?.type === 'text' 
				? message.content[0].text.value 
				: '';
			
			// Insert fresh message from OpenAI
			const result = await query(
				`INSERT INTO messages (thread_id, role, content, openai_message_id, created_at) 
				 VALUES ($1, $2, $3, $4, $5) 
				 RETURNING id`,
				[threadId, message.role, content, message.id, new Date(message.created_at * 1000)]
			);
			if (result.rows.length > 0) synced++;
		}

		return c.json({ synced, total: messages.data.length, deleted: true });
	} catch (err: any) {
		return c.json({ error: err?.message || 'Failed to sync messages' }, 500);
	}
});

// Chat streaming
app.post('/api/chat/:assistantId', async (c) => {
	try {
		const assistantId = Number(c.req.param('assistantId'));
		if (!Number.isFinite(assistantId)) return c.json({ error: 'Invalid assistantId' }, 400);
		const body = await c.req.json<{ threadId: number; content: string }>();
		const { threadId, content } = body;
		if (!threadId || !content) return c.json({ error: 'threadId and content are required' }, 400);

		const assistantRow = await query<{ open_ai_assistant_id: string }>('SELECT open_ai_assistant_id FROM assistants WHERE id=$1', [assistantId]);
		if (assistantRow.rows.length === 0) return c.json({ error: 'Assistant not found' }, 404);
		const openAiAssistantId = assistantRow.rows[0].open_ai_assistant_id;

		const threadRow = await query<{ openai_threadid: string; assistant_id: number }>('SELECT openai_threadid, assistant_id FROM threads WHERE id=$1', [threadId]);
		if (threadRow.rows.length === 0) return c.json({ error: 'Thread not found' }, 404);
		if (threadRow.rows[0].assistant_id !== assistantId) return c.json({ error: 'Thread does not belong to assistant' }, 400);
		const openAiThreadId = threadRow.rows[0].openai_threadid;

		// Save user message locally
		const userMessage = await openai.beta.threads.messages.create(openAiThreadId, {
			role: 'user',
			content,
		});
		await query('INSERT INTO messages (thread_id, role, content, openai_message_id) VALUES ($1, $2, $3, $4)', [threadId, 'user', content, userMessage.id]);

		// Stream assistant response
		return streamSSE(c, async (stream) => {
			let assistantText = '';
			let messageSaved = false;
			let openaiMessageId: string | null = null;
			
			const saveMessage = async () => {
				if (assistantText.trim().length > 0 && !messageSaved) {
					try {
						await query('INSERT INTO messages (thread_id, role, content, openai_message_id) VALUES ($1, $2, $3, $4)', [threadId, 'assistant', assistantText, openaiMessageId]);
						messageSaved = true;
					} catch (err) {
						console.error('Failed to save assistant message:', err);
					}
				}
			};

			try {
				const runStream: any = await openai.beta.threads.runs.stream(openAiThreadId, {
					assistant_id: openAiAssistantId,
				});

				runStream.on('textCreated', (text: any) => {
					// Capture the message ID when text is created
					if (text.id) {
						openaiMessageId = text.id;
					}
				});

				runStream.on('textDelta', (delta: any) => {
					assistantText += delta.value || '';
					stream.writeSSE({ event: 'token', data: String(delta.value || '') });
				});

				runStream.on('messageCompleted', async (message: any) => {
					// Capture message ID if not already captured
					if (message?.id) {
						openaiMessageId = message.id;
					}
					// Save message when completed, don't wait for end
					await saveMessage();
					stream.writeSSE({ event: 'message_completed', data: 'done' });
				});

				runStream.on('end', async () => {
					// Fallback save in case messageCompleted didn't fire
					await saveMessage();
					stream.writeSSE({ event: 'done', data: '[DONE]' });
				});

				runStream.on('error', async (e: any) => {
					// Save message even on error if we have content
					await saveMessage();
					stream.writeSSE({ event: 'error', data: String(e?.message || 'stream error') });
				});

				await runStream.done();
			} catch (e: any) {
				// Save message even on exception if we have content
				await saveMessage();
				stream.writeSSE({ event: 'error', data: String(e?.message || 'Failed to stream') });
			}
		});
	} catch (err: any) {
		return c.json({ error: err?.message || 'Failed to send message' }, 500);
	}
});

const port = Number(process.env.PORT || 8787);
console.log(`Server listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });


