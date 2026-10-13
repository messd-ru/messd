import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createRoom } from '#shared/api/rooms.ts'

export type Invitee = { guestId: string; name: string }

export function useStartCall() {
	const navigate = useNavigate()
	const [pending, setPending] = useState(false)

	async function start(invitee?: Invitee) {
		if (pending) return
		setPending(true)
		try {
			const { room } = await createRoom()
			await navigate(`/${room.code}`, { state: invitee ? { invitee } : null })
		} catch {
			toast.error('Не удалось создать звонок. Попробуйте ещё раз')
		} finally {
			setPending(false)
		}
	}

	return { start, pending }
}
