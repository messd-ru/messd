import type { RoomNotFoundReason } from '@messd/contracts/room'
import { Button } from '@messd/ui/components/button'
import { ChevronLeftIcon, HouseIcon, Link2OffIcon, VideoIcon } from 'lucide-react'
import { Link } from 'react-router'
import { JoinForm } from '#shared/components/join-form.tsx'
import { LogoMark } from '#shared/components/logo-mark.tsx'
import { useIsDesktop } from '#shared/hooks/use-media-query.ts'
import { useStartCall } from '#shared/hooks/use-start-call.ts'
import { roomLinkLabel } from '#shared/lib/room-link.ts'

type RoomNotFoundProps = {
	code: string
	reason: RoomNotFoundReason
}

export function RoomNotFound({ code, reason }: RoomNotFoundProps) {
	const isDesktop = useIsDesktop()
	const { start, pending } = useStartCall()
	const ended = reason === 'ended'

	if (!isDesktop) {
		return (
			<div className="flex h-dvh flex-col safe-top safe-bottom">
				<Link
					to="/"
					className="flex items-center gap-2 px-4 py-2 pt-[calc(8px+max(0px,12px-env(safe-area-inset-top)))] font-semibold text-muted"
				>
					<ChevronLeftIcon className="size-5" />
					Назад
				</Link>
				<div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
					<div className="grid size-16 place-items-center rounded-full bg-surface text-muted">
						<Link2OffIcon className="size-[26px]" />
					</div>
					<h1 className="m-0 text-[26px] font-semibold">Комната не найдена</h1>
					<span className="leading-[1.55] text-pretty text-muted">
						{ended
							? 'Звонок уже завершён. Попросите прислать новую ссылку.'
							: 'Ссылка недействительна или звонок уже завершён. Попросите прислать новую.'}
					</span>
				</div>
				<div className="flex flex-col gap-2.5 px-5 pt-4 pb-[max(0px,34px-env(safe-area-inset-bottom))]">
					<Button
						variant="accent"
						size="mobile"
						disabled={pending}
						onClick={() => void start()}
					>
						<VideoIcon />
						Новый звонок
					</Button>
					<Button variant="outline" size="mobile" asChild>
						<Link to="/">На главную</Link>
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="flex h-dvh flex-col">
			<header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-7">
				<Link
					to="/"
					className="flex w-[110px] items-center gap-2 font-semibold text-muted"
				>
					<ChevronLeftIcon className="size-[18px]" />
					На главную
				</Link>
				<LogoMark />
				<div className="w-[110px]" />
			</header>
			<main className="flex flex-1 flex-col items-center justify-center gap-7 p-12">
				<div className="flex max-w-[460px] flex-col items-center gap-[18px] text-center">
					<div className="grid size-16 place-items-center rounded-full bg-surface text-muted">
						<Link2OffIcon className="size-[26px]" />
					</div>
					<h1 className="m-0 text-[32px] font-semibold tracking-[-0.01em]">
						Комната не найдена
					</h1>
					<span className="text-[15px] leading-[1.55] text-pretty text-muted">
						Ссылка{' '}
						<span className="font-semibold text-foreground">{roomLinkLabel(code)}</span>{' '}
						{ended
							? 'больше не работает — звонок уже завершён.'
							: 'недействительна или звонок уже завершён.'}{' '}
						Проверьте ссылку или попросите прислать новую.
					</span>
				</div>
				<JoinForm
					size="lg"
					placeholder="Вставьте другую ссылку или код"
					className="w-full max-w-[460px]"
				/>
				<div className="flex gap-2">
					<Button variant="accent" disabled={pending} onClick={() => void start()}>
						<VideoIcon />
						Новый звонок
					</Button>
					<Button variant="outline" asChild>
						<Link to="/">
							<HouseIcon />
							На главную
						</Link>
					</Button>
				</div>
			</main>
		</div>
	)
}
