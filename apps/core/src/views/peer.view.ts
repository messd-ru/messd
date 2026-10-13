import type { Peer as PeerContract, ProducerInfo } from '@messd/contracts/signaling'
import type { types } from 'mediasoup'
import type { Peer, ProducerAppData } from '#models/peer.model.ts'

export function peerView(peer: Peer): PeerContract {
	return {
		id: peer.id,
		guestId: peer.guestId,
		name: peer.name,
		role: peer.role,
		publicKey: peer.publicKey,
		handRaisedAt: peer.handRaisedAt,
		reconnecting: peer.reconnecting,
		joinedAt: peer.joinedAt,
		...peer.state,
	}
}

export function producerView(producer: types.Producer<ProducerAppData>): ProducerInfo {
	return {
		producerId: producer.id,
		peerId: producer.appData.peerId,
		kind: producer.kind,
		source: producer.appData.source,
	}
}
