import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store/useStore'

export function Chat({ assistantId, threadId }: { assistantId: number; threadId: number }) {
	const { messages, loadMessages, sendMessage, syncMessages, streaming, error, loading } = useAppStore()
	const [input, setInput] = useState('')
	const listRef = useRef<HTMLDivElement>(null)

	useEffect(() => { loadMessages(threadId) }, [threadId, loadMessages])

	const onSync = async () => {
		await syncMessages(threadId)
	}

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!input.trim()) return
		const text = input
		setInput('')
		await sendMessage(assistantId, threadId, text)
	}

	useEffect(() => {
		// autoscroll
		listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
	}, [messages])

	const items = useMemo(() => messages, [messages])

	return (
		<div className="flex flex-col h-full max-h-[calc(100vh-50px)]">

			<button
				type="button"
				onClick={onSync}
				className="dark:bg-gray-700 absolute rounded top-0 right-0 w-6 h-6 z-10 transition-colors"
				disabled={loading || streaming}
			>
				R
			</button>
			<div ref={listRef} className="flex-1 overflow-y-auto space-y-3 pr-2 pb-3">
				{items.map(m => (
					<div key={`${m.id}-${m.created_at}`} className={`p-3 rounded relative transition-colors ${m.role === 'user'
						? 'bg-blue-50 dark:bg-blue-900/20'
						: 'bg-gray-100 dark:bg-gray-700'
						}`}>
						{m.role === 'assistant' ? (
							<div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{m.content}</div>
						) : <div className="whitespace-pre-wrap max-h-[200px] overflow-y-auto text-gray-900 dark:text-gray-100">{m.content}</div>}


						<div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
							<span className={`border px-1 py-0.5 rounded-md transition-colors ${m.role == 'user'
								? 'bg-green-100 dark:bg-green-900/30 border-gray-600 dark:border-gray-500'
								: 'bg-red-100 dark:bg-red-900/30 border-gray-600 dark:border-gray-500'
								}`}>{m.role}</span>
							<button
								type="button"
								className="text-xs border px-1 bg-blue-100 dark:bg-blue-900/30 py-0.5 border-blue-600 dark:border-blue-500 rounded-md text-blue-600 dark:text-blue-400 hover:underline focus:outline-none transition-colors"
								onClick={() => { navigator.clipboard.writeText(m.content) }}
							>
								Copy
							</button>
						</div>

					</div>
				))}
				{items.length === 0 && <div className="text-gray-500 dark:text-gray-400">No messages yet.</div>}
				{loading && <div className="text-gray-500 dark:text-gray-400">Loading messages...</div>}
				{streaming && <div className="text-gray-500 dark:text-gray-400">Streaming...</div>}
				{error && <div className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</div>}
				<div className='h-10'>

				</div>
			</div>

			<div className="sticky bottom-1 bg-white dark:bg-gray-800 pt-2 transition-colors">
				<form onSubmit={onSubmit} className="flex gap-2">
					<textarea
						className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
						rows={3}
						placeholder="Type your message..."
						value={input}
						onChange={e => setInput(e.target.value)}
					/>
					<button className="absolute right-2 bottom-2 z-10 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors" disabled={!input.trim() || streaming}>
						Send
					</button>
				</form>
			</div>
		</div>
	)
}