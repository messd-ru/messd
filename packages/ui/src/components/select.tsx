import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { Select as SelectPrimitive } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../lib/utils.ts'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

type SelectTriggerProps = ComponentProps<typeof SelectPrimitive.Trigger> & {
	icon?: ReactNode
}

export function SelectTrigger({
	className,
	icon,
	children,
	...props
}: SelectTriggerProps) {
	return (
		<SelectPrimitive.Trigger
			data-slot="select-trigger"
			className={cn(
				'flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border border-line bg-background px-3 text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 data-placeholder:text-muted [&_svg]:size-[15px] [&_svg]:shrink-0 [&_svg]:text-muted [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate',
				className,
			)}
			{...props}
		>
			{icon}
			{children}
			<SelectPrimitive.Icon asChild>
				<ChevronDownIcon />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	)
}

export function SelectContent({
	className,
	children,
	position = 'popper',
	...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				data-slot="select-content"
				position={position}
				className={cn(
					'relative z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-xl border border-line bg-background text-foreground shadow-lg data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
					className,
				)}
				{...props}
			>
				<SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	)
}

export function SelectItem({
	className,
	children,
	...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
	return (
		<SelectPrimitive.Item
			data-slot="select-item"
			className={cn(
				'relative flex min-h-9 cursor-default items-center gap-2 rounded-lg py-2 pr-8 pl-2.5 font-medium outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-surface',
				className,
			)}
			{...props}
		>
			<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
			<span className="absolute right-2.5 flex size-4 items-center justify-center">
				<SelectPrimitive.ItemIndicator>
					<CheckIcon className="size-4 text-accent" />
				</SelectPrimitive.ItemIndicator>
			</span>
		</SelectPrimitive.Item>
	)
}
