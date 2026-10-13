import { Avatar } from '@messd/ui/components/avatar'
import { cn } from '@messd/ui/lib/utils'
import type { ReactNode } from 'react'

type PeerChipProps = {
	name: string
	initials?: string
	children: ReactNode
	mobile?: boolean
	className?: string
}

export function PeerChip({
	name,
	initials,
	children,
	mobile = false,
	className,
}: PeerChipProps) {
	if (mobile) {
		return (
			<div
				className={cn(
					'absolute top-[calc(12px+max(env(safe-area-inset-top),50px))] left-4 z-10 flex max-w-[calc(100%-152px)] flex-col gap-0.5 rounded-xl bg-background px-3 py-2',
					className,
				)}
			>
				<span className="truncate font-semibold">{name}</span>
				<span className="flex items-center gap-[5px] text-xs text-muted">{children}</span>
			</div>
		)
	}

	return (
		<div
			className={cn(
				'absolute top-6 left-6 z-10 flex items-center gap-3 rounded-xl border border-line bg-background py-2 pr-3.5 pl-2',
				className,
			)}
		>
			{initials && <Avatar initials={initials} size="xs" />}
			<div className="flex flex-col">
				<span className="font-semibold">{name}</span>
				<span className="flex items-center gap-[5px] text-xs text-muted">{children}</span>
			</div>
		</div>
	)
}
