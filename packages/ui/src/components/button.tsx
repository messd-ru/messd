import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { type VariantProps, tv } from 'tailwind-variants'

const buttonVariants = tv({
	base: 'inline-flex shrink-0 items-center justify-center gap-2 font-semibold whitespace-nowrap transition-[background-color,color,opacity] outline-none select-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
	variants: {
		variant: {
			accent: 'bg-accent text-on-accent hover:opacity-90',
			inverse: 'bg-foreground text-background hover:opacity-90',
			outline: 'border border-line bg-background hover:bg-surface',
			surface: 'bg-surface hover:bg-line',
			ghost: 'text-muted hover:bg-surface hover:text-foreground',
			danger: 'bg-danger text-white hover:opacity-90',
		},
		size: {
			sm: 'h-9 rounded-lg px-3 text-[13px] [&_svg]:size-3.5',
			md: 'h-[38px] rounded-lg px-4 [&_svg]:size-[15px]',
			lg: 'h-11 rounded-[10px] px-[18px] [&_svg]:size-4',
			xl: 'h-[46px] rounded-[10px] px-[18px] text-[15px] [&_svg]:size-4',
			mobile: 'h-[50px] w-full rounded-xl px-[18px] [&_svg]:size-4',
			icon: 'size-10 rounded-[10px] [&_svg]:size-[17px]',
		},
	},
	defaultVariants: {
		variant: 'outline',
		size: 'lg',
	},
})

type ButtonProps = ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean
	}

export function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: ButtonProps) {
	const Comp = asChild ? Slot.Root : 'button'
	return (
		<Comp
			data-slot="button"
			className={buttonVariants({ variant, size, className })}
			{...props}
		/>
	)
}
