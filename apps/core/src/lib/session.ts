import type {
	ServerEvents,
	ServerEventType,
	ServerMessage,
} from '@messd/contracts/signaling'
import type { WebSocket } from 'ws'
import type { Peer } from '#models/peer.model.ts'
import type { Room } from '#models/room.model.ts'

export class Session {
	readonly socket: WebSocket
	guest: { id: string; name: string } | null = null
	watching: Room | null = null
	room: Room | null = null
	peer: Peer | null = null
	alive = true

	constructor(socket: WebSocket) {
		this.socket = socket
	}

	emit<T extends ServerEventType>(type: T, data: ServerEvents[T]) {
		this.send({ kind: 'event', type, data } as ServerMessage)
	}

	send(message: ServerMessage) {
		if (this.socket.readyState === this.socket.OPEN)
			this.socket.send(JSON.stringify(message))
	}
}
