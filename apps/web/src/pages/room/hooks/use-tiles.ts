import { useLocalMedia } from '#pages/room/lib/local-media.ts'
import { remotePeers, useRoomStore } from '#pages/room/store/room-store.ts'
import { initials } from '#shared/lib/format.ts'
import { useSession } from '#shared/store/session.ts'

export type Tile = {
	id: string
	peerId: string | null
	self: boolean
	source: 'camera' | 'screen'
	name: string
	fullName: string
	initials: string
	track: MediaStreamTrack | null
	muted: boolean
	speaking: boolean
	hand: boolean
	quality: number
	reconnecting: boolean
	mirror: boolean
}

export function useTiles() {
	const guest = useSession((state) => state.guest)
	const peers = useRoomStore((state) => state.peers)
	const media = useRoomStore((state) => state.media)
	const selfId = useRoomStore((state) => state.selfId)
	const activeSpeakerId = useRoomStore((state) => state.activeSpeakerId)
	const hand = useRoomStore((state) => state.hand)
	const quality = useRoomStore((state) => state.quality)
	const videoTrack = useLocalMedia((state) => state.videoTrack)
	const cameraEnabled = useLocalMedia((state) => state.cameraEnabled)
	const micEnabled = useLocalMedia((state) => state.micEnabled)
	const micTrack = useLocalMedia((state) => state.micTrack)
	const screenTrack = useLocalMedia((state) => state.screenTrack)
	const facing = useLocalMedia((state) => state.facing)
	const selfName = guest?.name ?? 'Вы'

	const self: Tile = {
		id: 'self',
		peerId: selfId,
		self: true,
		source: 'camera',
		name: 'Вы',
		fullName: selfName,
		initials: initials(selfName),
		track: cameraEnabled ? videoTrack : null,
		muted: !micEnabled || !micTrack,
		speaking: Boolean(selfId) && activeSpeakerId === selfId,
		hand,
		quality,
		reconnecting: false,
		mirror: facing === 'user',
	}

	const remote = remotePeers({ peers }).map<Tile>((peer) => ({
		id: peer.id,
		peerId: peer.id,
		self: false,
		source: 'camera',
		name: peer.name,
		fullName: peer.name,
		initials: initials(peer.name),
		track: peer.video ? (media[peer.id]?.camera ?? null) : null,
		muted: !peer.audio,
		speaking: activeSpeakerId === peer.id,
		hand: peer.hand,
		quality: peer.quality,
		reconnecting: peer.reconnecting,
		mirror: false,
	}))

	const screens: Tile[] = [
		...remote.flatMap((tile) => {
			const track = tile.peerId ? media[tile.peerId]?.screen : undefined
			return track
				? [
						{
							...tile,
							id: `${tile.id}:screen`,
							source: 'screen' as const,
							track,
							name: `Экран: ${tile.name}`,
							speaking: false,
						},
					]
				: []
		}),
		...(screenTrack
			? [
					{
						...self,
						id: 'self:screen',
						source: 'screen' as const,
						track: screenTrack,
						name: 'Ваш экран',
						mirror: false,
						speaking: false,
					},
				]
			: []),
	]

	return { self, remote, screens }
}
