import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { type VariantProps, tv } from 'tailwind-variants'
import { cn } from '../lib/utils.ts'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({
	className,
	sideOffset = 8,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				data-slot="dropdown-menu-content"
				sideOffset={sideOffset}
				className={cn(
					'z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-52 overflow-y-auto rounded-xl border border-line bg-background p-1 text-foreground shadow-lg data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
					className,
				)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	)
}

const itemVariants = tv({
	base: 'relative flex min-h-10 cursor-default items-center gap-2.5 rounded-lg px-2.5 font-medium outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-surface [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted',
	variants: {
		tone: {
			default: '',
			danger: 'text-danger [&_svg]:text-danger',
		},
	},
	defaultVariants: { tone: 'default' },
})

export function DropdownMenuItem({
	className,
	tone,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> &
	VariantProps<typeof itemVariants>) {
	return (
		<DropdownMenuPrimitive.Item
			data-slot="dropdown-menu-item"
			className={itemVariants({ tone, className })}
			{...props}
		/>
	)
}

export function DropdownMenuLabel({
	className,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
	return (
		<DropdownMenuPrimitive.Label
			className={cn('px-2.5 pt-2 pb-1 text-xs font-semibold text-muted', className)}
			{...props}
		/>
	)
}

export function DropdownMenuSeparator({
	className,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
	return (
		<DropdownMenuPrimitive.Separator
			className={cn('-mx-1 my-1 h-px bg-line', className)}
			{...props}
		/>
	)
}
