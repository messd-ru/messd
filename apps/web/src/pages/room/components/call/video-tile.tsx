import { Avatar } from '@messd/ui/components/avatar'
import { cn } from '@messd/ui/lib/utils'
import { HandIcon, LoaderCircleIcon, MicOffIcon, VideoOffIcon } from 'lucide-react'
import { type VariantProps, tv } from 'tailwind-variants'
import type { Tile } from '#pages/room/hooks/use-tiles.ts'
import { LevelBars } from '#shared/components/level-bars.tsx'
import { SignalBars } from '#shared/components/signal-bars.tsx'
import { VideoView } from '#shared/components/video-view.tsx'

const tileVariants = tv({
	slots: {
		root: 'relative grid min-h-0 min-w-0 place-items-center overflow-hidden bg-surface outline-offset-[-2px]',
		label:
			'absolute flex max-w-[calc(100%-16px)] items-center bg-background font-semibold [&_svg]:shrink-0 [&_svg]:text-muted',
	},
	variants: {
		size: {
			main: {
				root: 'rounded-2xl',
				label: 'bottom-4 left-4 h-8 gap-2 rounded-lg px-3 text-[13px]',
			},
			split: {
				root: 'rounded-2xl',
				label:
					'bottom-3.5 left-3.5 h-[30px] gap-1.5 rounded-lg px-3 text-[13px] [&_svg]:size-[13px]',
			},
			grid: {
				root: 'rounded-[14px]',
				label: 'bottom-3 left-3 h-7 gap-1.5 rounded-lg px-2.5 text-xs [&_svg]:size-3',
			},
			compact: {
				root: 'rounded-[14px]',
				label:
					'bottom-2.5 left-2.5 h-[26px] gap-1.5 rounded-[7px] px-[9px] text-xs [&_svg]:size-3',
			},
			strip: {
				root: 'h-28 shrink-0 rounded-xl',
				label:
					'bottom-2 left-2 h-6 gap-[5px] rounded-md px-2 text-[11px] [&_svg]:size-[11px]',
			},
			mobile: {
				root: 'rounded-[14px]',
				label:
					'bottom-2 left-2 h-6 gap-[5px] rounded-md px-2 text-[11px] [&_svg]:size-[11px]',
			},
		},
		speaking: {
			true: { root: 'outline-2 outline-accent' },
		},
	},
})

const avatarSizes = {
	main: '5xl',
	split: '5xl',
	grid: '3xl',
	compact: 'xl',
	strip: 'lg',
	mobile: 'lg',
} as const

type VideoTileProps = VariantProps<typeof tileVariants> & {
	tile: Tile
	size: keyof typeof avatarSizes
	className?: string
	showLevel?: boolean
}

export function VideoTile({ tile, size, className, showLevel = false }: VideoTileProps) {
	const { root, label } = tileVariants({ size, speaking: tile.speaking })
	const showCameraOff = size === 'split' && !tile.track

	return (
		<div
			data-testid="video-tile"
			data-peer={tile.self ? 'self' : tile.peerId}
			data-name={tile.fullName}
			data-speaking={tile.speaking}
			className={root({ className })}
		>
			{tile.track ? (
				<VideoView
					track={tile.track}
					mirror={tile.mirror}
					fit={tile.source === 'screen' ? 'contain' : 'cover'}
					className={cn('absolute inset-0', tile.source === 'screen' && 'bg-stage')}
				/>
			) : (
				<Avatar initials={tile.initials} size={avatarSizes[size]} tone="background" />
			)}
			{tile.reconnecting && (
				<div className="absolute inset-0 grid place-items-center bg-background/70">
					<span className="flex items-center gap-2 font-semibold">
						<LoaderCircleIcon className="size-4 animate-spin" />
						Переподключается…
					</span>
				</div>
			)}
			{tile.hand && tile.source === 'camera' && (
				<span className="absolute top-2.5 left-2.5 grid size-8 place-items-center rounded-lg bg-background text-accent">
					<HandIcon className="size-4" aria-label="Поднята рука" />
				</span>
			)}
			{tile.quality <= 2 && !tile.self && tile.source === 'camera' && (
				<span className="absolute top-2.5 right-2.5 grid h-7 place-items-center rounded-md bg-background px-1.5">
					<SignalBars quality={tile.quality} />
				</span>
			)}
			<span className={label()}>
				{showLevel && tile.speaking && <LevelBars level={0.8} />}
				{tile.muted && tile.source === 'camera' && (
					<MicOffIcon aria-label="Микрофон выключен" />
				)}
				{showCameraOff && <VideoOffIcon aria-label="Камера выключена" />}
				<span className="truncate">{tile.name}</span>
			</span>
		</div>
	)
}
