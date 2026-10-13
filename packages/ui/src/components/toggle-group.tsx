import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/utils.ts'

export function ToggleGroup({
	className,
	...props
}: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
	return (
		<ToggleGroupPrimitive.Root
			data-slot="toggle-group"
			className={cn('flex gap-0.5 rounded-[10px] border border-line p-[3px]', className)}
			{...props}
		/>
	)
}

export function ToggleGroupItem({
	className,
	...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
	return (
		<ToggleGroupPrimitive.Item
			data-slot="toggle-group-item"
			className={cn(
				'flex h-[34px] items-center justify-center gap-2 rounded-[7px] px-3.5 text-[13px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/50 data-[state=on]:bg-surface [&_svg]:size-4 [&_svg]:shrink-0',
				className,
			)}
			{...props}
		/>
	)
}
