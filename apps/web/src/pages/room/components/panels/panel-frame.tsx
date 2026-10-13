import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from '@messd/ui/components/sheet'
import { XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { roomActions } from '#pages/room/store/room-store.ts'

type PanelFrameProps = {
	title: string
	description: string
	mobile: boolean
	open: boolean
	children: ReactNode
}

export function PanelFrame({
	title,
	description,
	mobile,
	open,
	children,
}: PanelFrameProps) {
	if (mobile) {
		return (
			<Sheet
				open={open}
				onOpenChange={(value) => {
					if (!value) roomActions.closePanel()
				}}
			>
				<SheetContent className="h-[620px]">
					<div className="flex items-center justify-between px-5 pt-4 pb-3">
						<SheetTitle className="m-0 text-lg font-semibold">{title}</SheetTitle>
						<SheetDescription className="sr-only">{description}</SheetDescription>
						<button
							type="button"
							aria-label="Закрыть"
							onClick={roomActions.closePanel}
							className="grid size-11 place-items-center rounded-full bg-surface"
						>
							<XIcon className="size-[18px]" />
						</button>
					</div>
					{children}
				</SheetContent>
			</Sheet>
		)
	}

	if (!open) return null

	return (
		<aside
			aria-label={title}
			className="m-3 flex min-h-0 flex-col rounded-[14px] border border-line bg-surface"
		>
			<div className="flex items-center justify-between px-4 pt-4 pb-3">
				<h2 className="m-0 text-base font-semibold">{title}</h2>
				<button
					type="button"
					aria-label="Закрыть"
					onClick={roomActions.closePanel}
					className="grid size-8 place-items-center rounded-lg text-muted outline-none hover:bg-background hover:text-foreground"
				>
					<XIcon className="size-[18px]" />
				</button>
			</div>
			{children}
		</aside>
	)
}
