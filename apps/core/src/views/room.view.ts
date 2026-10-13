import type { RoomSnapshot } from '@messd/contracts/signaling'
import type { Room } from '#models/room.model.ts'
import { peerView } from '#views/peer.view.ts'

export function roomSnapshotView(room: Room): RoomSnapshot {
	return {
		code: room.code,
		creatorId: room.creatorId,
		peers: [...room.peers.values()].map(peerView),
	}
}
