import type { RoomNotFoundReason } from '@messd/contracts/room'
import type { Db } from '@messd/db/client'
import { type RoomRow, rooms } from '@messd/db/schema'
import { eq } from 'drizzle-orm'
import { generateRoomCode } from '#lib/room-code.ts'

const UNIQUE_VIOLATION = '23505'

export function createRoomModel(db: Db, ttlHours: number) {
	return {
		async create(creatorId: string): Promise<RoomRow> {
			for (;;) {
				try {
					const [room] = await db
						.insert(rooms)
						.values({ code: generateRoomCode(), creatorId })
						.returning()
					if (room) return room
				} catch (error) {
					if ((error as { cause?: { code?: string } }).cause?.code !== UNIQUE_VIOLATION) {
						throw error
					}
				}
			}
		},

		async findByCode(code: string) {
			const [room] = await db.select().from(rooms).where(eq(rooms.code, code))
			return room ?? null
		},

		unavailableReason(room: RoomRow | null): RoomNotFoundReason | null {
			if (!room) return 'not_found'
			if (room.endedAt) return 'ended'
			const expiresAt = room.createdAt.getTime() + ttlHours * 3_600_000
			if (!room.startedAt && expiresAt < Date.now()) return 'ended'
			return null
		},
	}
}

export type RoomModel = ReturnType<typeof createRoomModel>
