import { cn } from '@messd/ui/lib/utils'
import { useEffect, useRef } from 'react'

type VideoViewProps = {
	track: MediaStreamTrack
	mirror?: boolean
	fit?: 'cover' | 'contain'
	className?: string
}

export function VideoView({
	track,
	mirror = false,
	fit = 'cover',
	className,
}: VideoViewProps) {
	const ref = useRef<HTMLVideoElement>(null)

	useEffect(() => {
		const video = ref.current
		if (!video) return
		video.srcObject = new MediaStream([track])
		void video.play().catch(() => undefined)
		return () => {
			video.srcObject = null
		}
	}, [track])

	return (
		<video
			ref={ref}
			autoPlay
			playsInline
			muted
			className={cn(
				'size-full',
				fit === 'cover' ? 'object-cover' : 'object-contain',
				mirror && '-scale-x-100',
				className,
			)}
		/>
	)
}
