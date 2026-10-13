import { Switch as SwitchPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/utils.ts'

export function Switch({
	className,
	...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			className={cn(
				'peer relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full bg-line transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 data-[state=checked]:bg-accent',
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb className="pointer-events-none block size-4 translate-x-[3px] rounded-full bg-background transition-transform data-[state=checked]:translate-x-[21px] data-[state=checked]:bg-on-accent" />
		</SwitchPrimitive.Root>
	)
}
