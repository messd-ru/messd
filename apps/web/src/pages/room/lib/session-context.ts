import { createContext, use } from 'react'
import type { RoomSession } from '#pages/room/lib/room-session.ts'

export const RoomSessionContext = createContext<RoomSession | null>(null)

export function useRoomSession() {
	const session = use(RoomSessionContext)
	if (!session) throw new Error('Room session is not available')
	return session
}
