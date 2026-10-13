import { Button } from '@messd/ui/components/button'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from '@messd/ui/components/sheet'
import { RotateCwIcon } from 'lucide-react'

const isIos = /iP(hone|ad|od)/.test(navigator.userAgent)

const steps = isIos
	? [
			'Нажмите «аА» в адресной строке Safari',
			'Откройте «Настройки веб-сайта»',
			'Для камеры и микрофона выберите «Разрешить»',
		]
	: [
			'Нажмите на значок слева от адреса сайта',
			'Откройте «Разрешения» или «Настройки сайта»',
			'Разрешите камеру и микрофон',
		]

type PermissionHelpSheetProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onRetry: () => void
}

export function PermissionHelpSheet({
	open,
	onOpenChange,
	onRetry,
}: PermissionHelpSheetProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="gap-4 px-5 pt-4">
				<div className="flex flex-col gap-1">
					<SheetTitle className="m-0 text-lg font-semibold">
						Как включить доступ
					</SheetTitle>
					<SheetDescription className="m-0 text-muted">
						Браузер запомнил запрет — поменяйте его в настройках сайта
					</SheetDescription>
				</div>
				<ol className="m-0 flex list-none flex-col gap-3 p-0">
					{steps.map((step, index) => (
						<li key={step} className="flex items-center gap-3">
							<span className="grid size-[26px] shrink-0 place-items-center rounded-full border border-line text-xs font-bold">
								{index + 1}
							</span>
							<span className="text-muted">{step}</span>
						</li>
					))}
				</ol>
				<Button
					variant="accent"
					size="mobile"
					onClick={() => {
						onOpenChange(false)
						onRetry()
					}}
				>
					<RotateCwIcon />
					Проверить снова
				</Button>
			</SheetContent>
		</Sheet>
	)
}
