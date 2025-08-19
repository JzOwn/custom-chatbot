import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useStore'

export function ThreadList({ assistantId }: { assistantId: number }) {
	const { threads, loadThreads, createThread, selectThread, selectedThreadId, loading, error } = useAppStore()
	const [title, setTitle] = useState('New chat');
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => { loadThreads(assistantId) }, [assistantId, loadThreads])

	return (
		<div className="space-y-3">
			<h2 onClick={() => setIsOpen(!isOpen)} className="font-semibold mb-2"> New Thread {isOpen ? '▲' : '▼'}</h2>
			{isOpen && (
				<div className="flex gap-2">

					<input
						className="flex-1 border rounded px-2 py-2"
						placeholder="Thread title"
						value={title}
						onChange={e => setTitle(e.target.value)}
					/>
					<button
						className="bg-green-600 text-white px-3 py-2 rounded disabled:opacity-50"
						disabled={!title || loading}
						onClick={() => createThread(assistantId, title)}
					>
						New
					</button>
				</div>)}
			<ul className="divide-y border rounded max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide">
				{threads.map(t => (
					<>
						<li
							key={t.id}
							className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${selectedThreadId === t.id ? 'bg-gray-100' : ''}`}
							onClick={() => selectThread(t.id)}
							title={t.openai_threadid}
						>
							<div className="font-medium">{t.thread_title}</div>
							<div className="text-xs text-gray-500">{new Date(t.created_at).toLocaleString()}</div>
						</li>
					</>
				))}
				{threads.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">No threads</li>}
			</ul>
		</div>
	)
}