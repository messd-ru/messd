import { Button } from '@messd/ui/components/button'
import { cn } from '@messd/ui/lib/utils'
import { PhoneIcon, WifiLowIcon } from 'lucide-react'
import { useLocalMedia } from '#pages/room/lib/local-media.ts'
import { useRoomSession } from '#pages/room/lib/session-context.ts'
import { useRoomStore } from '#pages/room/store/room-store.ts'

export function WeakNetworkBanner() {
	const session = useRoomSession()
	const quality = useRoomStore((state) => state.quality)
	const audioOnly = useRoomStore((state) => state.audioOnly)
	const connection = useRoomStore((state) => state.connection)
	const cameraEnabled = useLocalMedia((state) => state.cameraEnabled)

	if (connection === 'reconnecting') return null
	if (!audioOnly && (quality > 2 || !cameraEnabled)) return null

	return (
		<div
			role="status"
			className="absolute top-6 left-1/2 z-20 flex h-10 w-max -translate-x-1/2 items-center gap-2.5 rounded-[10px] border border-line bg-background px-3.5 font-semibold whitespace-nowrap"
		>
			<WifiLowIcon className="size-4" />
			{audioOnly
				? 'Включён режим «только звук» — видео собеседников скрыто'
				: 'Ваше соединение нестабильно — видео снижено до 360p'}
			<button
				type="button"
				onClick={() => void session.setAudioOnly(!audioOnly)}
				className="rounded-md text-accent outline-none hover:underline focus-visible:underline"
			>
				{audioOnly ? 'Вернуть видео' : 'Только звук'}
			</button>
		</div>
	)
}

type ReconnectingCardProps = {
	peerName?: string
	mobile?: boolean
}

export function ReconnectingOverlay({ peerName, mobile = false }: ReconnectingCardProps) {
	const session = useRoomSession()
	const audioOnly = useRoomStore((state) => state.audioOnly)

	return (
		<>
			<div className="absolute inset-0 z-10 bg-background/72" />
			<div
				role="alert"
				className={cn(
					'absolute top-1/2 z-20 flex -translate-y-1/2 flex-col items-center bg-background text-center',
					mobile
						? 'inset-x-4 gap-4 rounded-[20px] p-6'
						: 'left-1/2 w-[380px] max-w-[calc(100%-32px)] -translate-x-1/2 gap-[18px] rounded-[18px] border border-line p-7',
				)}
			>
				<div
					className={cn(
						'animate-spin rounded-full border-[3px] border-line border-t-accent',
						mobile ? 'size-12' : 'size-14',
					)}
				/>
				<div className="flex flex-col gap-1.5">
					<span className={cn('font-semibold', mobile ? 'text-xl' : 'text-[22px]')}>
						Переподключаемся…
					</span>
					<span className="leading-normal text-pretty text-muted">
						{peerName
							? `Связь с собеседником прервалась. Ждём, пока ${peerName} вернётся, — звонок не завершён.`
							: mobile
								? 'Связь прервалась. Звонок не завершён.'
								: 'Связь прервалась. Пробуем восстановить — звонок не завершён.'}
					</span>
				</div>
				{mobile && !audioOnly && (
					<Button
						variant="outline"
						size="mobile"
						onClick={() => void session.setAudioOnly(true)}
					>
						<PhoneIcon />
						Перейти на только звук
					</Button>
				)}
			</div>
		</>
	)
}
