import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store/useStore'

export function Chat({ assistantId, threadId }: { assistantId: number; threadId: number }) {
	const { messages, loadMessages, sendMessage, streaming, error } = useAppStore()
	const [input, setInput] = useState('')
	const listRef = useRef<HTMLDivElement>(null)

	useEffect(() => { loadMessages(threadId) }, [threadId, loadMessages])

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
			<div ref={listRef} className="flex-1 overflow-y-auto space-y-3 pr-2 pb-3">
				{items.map(m => (
					<div key={`${m.id}-${m.created_at}`} className={`p-3 rounded relative ${m.role === 'user' ? 'bg-blue-50' : 'bg-gray-100'}`}>
						{m.role === 'assistant' ? (
							<div className="whitespace-pre-wrap">{m.content}</div>
						) : <div className="whitespace-pre-wrap max-h-[200px] overflow-y-auto">{m.content}</div>}


						<div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
							<span className={'border px-1 py-0.5 border-gray-600 rounded-md ' + ( m.role == 'user' ? 'bg-green-100' : 'bg-red-100' )}>{m.role}</span>
							<button
								type="button"
								className="text-xs border px-1 bg-blue-100 py-0.5 border-blue-600 rounded-md text-blue-600 hover:underline focus:outline-none"
								onClick={() => { navigator.clipboard.writeText(m.content) }}
							>
								Copy
							</button>
						</div>

					</div>
				))}
				{items.length === 0 && <div className="text-gray-500">No messages yet.</div>}
				{streaming && <div className="text-gray-500">Streaming...</div>}
				{error && <div className="text-red-600 text-sm mt-2">{error}</div>}
				<div className='h-10'>

				</div>
			</div>

			<div className="sticky bottom-1 bg-white pt-2">
				<form onSubmit={onSubmit} className="flex gap-2">
					<textarea
						className="flex-1 border rounded px-3 py-2"
						rows={3}
						placeholder="Type your message..."
						value={input}
						onChange={e => setInput(e.target.value)}
					/>
					<button className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" disabled={!input.trim() || streaming}>
						Send
					</button>
				</form>
			</div>
		</div>
	)
}