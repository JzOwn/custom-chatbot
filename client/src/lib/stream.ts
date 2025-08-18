type ChatEvents = {
	onToken?: (t: string) => void
	onCompleted?: () => void
	onDone?: () => void
	onError?: (msg: string) => void
}

export async function streamChat(
	apiBase: string,
	assistantId: number,
	threadId: number,
	content: string,
	events: ChatEvents = {}
) {
	const res = await fetch(`${apiBase}/api/chat/${assistantId}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ threadId, content }),
	})
	if (!res.ok || !res.body) {
		let msg = ''
		try { msg = (await res.json()).error } catch { msg = await res.text() }
		throw new Error(msg || 'Failed to start stream')
	}

	const reader = res.body.getReader()
	const decoder = new TextDecoder()
	let buf = ''

	while (true) {
		const { value, done } = await reader.read()
		if (done) break
		buf += decoder.decode(value, { stream: true })

		let sep
		while ((sep = buf.indexOf('\n\n')) !== -1) {
			const frame = buf.slice(0, sep).trim()
			buf = buf.slice(sep + 2)
			if (!frame) continue

			let ev = 'message'
			let data = ''
			for (const line of frame.split('\n')) {
				if (line.startsWith('event:')) ev = line.slice(7)
				else if (line.startsWith('data:')) data += (data ? '\n' : '') + line.slice(6)
			}
			if (ev === 'token') events.onToken?.(data)
			else if (ev === 'message_completed') events.onCompleted?.()
			else if (ev === 'done') events.onDone?.()
			else if (ev === 'error') events.onError?.(data)
		}
	}
}