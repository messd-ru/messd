import type { ComponentProps } from 'react'
import { type VariantProps, tv } from 'tailwind-variants'

const controlButtonVariants = tv({
	base: 'relative grid shrink-0 place-items-center transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50',
	variants: {
		shape: {
			square: 'size-12 rounded-xl bg-surface hover:bg-line [&_svg]:size-[19px]',
			round:
				'size-[52px] rounded-full border border-line hover:bg-surface [&_svg]:size-5',
			mobile: 'size-[52px] rounded-full bg-surface [&_svg]:size-5',
		},
		state: {
			default: '',
			off: 'border-foreground bg-foreground text-background hover:bg-foreground',
			active: 'border-accent bg-accent text-on-accent hover:bg-accent',
		},
	},
	defaultVariants: {
		shape: 'square',
		state: 'default',
	},
})

export type ControlShape = NonNullable<
	VariantProps<typeof controlButtonVariants>['shape']
>

type ControlButtonProps = ComponentProps<'button'> &
	VariantProps<typeof controlButtonVariants> & {
		badge?: number
	}

export function ControlButton({
	shape,
	state,
	badge,
	className,
	children,
	...props
}: ControlButtonProps) {
	return (
		<button
			type="button"
			className={controlButtonVariants({ shape, state, className })}
			{...props}
		>
			{children}
			{Boolean(badge) && (
				<span className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent">
					{badge}
				</span>
			)}
		</button>
	)
}

const leaveVariants = tv({
	base: 'grid shrink-0 place-items-center bg-danger text-white transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-danger/50',
	variants: {
		shape: {
			square: 'h-12 w-16 rounded-xl [&_svg]:size-[19px]',
			round:
				'ml-2 flex h-[52px] items-center gap-2 rounded-full px-[22px] font-semibold [&_svg]:size-[18px]',
			mobile: 'size-[52px] rounded-full [&_svg]:size-5',
		},
	},
})

export function LeaveButton({
	shape,
	className,
	...props
}: ComponentProps<'button'> & VariantProps<typeof leaveVariants>) {
	return (
		<button type="button" className={leaveVariants({ shape, className })} {...props} />
	)
}
