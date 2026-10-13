import { Avatar } from '@messd/ui/components/avatar'
import { cn } from '@messd/ui/lib/utils'
import { UsersIcon } from 'lucide-react'
import { describeLobby } from '#pages/room/components/lobby/lobby-info.ts'
import { useRoomStore } from '#pages/room/store/room-store.ts'
import { initials } from '#shared/lib/format.ts'

type LobbyHeadingProps = {
	compact?: boolean
	withAvatars?: boolean
}

export function LobbyHeading({
	compact = false,
	withAvatars = false,
}: LobbyHeadingProps) {
	const snapshot = useRoomStore((state) => state.snapshot)
	const peers = snapshot?.peers ?? []
	const invitee = useRoomStore((state) => state.invitee)
	const { title, status, waiting } = describeLobby(peers, invitee, compact)
	const avatarNames = peers.length
		? peers.map((peer) => peer.name)
		: invitee
			? [invitee.name]
			: []

	return (
		<div className={cn('flex flex-col', compact ? 'gap-1.5' : 'gap-3')}>
			{withAvatars && (
				<div className="flex items-center">
					{avatarNames.length ? (
						avatarNames
							.slice(0, 3)
							.map((name, index) => (
								<Avatar
									key={`${name}-${index}`}
									initials={initials(name)}
									size="md"
									className={cn('border-2 border-background', index > 0 && '-ml-2.5')}
								/>
							))
					) : (
						<div className="grid size-11 place-items-center rounded-full border-2 border-background bg-surface">
							<UsersIcon className="size-[18px] text-muted" />
						</div>
					)}
				</div>
			)}
			<h1
				data-testid="lobby-title"
				className={cn(
					'm-0 font-semibold text-pretty',
					compact ? 'text-2xl' : 'text-[30px] tracking-[-0.01em]',
				)}
			>
				{title}
			</h1>
			<span className="flex items-center gap-2 text-muted">
				<span
					className={cn(
						'size-2 shrink-0 rounded-full',
						waiting ? 'bg-accent' : 'bg-line',
					)}
				/>
				{status}
			</span>
		</div>
	)
}
