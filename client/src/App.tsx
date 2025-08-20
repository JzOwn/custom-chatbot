import { AssistantSelector } from './components/AssistantSelector'
import { ThreadList } from './components/ThreadList'
import { Chat } from './components/Chat'
import { ThemeToggle } from './components/ThemeToggle'
import { useEffect, useState } from 'react'
import { useAppStore } from './store/useStore'

export default function App() {
	const assistantId = useAppStore(s => s.selectedAssistantId)
	const selectedAssistant = useAppStore(s => s.selectedAssistant)
	const threadId = useAppStore(s => s.selectedThreadId)
	const theme = useAppStore(s => s.theme)
	const setTheme = useAppStore(s => s.setTheme)
	const [isAssistantOpen, setIsOpen] = useState(true);

	// Initialize theme on mount
	useEffect(() => {
		setTheme(theme)
	}, [theme, setTheme])

	return (
		<div className="h-full grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-gray-900 transition-colors">
			<div className="md:col-span-2 space-y-4 ">
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors">
					{/* <h2 onClick={() => setIsOpen(!isAssistantOpen)} className="font-semibold mb-2">Assistants ({selectedAssistant?.name}) {isAssistantOpen ? '▲' : '▼'}</h2> */}
					<div className='flex items-center'>
						<ThemeToggle />
						<div className={(isAssistantOpen ? 'block' : 'hidden') + ' w-full ml-2'}>
							<AssistantSelector />
						</div>
					</div>
				</div>
				{assistantId && (
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors">
						{/* <h2 className="font-semibold mb-2">Threads</h2> */}
						<ThreadList assistantId={assistantId} />
					</div>
				)}
			</div>
			<div className="md:col-span-10">
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full p-4 flex flex-col transition-colors">
					{threadId ? (
						<Chat threadId={threadId} assistantId={assistantId!} />
					) : (
						<div className="text-gray-500 dark:text-gray-400 h-full grid place-items-center">
							Select or create a thread to start chatting
						</div>
					)}
				</div>
			</div>
		</div>
	)
}