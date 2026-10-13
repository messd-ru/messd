import { roomNotFoundResponseSchema, roomResponseSchema } from '@messd/contracts/api'
import { ApiError, request } from '#shared/api/http.ts'

export function createRoom() {
	return request(roomResponseSchema, '/rooms', { method: 'POST' })
}

export async function fetchRoom(code: string) {
	try {
		const { room } = await request(
			roomResponseSchema,
			`/rooms/${encodeURIComponent(code)}`,
		)
		return { status: 'active' as const, room }
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) {
			const parsed = roomNotFoundResponseSchema.safeParse(error.body)
			return { status: parsed.success ? parsed.data.reason : ('not_found' as const) }
		}
		if (error instanceof ApiError && error.status === 400)
			return { status: 'not_found' as const }
		throw error
	}
}
