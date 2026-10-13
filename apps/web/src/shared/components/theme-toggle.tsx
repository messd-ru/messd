import { ToggleGroup, ToggleGroupItem } from '@messd/ui/components/toggle-group'
import { cn } from '@messd/ui/lib/utils'
import { MoonIcon, SunIcon } from 'lucide-react'
import { type Theme, usePreferences } from '#shared/store/preferences.ts'

type ThemeToggleProps = {
	variant?: 'icons' | 'labels'
	className?: string
	itemClassName?: string
}

export function ThemeToggle({
	variant = 'labels',
	className,
	itemClassName,
}: ThemeToggleProps) {
	const theme = usePreferences((state) => state.theme)
	const setPreference = usePreferences((state) => state.set)
	const labels = variant === 'labels'

	return (
		<ToggleGroup
			type="single"
			value={theme}
			aria-label="Тема оформления"
			onValueChange={(value) => {
				if (value) setPreference('theme', value as Theme)
			}}
			className={cn(!labels && 'grid grid-cols-2', className)}
		>
			<ToggleGroupItem value="light" aria-label="Светлая тема" className={itemClassName}>
				<SunIcon />
				{labels && 'Светлая'}
			</ToggleGroupItem>
			<ToggleGroupItem value="dark" aria-label="Тёмная тема" className={itemClassName}>
				<MoonIcon />
				{labels && 'Тёмная'}
			</ToggleGroupItem>
		</ToggleGroup>
	)
}
