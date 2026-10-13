import type { Peer, RoomSnapshot } from '@messd/contracts/signaling'
import { create } from 'zustand'
import type { Invitee } from '#shared/hooks/use-start-call.ts'

export type RemoteMedia = {
	audio?: MediaStreamTrack
	camera?: MediaStreamTrack
	screen?: MediaStreamTrack
}

export type ChatMessage = {
	id: string
	peerId: string
	name: string
	text: string
	at: number
	own: boolean
}

export type Reaction = {
	id: string
	name: string
	emoji: string
}

export type Panel = 'participants' | 'chat'

export type RoomPhase = 'lobby' | 'joining' | 'call' | 'removed' | 'ended'

export type LeftPeer = {
	peer: Peer
	duration: number
	leftAt: number
}

type RoomState = {
	code: string
	phase: RoomPhase
	snapshot: RoomSnapshot | null
	selfId: string | null
	creatorId: string | null
	peers: Record<string, Peer>
	media: Record<string, RemoteMedia>
	activeSpeakerId: string | null
	pinnedId: string | null
	layoutPair: 'focus' | 'split'
	layoutGroup: 'grid' | 'speaker'
	panel: Panel | null
	inviteOpen: boolean
	connection: 'connected' | 'reconnecting'
	quality: number
	audioOnly: boolean
	hand: boolean
	joinedAt: number | null
	talkStartedAt: number | null
	leftPeer: LeftPeer | null
	invitee: Invitee | null
	messages: ChatMessage[]
	unread: number
	reactions: Reaction[]
	safetyCode: string | null
	encrypted: boolean
}

const initialState: Omit<RoomState, 'code'> = {
	phase: 'lobby',
	snapshot: null,
	selfId: null,
	creatorId: null,
	peers: {},
	media: {},
	activeSpeakerId: null,
	pinnedId: null,
	layoutPair: 'focus',
	layoutGroup: 'grid',
	panel: null,
	inviteOpen: false,
	connection: 'connected',
	quality: 4,
	audioOnly: false,
	hand: false,
	joinedAt: null,
	talkStartedAt: null,
	leftPeer: null,
	invitee: null,
	messages: [],
	unread: 0,
	reactions: [],
	safetyCode: null,
	encrypted: false,
}

export const useRoomStore = create<RoomState>(() => ({ code: '', ...initialState }))

export function resetRoomStore(code: string, invitee: Invitee | null) {
	useRoomStore.setState({ code, ...initialState, invitee })
}

export function remotePeers(state: Pick<RoomState, 'peers'>) {
	return Object.values(state.peers).sort((a, b) => a.joinedAt - b.joinedAt)
}

export const roomActions = {
	togglePanel(panel: Panel) {
		useRoomStore.setState((state) => ({
			panel: state.panel === panel ? null : panel,
			unread: panel === 'chat' ? 0 : state.unread,
		}))
	},

	closePanel() {
		useRoomStore.setState({ panel: null })
	},

	setInviteOpen(inviteOpen: boolean) {
		useRoomStore.setState({ inviteOpen })
	},

	pin(peerId: string | null) {
		useRoomStore.setState((state) => ({
			pinnedId: state.pinnedId === peerId ? null : peerId,
		}))
	},

	setLayoutPair(layoutPair: RoomState['layoutPair']) {
		useRoomStore.setState({ layoutPair })
	},

	setLayoutGroup(layoutGroup: RoomState['layoutGroup']) {
		useRoomStore.setState({ layoutGroup })
	},
}
