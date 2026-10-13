import { Avatar } from '@messd/ui/components/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@messd/ui/components/tooltip'
import {
	Maximize2Icon,
	MicOffIcon,
	MinimizeIcon,
	UserPlusIcon,
	VideoOffIcon,
} from 'lucide-react'
import { CallControls } from '#pages/room/components/call/call-controls.tsx'
import { CallTimer } from '#pages/room/components/call/call-timer.tsx'
import {
	EncryptionIcon,
	EncryptionPill,
} from '#pages/room/components/call/encryption-badge.tsx'
import {
	ReconnectingOverlay,
	WeakNetworkBanner,
} from '#pages/room/components/call/network-status.tsx'
import { PeerChip } from '#pages/room/components/call/peer-chip.tsx'
import { SelfPip } from '#pages/room/components/call/self-pip.tsx'
import { VideoTile } from '#pages/room/components/call/video-tile.tsx'
import type { Tile } from '#pages/room/hooks/use-tiles.ts'
import { roomActions, useRoomStore } from '#pages/room/store/room-store.ts'
import { LogoMark } from '#shared/components/logo-mark.tsx'
import { SignalBars } from '#shared/components/signal-bars.tsx'
import { VideoView } from '#shared/components/video-view.tsx'
import { useFullscreen } from '#shared/hooks/use-fullscreen.ts'
import { firstName } from '#shared/lib/format.ts'
import { supportsFullscreen } from '#shared/lib/media-support.ts'

type PairStageProps = {
	self: Tile
	remote: Tile
	mobile: boolean
	onLeave: () => void
}

function RemoteStage({ remote }: { remote: Tile }) {
	return (
		<div
			data-testid="video-tile"
			data-peer={remote.peerId}
			data-name={remote.fullName}
			data-speaking={remote.speaking}
			className="absolute inset-0 grid place-items-center bg-stage"
		>
			{remote.track ? (
				<VideoView track={remote.track} className="absolute inset-0" />
			) : (
				<div className="flex flex-col items-center gap-4">
					<Avatar
						initials={remote.initials}
						size="5xl"
						tone="background"
						className={
							remote.speaking ? 'outline-2 outline-offset-4 outline-accent' : undefined
						}
					/>
					<span className="flex items-center gap-2 rounded-lg bg-background px-3 py-1.5 font-semibold text-muted">
						<VideoOffIcon className="size-4" />
						Камера выключена
					</span>
				</div>
			)}
			{remote.speaking && remote.track && (
				<div className="pointer-events-none absolute inset-0 outline-2 outline-offset-[-2px] outline-accent" />
			)}
		</div>
	)
}

function ChipStatus({ remote }: { remote: Tile }) {
	const talkStartedAt = useRoomStore((state) => state.talkStartedAt)
	if (remote.reconnecting || remote.quality <= 2) {
		return (
			<>
				<SignalBars quality={remote.reconnecting ? 1 : remote.quality} />
				<span className="font-semibold text-danger">Слабая связь</span>
			</>
		)
	}
	return (
		<>
			<EncryptionIcon />
			<CallTimer since={talkStartedAt} />
			{remote.muted && (
				<MicOffIcon className="ml-1 size-3" aria-label="Микрофон собеседника выключен" />
			)}
		</>
	)
}

export function PairStage({ self, remote, mobile, onLeave }: PairStageProps) {
	const layout = useRoomStore((state) => state.layoutPair)
	const connection = useRoomStore((state) => state.connection)
	const talkStartedAt = useRoomStore((state) => state.talkStartedAt)
	const fullscreen = useFullscreen()
	const reconnecting = connection === 'reconnecting' || remote.reconnecting
	const reconnectingName =
		connection === 'reconnecting' ? undefined : firstName(remote.fullName)

	if (mobile) {
		return (
			<div className="relative size-full overflow-hidden">
				<RemoteStage remote={remote} />
				<PeerChip name={remote.fullName} mobile>
					<ChipStatus remote={remote} />
				</PeerChip>
				<SelfPip tile={self} mobile />
				{reconnecting && <ReconnectingOverlay mobile peerName={reconnectingName} />}
				<CallControls
					variant="mobile-floating"
					mode="pair"
					keys={['mic', 'camera', 'switchCamera', 'more', 'leave']}
					onLeave={onLeave}
				/>
			</div>
		)
	}

	if (layout === 'split') {
		return (
			<div className="relative flex size-full flex-col">
				<header className="flex h-16 shrink-0 items-center justify-between px-6">
					<div className="flex items-center gap-3.5">
						<LogoMark className="h-[22px]" decorative />
						<span className="text-[15px] font-semibold">{remote.fullName}</span>
						<span className="text-muted">
							<CallTimer since={talkStartedAt} />
						</span>
					</div>
					<EncryptionPill />
				</header>
				<div className="relative grid min-h-0 flex-1 grid-cols-2 gap-3 px-6">
					<VideoTile
						tile={{ ...remote, name: firstName(remote.fullName) }}
						size="split"
					/>
					<VideoTile tile={self} size="split" />
					{reconnecting && <ReconnectingOverlay peerName={reconnectingName} />}
				</div>
				<CallControls
					variant="round"
					mode="pair"
					keys={['mic', 'camera', 'screen', 'reactions', 'chat', 'more', 'leave']}
					onLeave={onLeave}
				/>
			</div>
		)
	}

	return (
		<div className="relative size-full overflow-hidden">
			<RemoteStage remote={remote} />
			<PeerChip name={remote.fullName} initials={remote.initials}>
				<ChipStatus remote={remote} />
			</PeerChip>
			<div className="absolute top-6 right-6 z-10 flex gap-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							aria-label="Добавить участника"
							onClick={() => roomActions.setInviteOpen(true)}
							className="grid size-10 place-items-center rounded-[10px] border border-line bg-background outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent/50"
						>
							<UserPlusIcon className="size-[17px]" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Добавить участника</TooltipContent>
				</Tooltip>
				{supportsFullscreen && (
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								aria-label={
									fullscreen.active
										? 'Выйти из полноэкранного режима'
										: 'Полноэкранный режим'
								}
								onClick={fullscreen.toggle}
								className="grid size-10 place-items-center rounded-[10px] border border-line bg-background outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent/50"
							>
								{fullscreen.active ? (
									<MinimizeIcon className="size-[17px]" />
								) : (
									<Maximize2Icon className="size-[17px]" />
								)}
							</button>
						</TooltipTrigger>
						<TooltipContent>Полноэкранный режим</TooltipContent>
					</Tooltip>
				)}
			</div>
			<WeakNetworkBanner />
			<SelfPip tile={self} />
			{reconnecting && <ReconnectingOverlay peerName={reconnectingName} />}
			<CallControls
				variant="floating"
				mode="pair"
				keys={['mic', 'camera', 'screen', 'reactions', 'chat', 'more', 'leave']}
				onLeave={onLeave}
			/>
		</div>
	)
}
