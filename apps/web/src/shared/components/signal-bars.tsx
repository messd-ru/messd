import { cn } from '@messd/ui/lib/utils'

const heights = [4, 7, 10, 13]

type SignalBarsProps = {
	quality: number
	className?: string
}

export function SignalBars({ quality, className }: SignalBarsProps) {
	const weak = quality <= 2
	return (
		<span
			role="img"
			aria-label={`Качество связи: ${quality} из 4`}
			className={cn('flex h-3 items-end gap-0.5', className)}
		>
			{heights.map((height, index) => (
				<span
					key={height}
					style={{ height }}
					className={cn(
						'w-[3px] rounded-xs',
						index >= quality ? 'bg-line' : weak ? 'bg-danger' : 'bg-accent',
					)}
				/>
			))}
		</span>
	)
}
