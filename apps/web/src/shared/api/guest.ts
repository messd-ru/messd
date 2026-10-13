import { guestResponseSchema, guestSessionSchema } from '@messd/contracts/api'
import { request } from '#shared/api/http.ts'

export function createGuest(name: string) {
	return request(guestSessionSchema, '/guests', { method: 'POST', body: { name } })
}

export function renameGuest(name: string) {
	return request(guestResponseSchema, '/guests/me', { method: 'PATCH', body: { name } })
}
