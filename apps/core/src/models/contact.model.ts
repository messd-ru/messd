import type { Db } from '@messd/db/client'
import { contacts } from '@messd/db/schema'
import { sql } from 'drizzle-orm'

export function createContactModel(db: Db) {
	return {
		async recordCall(guestId: string, otherGuestIds: string[]) {
			const others = [...new Set(otherGuestIds)].filter((id) => id !== guestId)
			if (!others.length) return
			const now = new Date()
			await db
				.insert(contacts)
				.values(
					others.flatMap((otherId) => [
						{ ownerId: guestId, contactId: otherId, lastCallAt: now },
						{ ownerId: otherId, contactId: guestId, lastCallAt: now },
					]),
				)
				.onConflictDoUpdate({
					target: [contacts.ownerId, contacts.contactId],
					set: { lastCallAt: sql`excluded.last_call_at` },
				})
		},
	}
}

export type ContactModel = ReturnType<typeof createContactModel>
