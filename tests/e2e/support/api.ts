import type { GuestSession } from '@messd/contracts/api'
import type { Room } from '@messd/contracts/room'
import { urls } from './urls.ts'

export async function createGuest(name: string): Promise<GuestSession> {
	const response = await fetch(`${urls.api}/api/guests`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ name }),
	})
	if (!response.ok) throw new Error(`Guest was not created: ${response.status}`)
	return (await response.json()) as GuestSession
}

export async function createRoom(token: string): Promise<Room> {
	const response = await fetch(`${urls.api}/api/rooms`, {
		method: 'POST',
		headers: { authorization: `Bearer ${token}` },
	})
	if (!response.ok) throw new Error(`Room was not created: ${response.status}`)
	return ((await response.json()) as { room: Room }).room
}
