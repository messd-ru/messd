import { Button } from '@messd/ui/components/button'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from '@messd/ui/components/sheet'
import { LinkIcon } from 'lucide-react'
import { useState } from 'react'
import { JoinForm } from '#shared/components/join-form.tsx'

export function JoinCard() {
	return (
		<div className="flex min-h-[148px] flex-col justify-between gap-4 rounded-[14px] border border-line bg-surface p-[22px]">
			<div className="flex flex-col gap-1">
				<span className="text-xl font-semibold">Войти по ссылке</span>
				<span className="text-muted">Вставьте ссылку или код комнаты</span>
			</div>
			<JoinForm />
		</div>
	)
}

export function JoinTile() {
	const [open, setOpen] = useState(false)

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="flex flex-col gap-[26px] rounded-[14px] border border-line bg-surface p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
			>
				<LinkIcon className="size-5" />
				<span className="text-[15px] font-semibold">По ссылке</span>
			</button>
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent className="gap-4 px-5 pt-4">
					<div className="flex flex-col gap-1">
						<SheetTitle className="m-0 text-lg font-semibold">Войти по ссылке</SheetTitle>
						<SheetDescription className="m-0 text-muted">
							Вставьте ссылку или код комнаты
						</SheetDescription>
					</div>
					<JoinForm size="lg" autoFocus />
					<Button variant="outline" size="mobile" onClick={() => setOpen(false)}>
						Отмена
					</Button>
				</SheetContent>
			</Sheet>
		</>
	)
}
