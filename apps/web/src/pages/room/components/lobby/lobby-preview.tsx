import { Avatar } from '@messd/ui/components/avatar'
import { cn } from '@messd/ui/lib/utils'
import {
	LoaderCircleIcon,
	MicIcon,
	MicOffIcon,
	SparklesIcon,
	SwitchCameraIcon,
	VideoIcon,
	VideoOffIcon,
} from 'lucide-react'
import type { ComponentProps } from 'react'
import { EffectsPopover } from '#pages/room/components/lobby/effects-popover.tsx'
import { localMedia, useLocalMedia } from '#pages/room/lib/local-media.ts'
import { LevelBars } from '#shared/components/level-bars.tsx'
import { VideoView } from '#shared/components/video-view.tsx'
import { useAudioLevel } from '#shared/hooks/use-audio-level.ts'
import { initials } from '#shared/lib/format.ts'
import { useSession } from '#shared/store/session.ts'

type PreviewButtonProps = ComponentProps<'button'> & { off?: boolean; round?: boolean }

function PreviewButton({ off, round, className, ...props }: PreviewButtonProps) {
	return (
		<button
			type="button"
			className={cn(
				'grid place-items-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/50 [&_svg]:size-[19px]',
				round
					? 'size-[52px] rounded-full [&_svg]:size-5'
					: 'size-12 rounded-[14px] border border-line',
				off ? 'border-foreground bg-foreground text-background' : 'bg-background',
				className,
			)}
			{...props}
		/>
	)
}

export function LobbyPreview({ mobile = false }: { mobile?: boolean }) {
	const guest = useSession((state) => state.guest)
	const permission = useLocalMedia((state) => state.permission)
	const videoTrack = useLocalMedia((state) => state.videoTrack)
	const micTrack = useLocalMedia((state) => state.micTrack)
	const micEnabled = useLocalMedia((state) => state.micEnabled)
	const cameraEnabled = useLocalMedia((state) => state.cameraEnabled)
	const facing = useLocalMedia((state) => state.facing)
	const level = useAudioLevel(micEnabled ? micTrack : null)

	return (
		<div
			className={cn(
				'relative overflow-hidden bg-stage',
				mobile
					? 'h-[420px] max-h-[52dvh] rounded-[20px]'
					: 'aspect-[16/10] rounded-2xl border border-line',
			)}
		>
			{videoTrack && cameraEnabled ? (
				<VideoView track={videoTrack} mirror={facing === 'user'} />
			) : (
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
					{permission === 'pending' ? (
						<>
							<LoaderCircleIcon className="size-6 animate-spin" />
							<span className="font-medium">Разрешите доступ к камере и микрофону</span>
						</>
					) : (
						<>
							<Avatar
								initials={initials(guest?.name ?? '')}
								size={mobile ? '4xl' : '5xl'}
								tone="background"
							/>
							<span className="font-medium">
								{permission === 'unavailable' ? 'Камера не найдена' : 'Камера выключена'}
							</span>
						</>
					)}
				</div>
			)}

			{!mobile && (
				<div className="absolute top-4 left-4 flex h-[30px] items-center gap-2 rounded-lg bg-background px-2.5 text-xs font-semibold">
					{micEnabled && micTrack ? (
						<>
							<LevelBars level={level} />
							{level > 0.04 ? 'Микрофон слышит вас' : 'Скажите что-нибудь'}
						</>
					) : (
						<>
							<MicOffIcon className="size-3.5 text-muted" />
							Микрофон выключен
						</>
					)}
				</div>
			)}

			{mobile && (
				<button
					type="button"
					aria-label="Переключить камеру"
					onClick={() => void localMedia.switchCamera()}
					className="absolute top-3 right-3 grid size-11 place-items-center rounded-xl bg-background"
				>
					<SwitchCameraIcon className="size-[18px]" />
				</button>
			)}

			<div
				className={cn(
					'absolute left-1/2 flex -translate-x-1/2 gap-2.5',
					mobile ? 'bottom-3.5' : 'bottom-[18px]',
				)}
			>
				<PreviewButton
					round={mobile}
					off={!micEnabled}
					aria-pressed={!micEnabled}
					aria-label={micEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
					onClick={() => void localMedia.setMic(!micEnabled)}
				>
					{micEnabled ? <MicIcon /> : <MicOffIcon />}
				</PreviewButton>
				<PreviewButton
					round={mobile}
					off={!cameraEnabled}
					aria-pressed={!cameraEnabled}
					aria-label={cameraEnabled ? 'Выключить камеру' : 'Включить камеру'}
					onClick={() => void localMedia.setCamera(!cameraEnabled)}
				>
					{cameraEnabled ? <VideoIcon /> : <VideoOffIcon />}
				</PreviewButton>
				<EffectsPopover>
					<PreviewButton round={mobile} aria-label="Эффекты">
						<SparklesIcon />
					</PreviewButton>
				</EffectsPopover>
			</div>
		</div>
	)
}
