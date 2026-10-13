import { Avatar } from '@messd/ui/components/avatar'
import { Button } from '@messd/ui/components/button'
import { cn } from '@messd/ui/lib/utils'
import { ClockIcon, CopyIcon, LinkIcon, UsersIcon } from 'lucide-react'
import { CallControls } from '#pages/room/components/call/call-controls.tsx'
import { CallTimer } from '#pages/room/components/call/call-timer.tsx'
import { ReconnectingOverlay } from '#pages/room/components/call/network-status.tsx'
import { PeerChip } from '#pages/room/components/call/peer-chip.tsx'
import type { Tile } from '#pages/room/hooks/use-tiles.ts'
import { useRoomStore } from '#pages/room/store/room-store.ts'
import { VideoView } from '#shared/components/video-view.tsx'
import { copyRoomLink, shareRoomLink } from '#shared/lib/clipboard.ts'
import { initials } from '#shared/lib/format.ts'
import { roomLinkLabel } from '#shared/lib/room-link.ts'

type WaitingStageProps = {
	self: Tile
	mobile: boolean
	onLeave: () => void
}

export function WaitingStage({ self, mobile, onLeave }: WaitingStageProps) {
	const code = useRoomStore((state) => state.code)
	const invitee = useRoomStore((state) => state.invitee)
	const joinedAt = useRoomStore((state) => state.joinedAt)
	const connection = useRoomStore((state) => state.connection)
	const name = invitee?.name ?? 'Новый звонок'
	const description = invitee
		? `Приглашение отправлено: ${invitee.name}. Звонок начнётся, как только собеседник подключится.`
		: mobile
			? 'Звонок начнётся, как только собеседник подключится.'
			: 'Отправьте ссылку — звонок начнётся, как только собеседник подключится.'

	return (
		<div
			data-testid="waiting-stage"
			className="relative size-full overflow-hidden bg-stage"
		>
			{self.track && (
				<VideoView track={self.track} mirror={self.mirror} className="absolute inset-0" />
			)}
			<PeerChip
				name={name}
				initials={invitee ? initials(invitee.name) : undefined}
				mobile={mobile}
			>
				<ClockIcon className="size-[11px]" />
				Ожидание · <CallTimer since={joinedAt} />
			</PeerChip>
			<div
				className={cn(
					'absolute top-1/2 z-10 flex -translate-y-1/2 flex-col items-center bg-background text-center',
					mobile
						? 'inset-x-4 gap-4 rounded-[20px] p-6'
						: 'left-1/2 w-[420px] max-w-[calc(100%-32px)] -translate-x-1/2 gap-[18px] rounded-[18px] border border-line p-7',
				)}
			>
				<div
					className={cn(
						'relative grid place-items-center',
						mobile ? 'size-[120px]' : 'size-[136px]',
					)}
				>
					<span className="absolute inset-0 rounded-full border border-line" />
					<span className="animate-waiting absolute inset-3 rounded-full border border-accent" />
					{invitee ? (
						<Avatar
							initials={initials(invitee.name)}
							size={mobile ? '2xl' : '4xl'}
							className="border border-line"
						/>
					) : (
						<div
							className={cn(
								'grid place-items-center rounded-full border border-line bg-surface text-muted',
								mobile ? 'size-[72px]' : 'size-[88px]',
							)}
						>
							<UsersIcon className="size-7" />
						</div>
					)}
				</div>
				<div className="flex flex-col gap-1.5">
					<span
						className={cn(
							'font-semibold text-pretty',
							mobile ? 'text-xl' : 'text-[22px]',
						)}
					>
						Ждём собеседника
					</span>
					<span className="leading-normal text-pretty text-muted">{description}</span>
				</div>
				{mobile ? (
					<Button
						variant="outline"
						size="mobile"
						className="h-12"
						onClick={() => void shareRoomLink(code)}
					>
						<CopyIcon />
						Скопировать ссылку
					</Button>
				) : (
					<button
						type="button"
						onClick={() => void copyRoomLink(code)}
						className="flex h-[42px] w-full items-center gap-2 rounded-[10px] border border-line bg-surface px-3 outline-none hover:border-muted focus-visible:ring-2 focus-visible:ring-accent/50"
					>
						<LinkIcon className="size-[15px]" />
						<span
							className="flex-1 truncate text-left font-medium"
							data-testid="room-link"
						>
							{roomLinkLabel(code)}
						</span>
						<CopyIcon className="size-[15px]" aria-label="Скопировать ссылку" />
					</button>
				)}
			</div>
			{connection === 'reconnecting' && <ReconnectingOverlay mobile={mobile} />}
			<CallControls
				variant={mobile ? 'mobile-floating' : 'floating'}
				mode="waiting"
				keys={
					mobile
						? ['mic', 'camera', 'switchCamera', 'more', 'leave']
						: ['mic', 'camera', 'screen', 'chat', 'more', 'leave']
				}
				onLeave={onLeave}
			/>
		</div>
	)
}
