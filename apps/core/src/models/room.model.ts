import type { ServerEvents, ServerEventType } from '@messd/contracts/signaling'
import type { types } from 'mediasoup'
import type { Session } from '#lib/session.ts'
import type { Peer, ProducerAppData } from '#models/peer.model.ts'
import { roomSnapshotView } from '#views/room.view.ts'

type RoomInit = {
	code: string
	creatorId: string
	started: boolean
	router: types.Router
	webRtcServer: types.WebRtcServer
	audioObserver: types.AudioLevelObserver
}

export class Room {
	readonly code: string
	readonly creatorId: string
	readonly router: types.Router
	readonly webRtcServer: types.WebRtcServer
	readonly audioObserver: types.AudioLevelObserver
	readonly peers = new Map<string, Peer>()
	readonly watchers = new Set<Session>()
	readonly banned = new Set<string>()
	started: boolean
	activeSpeakerId: string | null = null
	closeTimer: NodeJS.Timeout | null = null

	constructor({
		code,
		creatorId,
		started,
		router,
		webRtcServer,
		audioObserver,
	}: RoomInit) {
		this.code = code
		this.creatorId = creatorId
		this.started = started
		this.router = router
		this.webRtcServer = webRtcServer
		this.audioObserver = audioObserver
	}

	broadcast<T extends ServerEventType>(type: T, data: ServerEvents[T], except?: Peer) {
		for (const peer of this.peers.values()) {
			if (peer !== except) peer.session?.emit(type, data)
		}
	}

	notifyWatchers() {
		const room = roomSnapshotView(this)
		for (const session of this.watchers) session.emit('roomChanged', { room })
	}

	findPeerByGuest(guestId: string) {
		for (const peer of this.peers.values()) {
			if (peer.guestId === guestId) return peer
		}
		return null
	}

	findProducer(producerId: string): types.Producer<ProducerAppData> | null {
		for (const peer of this.peers.values()) {
			const producer = peer.producers.get(producerId)
			if (producer) return producer
		}
		return null
	}

	producers(except?: Peer) {
		return [...this.peers.values()]
			.filter((peer) => peer !== except)
			.flatMap((peer) => [...peer.producers.values()])
	}

	cancelClose() {
		if (this.closeTimer) clearTimeout(this.closeTimer)
		this.closeTimer = null
	}

	close() {
		this.cancelClose()
		for (const peer of this.peers.values()) peer.clearGraceTimer()
		this.router.close()
	}
}
