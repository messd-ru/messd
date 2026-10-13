import type { Room } from '@messd/contracts/room'
import type { RoomRow } from '@messd/db/schema'

export function roomView(room: RoomRow): Room {
	return {
		code: room.code,
		creatorId: room.creatorId,
		createdAt: room.createdAt.toISOString(),
	}
}
