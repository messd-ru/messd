import { cn } from '@messd/ui/lib/utils'

const chipHeights = [5, 9, 12, 7]

type LevelBarsProps = {
	level: number
	variant?: 'chip' | 'meter'
	className?: string
}

export function LevelBars({ level, variant = 'chip', className }: LevelBarsProps) {
	if (variant === 'meter') {
		const segments = 16
		const active = Math.round(level * segments)
		return (
			<span
				role="meter"
				aria-label="Уровень микрофона"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(level * 100)}
				className={cn('flex gap-[3px]', className)}
			>
				{Array.from({ length: segments }, (_, index) => (
					<span
						key={index}
						className={cn(
							'h-1 flex-1 rounded-xs',
							index < active ? 'bg-accent' : 'bg-line',
						)}
					/>
				))}
			</span>
		)
	}

	const active = Math.ceil(level * chipHeights.length * 1.4)
	return (
		<span aria-hidden className={cn('flex h-3 items-end gap-0.5', className)}>
			{chipHeights.map((height, index) => (
				<span
					key={index}
					style={{ height: index < active ? height : Math.min(height, 4) }}
					className={cn(
						'w-[3px] rounded-xs transition-[height] duration-100',
						index < active ? 'bg-accent' : 'bg-line',
					)}
				/>
			))}
		</span>
	)
}
