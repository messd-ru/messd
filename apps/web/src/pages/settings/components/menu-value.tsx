import { ChevronRightIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

export function MenuValue({ children, ...props }: ComponentProps<'button'>) {
	return (
		<button
			type="button"
			className="flex items-center gap-1 rounded-md text-[13px] text-muted outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
			{...props}
		>
			{children}
			<ChevronRightIcon className="size-4" />
		</button>
	)
}
