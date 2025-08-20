import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, API_BASE, Assistant, Thread, Message } from '../lib/api'
import { streamChat } from '../lib/stream'

type Theme = 'light' | 'dark'

type State = {
	assistants: Assistant[]
	threads: Thread[]
	messages: Message[]
	selectedAssistantId?: number
	selectedAssistant?: Assistant
	selectedThreadId?: number
	loading: boolean
	streaming: boolean
	error?: string
	theme: Theme
}

type Actions = {
	loadAssistants: () => Promise<void>
	selectAssistant: (id: number | undefined) => Promise<void>
	createAssistant: (name: string, instructions: string) => Promise<void>
	updateAssistant: (id: number, p: { name?: string; instructions?: string }) => Promise<void>

	createThread: (assistantId: number, title: string) => Promise<void>
	loadThreads: (assistantId: number) => Promise<void>
	selectThread: (id: number | undefined) => Promise<void>
	loadMessages: (threadId: number) => Promise<void>

	sendMessage: (assistantId: number, threadId: number, content: string) => Promise<void>
	
	setTheme: (theme: Theme) => void
	toggleTheme: () => void
}

export const useAppStore = create<State & Actions>()(
	persist(
		(set, get) => ({
			assistants: [],
			threads: [],
			messages: [],
			selectedAssistantId: undefined,
			selectedAssistant: undefined,
			selectedThreadId: undefined,
			loading: false,
			streaming: false,
			error: undefined,
			theme: 'dark',

			loadAssistants: async () => {
				set({ loading: true, error: undefined })
				try {
					const data = await api.listAssistants()
					set({ assistants: data,selectedAssistantId: data[0].id,selectedAssistant: data[0] })
				} catch (e: any) {
					set({ error: e.message })
				} finally {
					set({ loading: false })
				}
			},

			selectAssistant: async (id) => {
				set({ selectedAssistantId: id,
					 selectedAssistant: get().assistants.find(a => a.id === id),
					  selectedThreadId: undefined, messages: [] 
					})
				if (id) await get().loadThreads(id)
			},

			createAssistant: async (name, instructions) => {
				set({ loading: true, error: undefined })
				try {
					const a = await api.createAssistant({ name, instructions })
					set({ assistants: [a, ...get().assistants], selectedAssistantId: a.id })
					await get().loadThreads(a.id)
				} catch (e: any) {
					set({ error: e.message })
				} finally {
					set({ loading: false })
				}
			},

			updateAssistant: async (id, p) => {
				set({ loading: true, error: undefined })
				try {
					const updated = await api.updateAssistant(id, p)
					set({ assistants: get().assistants.map(x => x.id === id ? updated : x) })
				} catch (e: any) {
					set({ error: e.message })
				} finally {
					set({ loading: false })
				}
			},

			createThread: async (assistantId, title) => {
				set({ loading: true, error: undefined })
				try {
					const t = await api.createThread(assistantId, title)
					set({ threads: [t, ...get().threads], selectedThreadId: t.id })
					await get().loadMessages(t.id)
				} catch (e: any) {
					set({ error: e.message })
				} finally {
					set({ loading: false })
				}
			},

			loadThreads: async (assistantId) => {
				set({ loading: true, error: undefined })
				try {
					const data = await api.listThreads(assistantId)
					set({ threads: data })
				} catch (e: any) {
					set({ error: e.message })
				} finally {
					set({ loading: false })
				}
			},

			selectThread: async (id) => {
				set({ selectedThreadId: id, messages: [] })
				if (id) await get().loadMessages(id)
			},

			loadMessages: async (threadId) => {
				set({ loading: true, error: undefined })
				try {
					const data = await api.listMessages(threadId)
					set({ messages: data })
				} catch (e: any) {
					set({ error: e.message })
				} finally {
					set({ loading: false })
				}
			},

			sendMessage: async (assistantId, threadId, content) => {
				set({ streaming: true, error: undefined })
				try {
					// Optimistic user message
					set({ messages: [...get().messages, { id: Date.now(), thread_id: threadId, role: 'user', content, created_at: new Date().toISOString() }] })

					let assistantBuffer = ''
					await streamChat(API_BASE, assistantId, threadId, content, {
						onToken: (t) => {
							assistantBuffer += t
							// live render a synthetic assistant message
							const msgs = get().messages.filter(m => m.role !== 'assistant' || m.id !== -1)
							set({ messages: [...msgs, { id: -1, thread_id: threadId, role: 'assistant', content: assistantBuffer, created_at: new Date().toISOString() }] })
						},
						onDone: () => {
							// Reload from server to replace synthetic message with persisted one
							get().loadMessages(threadId)
						},
						onError: (msg) => {
							set({ error: msg })
						},
					})
				} catch (e: any) {
					set({ error: e.message })
				} finally {
					set({ streaming: false })
				}
			},

			setTheme: (theme) => {
				set({ theme })
				// Apply theme to document
				if (theme === 'dark') {
					document.documentElement.classList.add('dark')
				} else {
					document.documentElement.classList.remove('dark')
				}
			},

			toggleTheme: () => {
				const newTheme = get().theme === 'light' ? 'dark' : 'light'
				get().setTheme(newTheme)
			},
		}),
		{
			name: 'chatbot-storage',
			partialize: (state) => ({ theme: state.theme }),
		}
	)
)