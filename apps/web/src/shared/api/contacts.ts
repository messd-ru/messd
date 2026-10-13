import { contactsResponseSchema } from '@messd/contracts/api'
import { request } from '#shared/api/http.ts'

export async function searchContacts(query: string) {
	const params = new URLSearchParams({ query })
	const { contacts } = await request(contactsResponseSchema, `/contacts?${params}`)
	return contacts
}
