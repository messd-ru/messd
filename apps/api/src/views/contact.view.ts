import type { Contact } from '@messd/contracts/guest'

export function contactView(contact: {
	id: string
	name: string
	lastCallAt: Date
}): Contact {
	return {
		id: contact.id,
		name: contact.name,
		lastCallAt: contact.lastCallAt.toISOString(),
	}
}
