import { Popover, PopoverContent, PopoverTrigger } from '@messd/ui/components/popover'
import { Switch } from '@messd/ui/components/switch'
import type { ReactNode } from 'react'
import { localMedia, useLocalMedia } from '#pages/room/lib/local-media.ts'

export function EffectsPopover({ children }: { children: ReactNode }) {
	const blur = useLocalMedia((state) => state.blur)
	const blurPending = useLocalMedia((state) => state.blurPending)
	const noiseSuppression = useLocalMedia((state) => state.noiseSuppression)

	return (
		<Popover>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent side="top" className="flex w-64 flex-col p-0">
				<EffectToggle
					id="effect-blur"
					label="Размыть фон"
					hint={blurPending ? 'Загружаем модель…' : 'Скрыть то, что за спиной'}
					checked={blur}
					onChange={(value) => void localMedia.setBlur(value)}
				/>
				<EffectToggle
					id="effect-noise"
					label="Шумоподавление"
					hint="Убрать фоновые звуки"
					checked={noiseSuppression}
					onChange={(value) => void localMedia.setNoiseSuppression(value)}
					bordered
				/>
			</PopoverContent>
		</Popover>
	)
}

type EffectToggleProps = {
	id: string
	label: string
	hint: ReactNode
	checked: boolean
	onChange: (value: boolean) => void
	bordered?: boolean
}

export function EffectToggle({
	id,
	label,
	hint,
	checked,
	onChange,
	bordered,
}: EffectToggleProps) {
	return (
		<div
			className={
				bordered
					? 'flex items-center justify-between gap-4 border-t border-line px-4 py-3.5'
					: 'flex items-center justify-between gap-4 px-4 py-3.5'
			}
		>
			<label htmlFor={id} className="flex flex-col gap-0.5">
				<span className="font-semibold">{label}</span>
				<span className="text-xs text-muted">{hint}</span>
			</label>
			<Switch id={id} checked={checked} onCheckedChange={onChange} />
		</div>
	)
}
