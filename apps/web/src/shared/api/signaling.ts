import type {
	ClientRequestData,
	ClientRequestType,
	ServerEventType,
	ServerEvents,
	ServerMessage,
	ServerResponses,
} from '@messd/contracts/signaling'

export type SignalingStatus =
	'idle' | 'connecting' | 'open' | 'reconnecting' | 'unauthorized'

type Pending = {
	resolve: (data: unknown) => void
	reject: (error: Error) => void
	timer: ReturnType<typeof setTimeout>
}

const REQUEST_TIMEOUT_MS = 15_000
const MAX_RETRY_DELAY_MS = 5_000

export class SignalingError extends Error {
	readonly code: string

	constructor(code: string, message: string) {
		super(message)
		this.code = code
	}
}

export class SignalingClient {
	status: SignalingStatus = 'idle'
	private socket: WebSocket | null = null
	private token: string | null = null
	private nextId = 1
	private attempts = 0
	private retryTimer: ReturnType<typeof setTimeout> | null = null
	private readonly pending = new Map<number, Pending>()
	private readonly listeners = new Map<ServerEventType, Set<(data: never) => void>>()
	private readonly statusListeners = new Set<(status: SignalingStatus) => void>()
	private readonly readyWaiters = new Set<() => void>()

	connect(token: string) {
		if (this.token === token && this.status !== 'idle') return
		this.disconnect()
		this.token = token
		this.open()
	}

	disconnect() {
		this.token = null
		if (this.retryTimer) clearTimeout(this.retryTimer)
		this.retryTimer = null
		const socket = this.socket
		this.socket = null
		socket?.close()
		this.rejectAll('Соединение закрыто')
		this.setStatus('idle')
	}

	request<T extends ClientRequestType>(
		type: T,
		data: ClientRequestData<T>,
	): Promise<ServerResponses[T]> {
		if (type !== 'hello' && this.status !== 'open') {
			return this.ready().then(() => this.send(type, data))
		}
		return this.send(type, data)
	}

	on<T extends ServerEventType>(type: T, listener: (data: ServerEvents[T]) => void) {
		const set = this.listeners.get(type) ?? new Set()
		set.add(listener as (data: never) => void)
		this.listeners.set(type, set)
		return () => {
			set.delete(listener as (data: never) => void)
		}
	}

	onStatus(listener: (status: SignalingStatus) => void) {
		this.statusListeners.add(listener)
		return () => {
			this.statusListeners.delete(listener)
		}
	}

	ready() {
		if (this.status === 'open') return Promise.resolve()
		return new Promise<void>((resolve) => this.readyWaiters.add(resolve))
	}

	private send<T extends ClientRequestType>(type: T, data: ClientRequestData<T>) {
		const socket = this.socket
		if (!socket || socket.readyState !== WebSocket.OPEN) {
			return Promise.reject(new SignalingError('offline', 'Нет соединения с сервером'))
		}
		const id = this.nextId++
		return new Promise<ServerResponses[T]>((resolve, reject) => {
			const timer = setTimeout(() => {
				this.pending.delete(id)
				reject(new SignalingError('timeout', 'Сервер не ответил'))
			}, REQUEST_TIMEOUT_MS)
			this.pending.set(id, { resolve: resolve as (data: unknown) => void, reject, timer })
			socket.send(JSON.stringify({ id, type, data }))
		})
	}

	private open() {
		const token = this.token
		if (!token) return
		this.setStatus(this.attempts ? 'reconnecting' : 'connecting')
		const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
		const socket = new WebSocket(`${protocol}://${window.location.host}/ws`)
		this.socket = socket

		socket.onopen = async () => {
			try {
				await this.send('hello', { token })
				this.attempts = 0
				this.setStatus('open')
				for (const resolve of this.readyWaiters) resolve()
				this.readyWaiters.clear()
			} catch (error) {
				if (error instanceof SignalingError && error.code === 'unauthorized') {
					this.token = null
					this.setStatus('unauthorized')
				}
				socket.close()
			}
		}

		socket.onmessage = (event) =>
			this.handle(JSON.parse(String(event.data)) as ServerMessage)

		socket.onclose = () => {
			if (this.socket !== socket) return
			this.socket = null
			this.rejectAll('Соединение потеряно')
			if (!this.token) return
			this.attempts += 1
			this.setStatus('reconnecting')
			const delay = Math.min(MAX_RETRY_DELAY_MS, 400 * 2 ** (this.attempts - 1))
			this.retryTimer = setTimeout(() => this.open(), delay)
		}
	}

	private handle(message: ServerMessage) {
		if (message.kind === 'response') {
			const pending = this.pending.get(message.id)
			if (!pending) return
			this.pending.delete(message.id)
			clearTimeout(pending.timer)
			if (message.ok) pending.resolve(message.data)
			else pending.reject(new SignalingError(message.error.code, message.error.message))
			return
		}
		for (const listener of this.listeners.get(message.type) ?? []) {
			;(listener as (data: unknown) => void)(message.data)
		}
	}

	private rejectAll(reason: string) {
		for (const pending of this.pending.values()) {
			clearTimeout(pending.timer)
			pending.reject(new SignalingError('offline', reason))
		}
		this.pending.clear()
	}

	private setStatus(status: SignalingStatus) {
		if (this.status === status) return
		this.status = status
		for (const listener of this.statusListeners) listener(status)
	}
}

export const signaling = new SignalingClient()
