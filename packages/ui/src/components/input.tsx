import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../lib/utils.ts'

type InputProps = ComponentProps<'input'> & {
	icon?: ReactNode
	invalid?: boolean
}

export function Input({ className, icon, invalid, ...props }: InputProps) {
	return (
		<label
			data-slot="input"
			data-invalid={invalid || undefined}
			className={cn(
				'flex h-[38px] min-w-0 items-center gap-2 rounded-lg border border-line bg-background px-3 text-foreground transition-colors focus-within:border-muted data-invalid:border-danger [&_svg]:size-[15px] [&_svg]:shrink-0 [&_svg]:text-muted',
				className,
			)}
		>
			{icon}
			<input
				aria-invalid={invalid || undefined}
				className="h-full min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:font-medium placeholder:text-muted"
				{...props}
			/>
		</label>
	)
}
