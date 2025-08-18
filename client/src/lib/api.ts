export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787'

export type Assistant = {
	id: number
	open_ai_assistant_id: string
	name: string
	system_prompt: string
	created_at: string
}

export type Thread = {
	id: number
	openai_threadid: string
	thread_title: string
	assistant_id: number
	created_at: string
}

export type Message = {
	id: number
	thread_id: number
	role: 'system' | 'user' | 'assistant'
	content: string
	created_at: string
}

async function json<T>(res: Response): Promise<T> {
	if (!res.ok) {
		let msg = ''
		try { msg = (await res.json()).error } catch { msg = await res.text() }
		throw new Error(msg || `HTTP ${res.status}`)
	}
	return res.json() as Promise<T>
}

export const api = {
	listAssistants(): Promise<Assistant[]> {
		return fetch(`${API_BASE}/api/assistant`).then(res => json<Assistant[]>(res))
	},
	createAssistant(payload: { name: string; instructions: string; model?: string }): Promise<Assistant> {
		return fetch(`${API_BASE}/api/assistant`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}).then(res => json<Assistant>(res))
	},
	updateAssistant(id: number, payload: { name?: string; instructions?: string }): Promise<Assistant> {
		return fetch(`${API_BASE}/api/assistant/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}).then(res => json<Assistant>(res))
	},
	getAssistant(id: number): Promise<Assistant> {
		return fetch(`${API_BASE}/api/assistant/${id}`).then(res => json<Assistant>(res))
	},
	createThread(assistantId: number, title: string): Promise<Thread> {
		return fetch(`${API_BASE}/api/thread/${assistantId}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title }),
		}).then(res => json<Thread>(res))
	},
	listThreads(assistantId: number): Promise<Thread[]> {
		return fetch(`${API_BASE}/api/threads/${assistantId}`).then(res => json<Thread[]>(res))
	},
	listMessages(threadId: number): Promise<Message[]> {
		return fetch(`${API_BASE}/api/messages/${threadId}`).then(res => json<Message[]>(res))
	},
}