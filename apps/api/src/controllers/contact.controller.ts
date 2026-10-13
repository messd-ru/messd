import type { FastifyRequest } from 'fastify'
import type { ContactModel } from '#models/contact.model.ts'
import { currentGuest } from '#plugins/auth.ts'
import { contactView } from '#views/contact.view.ts'

type SearchRequest = FastifyRequest<{ Querystring: { query: string } }>

export function createContactController(contacts: ContactModel) {
	return {
		async search(request: SearchRequest) {
			const rows = await contacts.search(currentGuest(request).id, request.query.query)
			return { contacts: rows.map(contactView) }
		},
	}
}
