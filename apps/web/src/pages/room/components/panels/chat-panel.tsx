import { Input } from '@messd/ui/components/input'
import { cn } from '@messd/ui/lib/utils'
import { LockIcon, SendHorizontalIcon } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { PanelFrame } from '#pages/room/components/panels/panel-frame.tsx'
import { useRoomSession } from '#pages/room/lib/session-context.ts'
import { useRoomStore } from '#pages/room/store/room-store.ts'

const MAX_LENGTH = 2000
const timeFormat = new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' })

export function ChatPanel({ mobile }: { mobile: boolean }) {
	const session = useRoomSession()
	const open = useRoomStore((state) => state.panel === 'chat')
	const messages = useRoomStore((state) => state.messages)
	const [text, setText] = useState('')
	const listRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
	}, [messages.length, open])

	async function submit(event: FormEvent) {
		event.preventDefault()
		const value = text.trim()
		if (!value) return
		setText('')
		try {
			await session.sendChat(value)
		} catch {
			setText(value)
			toast.error('Сообщение не отправлено')
		}
	}

	return (
		<PanelFrame
			title="Чат"
			description="Сообщения участникам звонка"
			mobile={mobile}
			open={open}
		>
			<div
				ref={listRef}
				data-testid="chat-messages"
				className={cn(
					'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto',
					mobile ? 'px-5' : 'border-t border-line p-4',
				)}
			>
				<span className="flex items-center justify-center gap-1.5 py-1 text-center text-xs text-muted">
					<LockIcon className="size-3" />
					Сообщения зашифрованы и не сохраняются
				</span>
				{messages.map((message) => (
					<div
						key={message.id}
						data-testid="chat-message"
						className={cn(
							'flex max-w-[85%] flex-col gap-1',
							message.own && 'items-end self-end',
						)}
					>
						<span className="text-xs text-muted">
							{message.own ? 'Вы' : message.name} · {timeFormat.format(message.at)}
						</span>
						<span
							className={cn(
								'rounded-xl px-3 py-2 leading-normal break-words whitespace-pre-wrap',
								message.own
									? 'bg-accent text-on-accent'
									: 'border border-line bg-background',
							)}
						>
							{message.text}
						</span>
					</div>
				))}
			</div>
			<form onSubmit={submit} className={cn('flex gap-2', mobile ? 'px-5 pt-3' : 'p-3')}>
				<Input
					aria-label="Сообщение"
					placeholder="Сообщение"
					maxLength={MAX_LENGTH}
					value={text}
					onChange={(event) => setText(event.target.value)}
					className="h-10 flex-1"
				/>
				<button
					type="submit"
					aria-label="Отправить"
					disabled={!text.trim()}
					className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-on-accent outline-none disabled:opacity-50"
				>
					<SendHorizontalIcon className="size-4" />
				</button>
			</form>
		</PanelFrame>
	)
}
