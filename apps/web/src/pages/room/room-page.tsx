import type { RoomNotFoundReason } from '@messd/contracts/room'
import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router'
import { RoomFlow } from '#pages/room/components/room-flow.tsx'
import { RoomNotFound } from '#pages/room/components/states/room-not-found.tsx'
import { fetchRoom } from '#shared/api/rooms.ts'
import { PageLoader } from '#shared/components/page-loader.tsx'
import type { Invitee } from '#shared/hooks/use-start-call.ts'

type RoomStatus = 'checking' | 'active' | RoomNotFoundReason

function RoomGate({ code, invitee }: { code: string; invitee: Invitee | null }) {
	const [status, setStatus] = useState<RoomStatus>('checking')

	useEffect(() => {
		let active = true
		fetchRoom(code)
			.then((result) => {
				if (active) setStatus(result.status)
			})
			.catch(() => {
				if (active) setStatus('active')
			})
		return () => {
			active = false
		}
	}, [code])

	if (status === 'checking') return <PageLoader />
	if (status !== 'active') return <RoomNotFound code={code} reason={status} />
	return <RoomFlow code={code} invitee={invitee} />
}

export function RoomPage() {
	const { code = '' } = useParams()
	const location = useLocation()
	const invitee = (location.state as { invitee?: Invitee } | null)?.invitee ?? null
	return <RoomGate key={code} code={code} invitee={invitee} />
}
