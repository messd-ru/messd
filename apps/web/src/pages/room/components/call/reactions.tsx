import { reactionEmojis } from '@messd/contracts/signaling'
import { Popover, PopoverContent, PopoverTrigger } from '@messd/ui/components/popover'
import { cn } from '@messd/ui/lib/utils'
import type { ReactNode } from 'react'
import { useRoomSession } from '#pages/room/lib/session-context.ts'
import { useRoomStore } from '#pages/room/store/room-store.ts'

export function EmojiRow({
	onPick,
	className,
}: {
	onPick?: () => void
	className?: string
}) {
	const session = useRoomSession()
	return (
		<div className={cn('flex gap-1', className)}>
			{reactionEmojis.map((emoji) => (
				<button
					key={emoji}
					type="button"
					aria-label={`Реакция ${emoji}`}
					onClick={() => {
						void session.sendReaction(emoji)
						onPick?.()
					}}
					className="grid size-10 place-items-center rounded-lg text-[22px] transition-transform outline-none hover:scale-110 hover:bg-surface focus-visible:bg-surface"
				>
					{emoji}
				</button>
			))}
		</div>
	)
}

export function ReactionsPopover({ children }: { children: ReactNode }) {
	return (
		<Popover>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent side="top" className="p-1.5">
				<EmojiRow />
			</PopoverContent>
		</Popover>
	)
}

export function ReactionsLayer() {
	const reactions = useRoomStore((state) => state.reactions)

	return (
		<div
			aria-live="polite"
			className="pointer-events-none absolute bottom-28 left-6 z-30 flex flex-col-reverse gap-2"
		>
			{reactions.map((reaction, index) => (
				<div
					key={reaction.id}
					style={{ marginLeft: (index % 3) * 28 }}
					className="animate-reaction flex items-center gap-2"
				>
					<span className="text-[32px] leading-none">{reaction.emoji}</span>
					<span className="rounded-md bg-background px-2 py-1 text-xs font-semibold">
						{reaction.name}
					</span>
				</div>
			))}
		</div>
	)
}
