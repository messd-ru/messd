import type {
	ClientRequestData,
	ClientRequestType,
	ServerEventType,
	ServerEvents,
	ServerMessage,
	ServerResponses,
} from '@messd/contracts/signaling'
import { urls } from './urls.ts'

type Response<T extends ClientRequestType> =
	| { ok: true; data: ServerResponses[T] }
	| { ok: false; error: { code: string; message: string } }

export class SignalingTestClient {
	private readonly socket: WebSocket
	private nextId = 1
	private readonly pending = new Map<number, (message: ServerMessage) => void>()
	private readonly events: { type: ServerEventType; data: unknown }[] = []
	private readonly waiters = new Set<() => void>()

	private constructor(socket: WebSocket) {
		this.socket = socket
		socket.addEventListener('message', (event) => {
			const message = JSON.parse(String(event.data)) as ServerMessage
			if (message.kind === 'response') {
				this.pending.get(message.id)?.(message)
				this.pending.delete(message.id)
				return
			}
			this.events.push({ type: message.type, data: message.data })
			for (const waiter of this.waiters) waiter()
		})
	}

	static async connect() {
		const socket = new WebSocket(urls.core)
		await new Promise((resolve, reject) => {
			socket.addEventListener('open', resolve, { once: true })
			socket.addEventListener('error', reject, { once: true })
		})
		return new SignalingTestClient(socket)
	}

	request<T extends ClientRequestType>(type: T, data: ClientRequestData<T>) {
		const id = this.nextId++
		return new Promise<Response<T>>((resolve) => {
			this.pending.set(id, (message) => resolve(message as unknown as Response<T>))
			this.socket.send(JSON.stringify({ id, type, data }))
		})
	}

	async waitFor<T extends ServerEventType>(
		type: T,
		predicate: (data: ServerEvents[T]) => boolean = () => true,
		timeout = 5000,
	): Promise<ServerEvents[T]> {
		const deadline = Date.now() + timeout
		for (;;) {
			const found = this.events.find(
				(event) => event.type === type && predicate(event.data as ServerEvents[T]),
			)
			if (found) return found.data as ServerEvents[T]
			const remaining = deadline - Date.now()
			if (remaining <= 0) throw new Error(`Event ${type} was not received`)
			await new Promise<void>((resolve) => {
				const timer = setTimeout(resolve, remaining)
				this.waiters.add(() => {
					clearTimeout(timer)
					resolve()
				})
			})
			this.waiters.clear()
		}
	}

	close() {
		this.socket.close()
	}
}
