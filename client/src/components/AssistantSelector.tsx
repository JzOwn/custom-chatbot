import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useStore'

export function AssistantSelector() {
	const { assistants, selectedAssistantId, loadAssistants, selectAssistant, createAssistant, updateAssistant, loading, error } = useAppStore()
	const [name, setName] = useState('')
	const [instructions, setInstructions] = useState('You are a helpful assistant.')

	useEffect(() => { loadAssistants() }, [loadAssistants])

	// Prefill fields when selection changes
	useEffect(() => {
		const a = assistants.find(x => x.id === selectedAssistantId)
		if (a) {
			setName(a.name)
			setInstructions(a.system_prompt)
		}
	}, [assistants, selectedAssistantId])

	return (
		<div className="space-y-3">
			<select
				className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
				value={selectedAssistantId ?? ''}
				onChange={(e) => selectAssistant(e.target.value ? Number(e.target.value) : undefined)}
			>
				<option value="">Select assistant…</option>
				{assistants.map(a => (
					<option key={a.id} value={a.id}>{a.name}</option>
				))}
			</select>

			<div className="space-y-2 hidden">
				<input
					className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
					placeholder="New assistant name"
					value={name}
					onChange={e => setName(e.target.value)}
				/>
				<textarea
					className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
					placeholder="Instructions"
					rows={3}
					value={instructions}
					onChange={e => setInstructions(e.target.value)}
				/>
				<div className="flex gap-2">
					<button
						className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-2 rounded disabled:opacity-50 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
						disabled={!name || !instructions || loading}
						onClick={() => { createAssistant(name, instructions); }}
					>
						Create assistant
					</button>
					<button
						className="bg-emerald-600 dark:bg-emerald-500 text-white px-3 py-2 rounded disabled:opacity-50 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
						disabled={!selectedAssistantId || loading}
						onClick={() => selectedAssistantId && updateAssistant(selectedAssistantId, { name, instructions })}
					>
						Update assistant
					</button>
				</div>
				{error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}
			</div>
		</div>
	)
}