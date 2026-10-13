import { Avatar } from '@messd/ui/components/avatar'
import { Button } from '@messd/ui/components/button'
import { cn } from '@messd/ui/lib/utils'
import { LogOutIcon, PhoneOffIcon, VideoIcon } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { PeerChip } from '#pages/room/components/call/peer-chip.tsx'
import { SelfPip } from '#pages/room/components/call/self-pip.tsx'
import type { Tile } from '#pages/room/hooks/use-tiles.ts'
import { useRoomSession } from '#pages/room/lib/session-context.ts'
import { type LeftPeer, useRoomStore } from '#pages/room/store/room-store.ts'
import { useNow } from '#shared/hooks/use-now.ts'
import {
	formatCountdown,
	formatDuration,
	formatSpokenDuration,
	initials,
} from '#shared/lib/format.ts'

const AUTO_CLOSE_MS = 60_000

type PeerLeftStageProps = {
	self: Tile
	left: LeftPeer
	mobile: boolean
	onLeave: () => void
}

export function PeerLeftStage({ self, left, mobile, onLeave }: PeerLeftStageProps) {
	const session = useRoomSession()
	const now = useNow(500)
	const remaining = left.leftAt + AUTO_CLOSE_MS - now
	const name = left.peer.name

	useEffect(() => {
		const timer = setTimeout(onLeave, left.leftAt + AUTO_CLOSE_MS - Date.now())
		return () => clearTimeout(timer)
	}, [left.leftAt, onLeave])

	async function callAgain() {
		useRoomStore.setState({
			leftPeer: null,
			invitee: { guestId: left.peer.guestId, name },
			joinedAt: Date.now(),
		})
		const { delivered } = await session
			.invite(left.peer.guestId)
			.catch(() => ({ delivered: false }))
		if (!delivered) toast(`${name} сейчас не в сети — отправьте ссылку`)
	}

	return (
		<div
			data-testid="peer-left-stage"
			className="relative size-full overflow-hidden bg-surface"
		>
			{!mobile && (
				<PeerChip name={name} initials={initials(name)}>
					<PhoneOffIcon className="size-[11px]" />
					Звонок завершён ·{' '}
					<span className="tabular">{formatDuration(left.duration)}</span>
				</PeerChip>
			)}
			<div
				className={cn(
					'absolute top-1/2 z-10 flex -translate-y-1/2 flex-col items-center bg-background text-center',
					mobile
						? 'inset-x-4 gap-4 rounded-[20px] p-6'
						: 'left-1/2 w-[420px] max-w-[calc(100%-32px)] -translate-x-1/2 gap-[18px] rounded-[18px] border border-line p-7',
				)}
			>
				<Avatar
					initials={initials(name)}
					size={mobile ? '2xl' : '4xl'}
					tone={mobile ? 'surface' : 'background'}
					className={cn('text-muted', mobile && 'size-20 text-[26px]')}
				/>
				<div className="flex flex-col gap-1.5">
					<span
						className={cn(
							'font-semibold text-pretty',
							mobile ? 'text-xl' : 'text-[22px]',
						)}
					>
						Собеседник покинул звонок
					</span>
					<span className="leading-normal text-pretty text-muted">
						{mobile
							? `${name} · длительность ${formatDuration(left.duration)}`
							: `Вы проговорили ${formatSpokenDuration(left.duration)}.`}
					</span>
				</div>
				<div
					className={cn('w-full gap-2', mobile ? 'flex flex-col' : 'grid grid-cols-2')}
				>
					<Button
						variant="accent"
						size={mobile ? 'mobile' : 'lg'}
						onClick={() => void callAgain()}
					>
						<VideoIcon />
						Позвонить снова
					</Button>
					<Button variant="outline" size={mobile ? 'mobile' : 'lg'} onClick={onLeave}>
						{!mobile && <LogOutIcon />}
						Выйти
					</Button>
				</div>
				{!mobile && (
					<span className="text-[13px] text-muted">
						Комната закроется через{' '}
						<span className="tabular">{formatCountdown(remaining)}</span>
					</span>
				)}
			</div>
			<SelfPip tile={self} mobile={mobile} />
		</div>
	)
}
