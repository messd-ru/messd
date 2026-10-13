import { cn } from '@messd/ui/lib/utils'
import markUrl from '#assets/svg/mark.svg'

type LogoMarkProps = {
	className?: string
	decorative?: boolean
}

export function LogoMark({ className, decorative = false }: LogoMarkProps) {
	return (
		<img
			src={markUrl}
			alt={decorative ? '' : 'MESSD'}
			className={cn('h-7 w-auto select-none dark:invert', className)}
			draggable={false}
		/>
	)
}
