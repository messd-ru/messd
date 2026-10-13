import { index, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'

const createdAt = () =>
	timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

export const guests = pgTable('guests', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	tokenHash: text('token_hash').notNull().unique(),
	createdAt: createdAt(),
	lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
})

export const rooms = pgTable('rooms', {
	code: text('code').primaryKey(),
	creatorId: uuid('creator_id')
		.notNull()
		.references(() => guests.id, { onDelete: 'cascade' }),
	createdAt: createdAt(),
	startedAt: timestamp('started_at', { withTimezone: true }),
	endedAt: timestamp('ended_at', { withTimezone: true }),
})

export const contacts = pgTable(
	'contacts',
	{
		ownerId: uuid('owner_id')
			.notNull()
			.references(() => guests.id, { onDelete: 'cascade' }),
		contactId: uuid('contact_id')
			.notNull()
			.references(() => guests.id, { onDelete: 'cascade' }),
		lastCallAt: timestamp('last_call_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		primaryKey({ columns: [table.ownerId, table.contactId] }),
		index('contacts_owner_last_call_idx').on(table.ownerId, table.lastCallAt),
	],
)

export type GuestRow = typeof guests.$inferSelect
export type RoomRow = typeof rooms.$inferSelect
export type ContactRow = typeof contacts.$inferSelect
