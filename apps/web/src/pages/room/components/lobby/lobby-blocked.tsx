import { cn } from '@messd/ui/lib/utils'
import { MicOffIcon, VideoOffIcon } from 'lucide-react'

const steps = [
	'Нажмите на значок замка слева от адреса сайта',
	'Разрешите доступ к камере и микрофону',
	'Нажмите «Проверить снова»',
]

export function LobbyBlocked({ mobile = false }: { mobile?: boolean }) {
	const icons = (
		<div className="flex gap-2.5">
			{[VideoOffIcon, MicOffIcon].map((Icon, index) => (
				<div
					key={index}
					className={cn(
						'grid size-[52px] place-items-center bg-background text-danger',
						mobile ? 'rounded-full' : 'rounded-[14px] border border-line',
					)}
				>
					<Icon className={mobile ? 'size-5' : 'size-[22px]'} />
				</div>
			))}
		</div>
	)

	if (mobile) {
		return (
			<div className="flex h-[300px] flex-col items-center justify-center gap-3.5 rounded-[20px] bg-surface p-6 text-center">
				{icons}
				<span className="text-lg font-semibold">Нет доступа к камере и микрофону</span>
				<span className="leading-normal text-muted">
					Откройте настройки сайта в браузере и разрешите камеру и микрофон.
				</span>
			</div>
		)
	}

	return (
		<div className="flex aspect-[16/10] flex-col items-center justify-center gap-4 rounded-2xl border border-line bg-surface p-8 text-center">
			{icons}
			<span className="text-xl font-semibold">
				Браузер заблокировал камеру и микрофон
			</span>
			<ol className="m-0 flex max-w-[420px] list-none flex-col gap-2.5 p-0 text-left">
				{steps.map((step, index) => (
					<li key={step} className="flex items-center gap-3">
						<span className="grid size-[26px] shrink-0 place-items-center rounded-full border border-line bg-background text-xs font-bold">
							{index + 1}
						</span>
						<span className="text-muted">{step}</span>
					</li>
				))}
			</ol>
		</div>
	)
}
