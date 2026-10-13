import { Avatar } from '@messd/ui/components/avatar'
import { cn } from '@messd/ui/lib/utils'
import { MicOffIcon } from 'lucide-react'
import type { Tile } from '#pages/room/hooks/use-tiles.ts'
import { VideoView } from '#shared/components/video-view.tsx'

type SelfPipProps = {
	tile: Tile
	mobile?: boolean
	className?: string
}

export function SelfPip({ tile, mobile = false, className }: SelfPipProps) {
	return (
		<div
			data-testid="self-pip"
			className={cn(
				'absolute z-10 grid place-items-center overflow-hidden border-2 border-background bg-surface',
				mobile
					? 'top-[calc(12px+max(env(safe-area-inset-top),50px))] right-4 h-[150px] w-[104px] rounded-2xl'
					: 'right-6 bottom-6 h-40 w-64 rounded-[14px]',
				tile.speaking && 'outline-2 outline-offset-0 outline-accent',
				className,
			)}
		>
			{tile.track ? (
				<VideoView track={tile.track} mirror={tile.mirror} className="absolute inset-0" />
			) : (
				<Avatar initials={tile.initials} size={mobile ? 'lg' : 'xl'} tone="background" />
			)}
			{tile.muted && (
				<span className="absolute bottom-2 left-2 grid size-6 place-items-center rounded-md bg-background">
					<MicOffIcon className="size-3 text-muted" aria-label="Микрофон выключен" />
				</span>
			)}
		</div>
	)
}
