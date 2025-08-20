import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useStore'

export function ThreadList({ assistantId }: { assistantId: number }) {
	const { threads, loadThreads, createThread, selectThread, selectedThreadId, loading, error } = useAppStore()
	const [title, setTitle] = useState('New chat');
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => { loadThreads(assistantId) }, [assistantId, loadThreads])

	return (
		<div className="space-y-3">
			<h2 onClick={() => setIsOpen(!isOpen)} className="font-semibold mb-2 text-gray-900 dark:text-white cursor-pointer"> New Thread {isOpen ? '▲' : '▼'}</h2>
			{isOpen && (
				<div className="flex gap-2">

					<input
						className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
						placeholder="Thread title"
						value={title}
						onChange={e => setTitle(e.target.value)}
					/>
					<button
						className="bg-green-600 dark:bg-green-500 text-white px-3 py-2 rounded disabled:opacity-50 hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
						disabled={!title || loading}
						onClick={() => createThread(assistantId, title)}
					>
						New
					</button>
				</div>)}
			<ul className="divide-y divide-gray-200 dark:divide-gray-600 border border-gray-200 dark:border-gray-600 rounded max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide bg-white dark:bg-gray-800 transition-colors">
				{threads.map(t => (
					<>
						<li
							key={t.id}
							className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
								selectedThreadId === t.id ? 'bg-gray-100 dark:bg-gray-700' : ''
							}`}
							onClick={() => selectThread(t.id)}
							title={t.openai_threadid}
						>
							<div className="font-medium text-gray-900 dark:text-white">{t.thread_title}</div>
							<div className="text-xs text-gray-500 dark:text-gray-400">{new Date(t.created_at).toLocaleString()}</div>
						</li>
					</>
				))}
				{threads.length === 0 && <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No threads</li>}
			</ul>
		</div>
	)
}