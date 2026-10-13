import type { MediaSource, PeerRole, PeerState } from '@messd/contracts/signaling'
import type { types } from 'mediasoup'
import type { Session } from '#lib/session.ts'

type PeerInit = {
	id: string
	guestId: string
	name: string
	role: PeerRole
}

export type ProducerAppData = { peerId: string; source: MediaSource }

export class Peer {
	readonly id: string
	readonly guestId: string
	readonly role: PeerRole
	readonly joinedAt = Date.now()
	readonly transports = new Map<string, types.WebRtcTransport>()
	readonly producers = new Map<string, types.Producer<ProducerAppData>>()
	readonly consumers = new Map<string, types.Consumer<ProducerAppData>>()
	name: string
	session: Session | null = null
	rtpCapabilities: types.RtpCapabilities | null = null
	publicKey = ''
	handRaisedAt: number | null = null
	reconnecting = false
	graceTimer: NodeJS.Timeout | null = null
	state: PeerState = {
		audio: false,
		video: false,
		screen: false,
		hand: false,
		quality: 4,
	}

	constructor({ id, guestId, name, role }: PeerInit) {
		this.id = id
		this.guestId = guestId
		this.name = name
		this.role = role
	}

	producerBySource(source: MediaSource) {
		for (const producer of this.producers.values()) {
			if (producer.appData.source === source) return producer
		}
		return null
	}

	recvTransport() {
		return [...this.transports.values()].findLast(
			(item) => item.appData.direction === 'recv',
		)
	}

	updateState(patch: Partial<PeerState>) {
		if (patch.hand !== undefined && patch.hand !== this.state.hand) {
			this.handRaisedAt = patch.hand ? Date.now() : null
		}
		this.state = { ...this.state, ...patch }
	}

	closeMedia() {
		for (const transport of this.transports.values()) transport.close()
		this.transports.clear()
		this.producers.clear()
		this.consumers.clear()
		this.state = { ...this.state, screen: false }
	}

	clearGraceTimer() {
		if (this.graceTimer) clearTimeout(this.graceTimer)
		this.graceTimer = null
	}
}
