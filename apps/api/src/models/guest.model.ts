import type { Db } from '@messd/db/client'
import { guests } from '@messd/db/schema'
import { createToken, hashToken } from '@messd/db/token'
import { eq } from 'drizzle-orm'

export function createGuestModel(db: Db) {
	return {
		async create(name: string) {
			const token = createToken()
			const [guest] = await db
				.insert(guests)
				.values({ name, tokenHash: hashToken(token) })
				.returning()
			if (!guest) throw new Error('Guest was not created')
			return { guest, token }
		},

		async findByToken(token: string) {
			const [guest] = await db
				.update(guests)
				.set({ lastSeenAt: new Date() })
				.where(eq(guests.tokenHash, hashToken(token)))
				.returning()
			return guest ?? null
		},

		async rename(id: string, name: string) {
			const [guest] = await db
				.update(guests)
				.set({ name })
				.where(eq(guests.id, id))
				.returning()
			return guest ?? null
		},
	}
}

export type GuestModel = ReturnType<typeof createGuestModel>
