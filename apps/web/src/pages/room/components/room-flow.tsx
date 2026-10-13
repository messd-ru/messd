import type { RoomNotFoundReason } from '@messd/contracts/room'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { CallView } from '#pages/room/components/call/call-view.tsx'
import { Lobby } from '#pages/room/components/lobby/lobby.tsx'
import { RoomNotFound } from '#pages/room/components/states/room-not-found.tsx'
import { localMedia } from '#pages/room/lib/local-media.ts'
import { RoomSession } from '#pages/room/lib/room-session.ts'
import { RoomSessionContext } from '#pages/room/lib/session-context.ts'
import { resetRoomStore, useRoomStore } from '#pages/room/store/room-store.ts'
import { SignalingError, signaling } from '#shared/api/signaling.ts'
import type { Invitee } from '#shared/hooks/use-start-call.ts'
import { useSession } from '#shared/store/session.ts'

type RoomFlowProps = {
	code: string
	invitee: Invitee | null
}

const joinErrors: Record<string, string> = {
	room_full: 'В комнате не осталось мест',
	forbidden: 'Создатель удалил вас из этой комнаты',
}

export function RoomFlow({ code, invitee }: RoomFlowProps) {
	const navigate = useNavigate()
	const token = useSession((state) => state.token)
	const phase = useRoomStore((state) => state.phase)
	const [unavailable, setUnavailable] = useState<RoomNotFoundReason | null>(null)
	const [session, setSession] = useState<RoomSession | null>(null)
	const [ready, setReady] = useState(false)
	const capabilities = useRef<Record<string, unknown> | null>(null)
	const sessionRef = useRef<RoomSession | null>(null)

	useEffect(() => {
		resetRoomStore(code, invitee)
		void localMedia.start()
		return () => {
			void sessionRef.current?.leave()
			sessionRef.current = null
			localMedia.stop()
		}
	}, [code, invitee])

	useEffect(() => {
		if (!token) return
		let active = true
		const peek = () => {
			signaling
				.request('peek', { code })
				.then(({ room, routerRtpCapabilities }) => {
					if (!active) return
					capabilities.current = routerRtpCapabilities
					setReady(true)
					useRoomStore.setState({ snapshot: room, creatorId: room.creatorId })
				})
				.catch((error: unknown) => {
					if (!active || !(error instanceof SignalingError)) return
					if (error.code === 'room_not_found') setUnavailable('not_found')
					if (error.code === 'room_ended') setUnavailable('ended')
				})
		}
		peek()
		const offRoom = signaling.on('roomChanged', ({ room }) => {
			if (useRoomStore.getState().phase === 'lobby')
				useRoomStore.setState({ snapshot: room })
		})
		const offStatus = signaling.onStatus((status) => {
			if (status === 'open' && useRoomStore.getState().phase === 'lobby') peek()
		})
		return () => {
			active = false
			offRoom()
			offStatus()
		}
	}, [code, token])

	useEffect(() => {
		if (phase !== 'removed') return
		toast('Создатель удалил вас из комнаты')
		void navigate('/', { replace: true })
	}, [phase, navigate])

	async function join(withVideo: boolean) {
		const routerRtpCapabilities = capabilities.current
		if (!routerRtpCapabilities) return
		if (!withVideo) await localMedia.setCamera(false)
		useRoomStore.setState({ phase: 'joining' })
		try {
			const joined = await RoomSession.join(code, routerRtpCapabilities)
			sessionRef.current = joined
			setSession(joined)
			const target = useRoomStore.getState().invitee
			if (target) {
				const { delivered } = await joined.invite(target.guestId)
				if (!delivered) toast(`${target.name} сейчас не в сети — отправьте ссылку`)
			}
		} catch (error) {
			useRoomStore.setState({ phase: 'lobby' })
			if (error instanceof SignalingError && error.code === 'room_ended') {
				setUnavailable('ended')
				return
			}
			if (error instanceof SignalingError && error.code === 'room_not_found') {
				setUnavailable('not_found')
				return
			}
			const message = error instanceof SignalingError ? joinErrors[error.code] : undefined
			toast.error(message ?? 'Не удалось подключиться к звонку')
		}
	}

	async function leave() {
		const current = sessionRef.current
		sessionRef.current = null
		await current?.leave()
		await navigate('/', { replace: true })
	}

	if (unavailable) return <RoomNotFound code={code} reason={unavailable} />
	if (phase === 'ended') return <RoomNotFound code={code} reason="ended" />

	if ((phase === 'call' || phase === 'removed') && session) {
		return (
			<RoomSessionContext value={session}>
				<CallView onLeave={() => void leave()} />
			</RoomSessionContext>
		)
	}

	return (
		<Lobby
			ready={ready}
			joining={phase === 'joining'}
			onJoin={(withVideo) => void join(withVideo)}
		/>
	)
}
