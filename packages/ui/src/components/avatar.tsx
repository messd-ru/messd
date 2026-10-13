import type { ComponentProps } from 'react'
import { type VariantProps, tv } from 'tailwind-variants'

const avatarVariants = tv({
	base: 'grid shrink-0 place-items-center rounded-full font-bold select-none',
	variants: {
		size: {
			xs: 'size-[34px] text-xs',
			sm: 'size-10 text-[13px]',
			md: 'size-11 text-sm',
			lg: 'size-[52px] text-base',
			xl: 'size-[60px] text-lg',
			'2xl': 'size-[72px] text-[23px]',
			'3xl': 'size-[84px] text-2xl',
			'4xl': 'size-[88px] text-[28px]',
			'5xl': 'size-28 text-[32px]',
		},
		tone: {
			surface: 'bg-surface',
			background: 'border border-line bg-background',
		},
	},
	defaultVariants: {
		size: 'sm',
		tone: 'surface',
	},
})

type AvatarProps = ComponentProps<'div'> &
	VariantProps<typeof avatarVariants> & {
		initials: string
	}

export function Avatar({ initials, size, tone, className, ...props }: AvatarProps) {
	return (
		<div
			data-slot="avatar"
			className={avatarVariants({ size, tone, className })}
			{...props}
		>
			{initials}
		</div>
	)
}
