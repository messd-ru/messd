import type { Db } from '@messd/db/client'
import { guests } from '@messd/db/schema'
import { hashToken } from '@messd/db/token'
import { eq } from 'drizzle-orm'

export function createGuestModel(db: Db) {
	return {
		async findByToken(token: string) {
			const [guest] = await db
				.select({ id: guests.id, name: guests.name })
				.from(guests)
				.where(eq(guests.tokenHash, hashToken(token)))
			return guest ?? null
		},

		async findName(id: string) {
			const [guest] = await db
				.select({ name: guests.name })
				.from(guests)
				.where(eq(guests.id, id))
			return guest?.name ?? null
		},
	}
}

export type GuestModel = ReturnType<typeof createGuestModel>
