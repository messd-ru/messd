import { Dialog as SheetPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/utils.ts'

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close
export const SheetTitle = SheetPrimitive.Title
export const SheetDescription = SheetPrimitive.Description

export function SheetContent({
	className,
	children,
	...props
}: ComponentProps<typeof SheetPrimitive.Content>) {
	return (
		<SheetPrimitive.Portal>
			<SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
			<SheetPrimitive.Content
				data-slot="sheet-content"
				className={cn(
					'fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl bg-background pb-[max(env(safe-area-inset-bottom),16px)] text-foreground outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
					className,
				)}
				{...props}
			>
				<div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-sm bg-line" />
				{children}
			</SheetPrimitive.Content>
		</SheetPrimitive.Portal>
	)
}
