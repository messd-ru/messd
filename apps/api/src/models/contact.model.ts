import type { Db } from '@messd/db/client'
import { contacts, guests } from '@messd/db/schema'
import { and, desc, eq, ilike } from 'drizzle-orm'

const LIMIT = 8

function escapeLike(value: string) {
	return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

export function createContactModel(db: Db) {
	return {
		search(ownerId: string, query: string) {
			return db
				.select({ id: guests.id, name: guests.name, lastCallAt: contacts.lastCallAt })
				.from(contacts)
				.innerJoin(guests, eq(guests.id, contacts.contactId))
				.where(
					and(
						eq(contacts.ownerId, ownerId),
						query ? ilike(guests.name, `%${escapeLike(query)}%`) : undefined,
					),
				)
				.orderBy(desc(contacts.lastCallAt))
				.limit(LIMIT)
		},
	}
}

export type ContactModel = ReturnType<typeof createContactModel>
