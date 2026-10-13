import { cn } from '@messd/ui/lib/utils'
import { GroupStage } from '#pages/room/components/call/group-stage.tsx'
import { PairStage } from '#pages/room/components/call/pair-stage.tsx'
import { PeerLeftStage } from '#pages/room/components/call/peer-left-stage.tsx'
import { ReactionsLayer } from '#pages/room/components/call/reactions.tsx'
import { RemoteAudio } from '#pages/room/components/call/remote-audio.tsx'
import { WaitingStage } from '#pages/room/components/call/waiting-stage.tsx'
import { ChatPanel } from '#pages/room/components/panels/chat-panel.tsx'
import { InviteDialog } from '#pages/room/components/panels/invite-dialog.tsx'
import { ParticipantsPanel } from '#pages/room/components/panels/participants-panel.tsx'
import { useTiles } from '#pages/room/hooks/use-tiles.ts'
import { useRoomStore } from '#pages/room/store/room-store.ts'
import { useIsDesktop } from '#shared/hooks/use-media-query.ts'

type CallViewProps = {
	onLeave: () => void
}

export function CallView({ onLeave }: CallViewProps) {
	const mobile = !useIsDesktop()
	const { self, remote, screens } = useTiles()
	const leftPeer = useRoomStore((state) => state.leftPeer)
	const pinnedId = useRoomStore((state) => state.pinnedId)
	const panel = useRoomStore((state) => state.panel)
	const [first] = remote
	const mode =
		remote.length === 0
			? leftPeer
				? 'left'
				: 'waiting'
			: remote.length === 1 && first && !screens.length && !pinnedId
				? 'pair'
				: 'group'

	return (
		<div
			data-testid="call-view"
			data-mode={mode}
			className={cn(
				'h-dvh overflow-hidden bg-background',
				!mobile && panel ? 'grid grid-cols-[minmax(0,1fr)_340px]' : 'relative',
			)}
		>
			<div className="relative size-full min-w-0 overflow-hidden">
				{mode === 'waiting' && (
					<WaitingStage self={self} mobile={mobile} onLeave={onLeave} />
				)}
				{mode === 'left' && leftPeer && (
					<PeerLeftStage self={self} left={leftPeer} mobile={mobile} onLeave={onLeave} />
				)}
				{mode === 'pair' && first && (
					<PairStage self={self} remote={first} mobile={mobile} onLeave={onLeave} />
				)}
				{mode === 'group' && (
					<GroupStage
						self={self}
						remote={remote}
						screens={screens}
						mobile={mobile}
						onLeave={onLeave}
					/>
				)}
				<ReactionsLayer />
			</div>
			<ParticipantsPanel mobile={mobile} />
			<ChatPanel mobile={mobile} />
			<RemoteAudio />
			<InviteDialog />
		</div>
	)
}
