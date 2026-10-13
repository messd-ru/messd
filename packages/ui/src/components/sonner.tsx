import type { CSSProperties, ComponentProps } from 'react'
import { Toaster as Sonner } from 'sonner'

export function Toaster(props: ComponentProps<typeof Sonner>) {
	return (
		<Sonner
			className="toaster group"
			style={
				{
					'--normal-bg': 'var(--background)',
					'--normal-text': 'var(--foreground)',
					'--normal-border': 'var(--line)',
					'--border-radius': '12px',
				} as CSSProperties
			}
			toastOptions={{ className: 'font-sans! font-semibold!' }}
			{...props}
		/>
	)
}
