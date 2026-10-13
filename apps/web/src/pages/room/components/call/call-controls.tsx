import { cn } from '@messd/ui/lib/utils'
import {
	EllipsisIcon,
	HandIcon,
	MessageCircleIcon,
	MicIcon,
	MicOffIcon,
	MonitorUpIcon,
	PhoneOffIcon,
	SmileIcon,
	SwitchCameraIcon,
	UsersIcon,
	VideoIcon,
	VideoOffIcon,
} from 'lucide-react'
import { Fragment } from 'react'
import {
	ControlButton,
	type ControlShape,
	LeaveButton,
} from '#pages/room/components/call/control-button.tsx'
import { type CallMode, MoreMenu } from '#pages/room/components/call/more-menu.tsx'
import { ReactionsPopover } from '#pages/room/components/call/reactions.tsx'
import { localMedia, useLocalMedia } from '#pages/room/lib/local-media.ts'
import { useRoomSession } from '#pages/room/lib/session-context.ts'
import { roomActions, useRoomStore } from '#pages/room/store/room-store.ts'
import { supportsScreenShare } from '#shared/lib/media-support.ts'

export type ControlKey =
	| 'mic'
	| 'camera'
	| 'screen'
	| 'reactions'
	| 'chat'
	| 'hand'
	| 'participants'
	| 'switchCamera'
	| 'more'
	| 'leave'

type BarVariant = 'floating' | 'plain' | 'round' | 'mobile-floating' | 'mobile-plain'

const shapes: Record<BarVariant, ControlShape> = {
	floating: 'square',
	plain: 'square',
	round: 'round',
	'mobile-floating': 'mobile',
	'mobile-plain': 'mobile',
}

const containers: Record<BarVariant, string> = {
	floating:
		'absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-[18px] border border-line bg-background p-2',
	plain: 'flex h-[92px] shrink-0 items-center justify-center gap-2',
	round: 'flex h-24 shrink-0 items-center justify-center gap-2.5',
	'mobile-floating':
		'absolute inset-x-4 bottom-[max(34px,calc(env(safe-area-inset-bottom)+12px))] z-20 flex justify-between rounded-3xl bg-background p-2.5',
	'mobile-plain':
		'flex shrink-0 justify-between px-4 pt-3.5 pb-[max(34px,calc(env(safe-area-inset-bottom)+12px))]',
}

type CallControlsProps = {
	variant: BarVariant
	keys: ControlKey[]
	mode: CallMode
	onLeave: () => void
	className?: string
}

export function CallControls({
	variant,
	keys,
	mode,
	onLeave,
	className,
}: CallControlsProps) {
	const session = useRoomSession()
	const micEnabled = useLocalMedia((state) => state.micEnabled)
	const cameraEnabled = useLocalMedia((state) => state.cameraEnabled)
	const screenTrack = useLocalMedia((state) => state.screenTrack)
	const hand = useRoomStore((state) => state.hand)
	const panel = useRoomStore((state) => state.panel)
	const unread = useRoomStore((state) => state.unread)
	const shape = shapes[variant]
	const mobile = shape === 'mobile'

	function render(key: ControlKey) {
		switch (key) {
			case 'mic':
				return (
					<ControlButton
						shape={shape}
						state={micEnabled ? 'default' : 'off'}
						aria-pressed={!micEnabled}
						aria-label={micEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
						onClick={() => void localMedia.setMic(!micEnabled)}
					>
						{micEnabled ? <MicIcon /> : <MicOffIcon />}
					</ControlButton>
				)
			case 'camera':
				return (
					<ControlButton
						shape={shape}
						state={cameraEnabled ? 'default' : 'off'}
						aria-pressed={!cameraEnabled}
						aria-label={cameraEnabled ? 'Выключить камеру' : 'Включить камеру'}
						onClick={() => void localMedia.setCamera(!cameraEnabled)}
					>
						{cameraEnabled ? <VideoIcon /> : <VideoOffIcon />}
					</ControlButton>
				)
			case 'screen':
				return supportsScreenShare ? (
					<ControlButton
						shape={shape}
						state={screenTrack ? 'active' : 'default'}
						aria-pressed={Boolean(screenTrack)}
						aria-label={screenTrack ? 'Остановить демонстрацию' : 'Демонстрация экрана'}
						onClick={() =>
							screenTrack ? localMedia.stopScreen() : void localMedia.startScreen()
						}
					>
						<MonitorUpIcon />
					</ControlButton>
				) : null
			case 'reactions':
				return (
					<ReactionsPopover>
						<ControlButton shape={shape} aria-label="Реакции">
							<SmileIcon />
						</ControlButton>
					</ReactionsPopover>
				)
			case 'chat':
				return (
					<ControlButton
						shape={shape}
						state={panel === 'chat' ? 'active' : 'default'}
						aria-pressed={panel === 'chat'}
						aria-label="Чат"
						badge={panel === 'chat' ? 0 : unread}
						onClick={() => roomActions.togglePanel('chat')}
					>
						<MessageCircleIcon />
					</ControlButton>
				)
			case 'hand':
				return (
					<ControlButton
						shape={shape}
						state={hand ? 'active' : 'default'}
						aria-pressed={hand}
						aria-label={hand ? 'Опустить руку' : 'Поднять руку'}
						onClick={() => void session.setHand(!hand)}
					>
						<HandIcon />
					</ControlButton>
				)
			case 'participants':
				return (
					<ControlButton
						shape={shape}
						state={panel === 'participants' ? 'active' : 'default'}
						aria-pressed={panel === 'participants'}
						aria-label="Участники"
						onClick={() => roomActions.togglePanel('participants')}
					>
						<UsersIcon />
					</ControlButton>
				)
			case 'switchCamera':
				return (
					<ControlButton
						shape={shape}
						aria-label="Переключить камеру"
						disabled={!cameraEnabled}
						onClick={() => void localMedia.switchCamera()}
					>
						<SwitchCameraIcon />
					</ControlButton>
				)
			case 'more':
				return (
					<MoreMenu mode={mode} mobile={mobile}>
						<ControlButton shape={shape} aria-label="Ещё" badge={mobile ? unread : 0}>
							<EllipsisIcon />
						</ControlButton>
					</MoreMenu>
				)
			case 'leave':
				return (
					<>
						{variant === 'floating' && <div className="mx-0.5 my-1.5 w-px bg-line" />}
						<LeaveButton
							shape={shape}
							aria-label="Завершить звонок"
							onClick={onLeave}
							className={variant === 'plain' ? 'ml-2' : undefined}
						>
							<PhoneOffIcon />
							{shape === 'round' && 'Завершить'}
						</LeaveButton>
					</>
				)
		}
	}

	return (
		<div
			role="toolbar"
			aria-label="Управление звонком"
			className={cn(containers[variant], className)}
		>
			{keys.map((key) => (
				<Fragment key={key}>{render(key)}</Fragment>
			))}
		</div>
	)
}
