import type { Db } from '@messd/db/client'
import { rooms } from '@messd/db/schema'
import { and, eq, isNull } from 'drizzle-orm'

export function createRoomRecordModel(db: Db, ttlHours: number) {
	return {
		async findActive(code: string) {
			const [room] = await db.select().from(rooms).where(eq(rooms.code, code))
			if (!room) return { status: 'not_found' as const }
			const expired =
				!room.startedAt && room.createdAt.getTime() + ttlHours * 3_600_000 < Date.now()
			if (room.endedAt || expired) return { status: 'ended' as const }
			return { status: 'active' as const, room }
		},

		async markStarted(code: string) {
			await db
				.update(rooms)
				.set({ startedAt: new Date() })
				.where(and(eq(rooms.code, code), isNull(rooms.startedAt)))
		},

		async markEnded(code: string) {
			await db.update(rooms).set({ endedAt: new Date() }).where(eq(rooms.code, code))
		},
	}
}

export type RoomRecordModel = ReturnType<typeof createRoomRecordModel>
