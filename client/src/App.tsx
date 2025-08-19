import { AssistantSelector } from './components/AssistantSelector'
import { ThreadList } from './components/ThreadList'
import { Chat } from './components/Chat'
import { useEffect, useState } from 'react'
import { useAppStore } from './store/useStore'

export default function App() {
	const assistantId = useAppStore(s => s.selectedAssistantId)
	const selectedAssistant = useAppStore(s => s.selectedAssistant)
	const threadId = useAppStore(s => s.selectedThreadId)
	const [isAssistantOpen, setIsOpen] = useState(false);

	return (
		<div className="h-full grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
			<div className="md:col-span-1 space-y-4 ">
				<div className="bg-white rounded-lg shadow p-4">
					<h2 onClick={() => setIsOpen(!isAssistantOpen)} className="font-semibold mb-2">Assistants ({selectedAssistant?.name}) {isAssistantOpen ? '▲' : '▼'}</h2>
					<div className={isAssistantOpen ? 'block' : 'hidden'}>
						<AssistantSelector />
					</div>
				</div>
				{assistantId && (
					<div className="bg-white rounded-lg shadow p-4">
						<h2 className="font-semibold mb-2">Threads</h2>
						<ThreadList assistantId={assistantId} />
					</div>
				)}
			</div>
			<div className="md:col-span-3">
				<div className="bg-white rounded-lg shadow h-full p-4 flex flex-col">
					{threadId ? (
						<Chat threadId={threadId} assistantId={assistantId!} />
					) : (
						<div className="text-gray-500 h-full grid place-items-center">
							Select or create a thread to start chatting
						</div>
					)}
				</div>
			</div>
		</div>
	)
}