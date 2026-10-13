import { z } from 'zod'
import { roomCodeSchema } from './room.ts'

const opaque = z.looseObject({})

export const mediaSourceSchema = z.enum(['mic', 'camera', 'screen'])

export type MediaSource = z.infer<typeof mediaSourceSchema>

export const peerRoleSchema = z.enum(['creator', 'member'])

export type PeerRole = z.infer<typeof peerRoleSchema>

export const connectionQualitySchema = z.number().int().min(0).max(4)

export const reactionEmojis = ['👍', '❤️', '😂', '😮', '👏', '🎉'] as const

export const sealedSchema = z.object({
	iv: z.string().max(64),
	data: z.string().max(16384),
	index: z.number().int().min(0).max(255),
})

export type Sealed = z.infer<typeof sealedSchema>

export const peerStateSchema = z.object({
	audio: z.boolean(),
	video: z.boolean(),
	screen: z.boolean(),
	hand: z.boolean(),
	quality: connectionQualitySchema,
})

export type PeerState = z.infer<typeof peerStateSchema>

export const peerSchema = peerStateSchema.extend({
	id: z.string(),
	guestId: z.uuid(),
	name: z.string(),
	role: peerRoleSchema,
	publicKey: z.string(),
	handRaisedAt: z.number().nullable(),
	reconnecting: z.boolean(),
	joinedAt: z.number(),
})

export type Peer = z.infer<typeof peerSchema>

export const producerInfoSchema = z.object({
	producerId: z.string(),
	peerId: z.string(),
	kind: z.enum(['audio', 'video']),
	source: mediaSourceSchema,
})

export type ProducerInfo = z.infer<typeof producerInfoSchema>

export const iceServerSchema = z.object({
	urls: z.array(z.string()),
	username: z.string(),
	credential: z.string(),
})

export type IceServer = z.infer<typeof iceServerSchema>

export const clientRequestSchemas = {
	hello: z.object({ token: z.string().min(1) }),
	peek: z.object({ code: roomCodeSchema }),
	join: z.object({
		code: roomCodeSchema,
		peerId: z.string().max(64).optional(),
		rtpCapabilities: opaque,
		publicKey: z.string().max(512),
	}),
	createTransport: z.object({ direction: z.enum(['send', 'recv']) }),
	connectTransport: z.object({ transportId: z.string(), dtlsParameters: opaque }),
	restartIce: z.object({ transportId: z.string() }),
	produce: z.object({
		transportId: z.string(),
		kind: z.enum(['audio', 'video']),
		rtpParameters: opaque,
		source: mediaSourceSchema,
	}),
	closeProducer: z.object({ producerId: z.string() }),
	pauseProducer: z.object({ producerId: z.string() }),
	resumeProducer: z.object({ producerId: z.string() }),
	consume: z.object({ producerId: z.string() }),
	resumeConsumer: z.object({ consumerId: z.string() }),
	pauseConsumer: z.object({ consumerId: z.string() }),
	setConsumerLayer: z.object({
		consumerId: z.string(),
		spatialLayer: z.number().int().min(0).max(2),
	}),
	requestKeyFrame: z.object({ consumerId: z.string() }),
	updateState: peerStateSchema.pick({ hand: true, quality: true }).partial(),
	reaction: z.object({ emoji: z.enum(reactionEmojis) }),
	chat: sealedSchema,
	e2eeKey: z.object({ to: z.string(), sealed: sealedSchema }),
	invite: z.object({ guestId: z.uuid(), code: roomCodeSchema }),
	moderate: z.object({ peerId: z.string(), action: z.enum(['mute', 'remove']) }),
	leave: z.object({}),
} as const

export type ClientRequestType = keyof typeof clientRequestSchemas

export type ClientRequestData<T extends ClientRequestType> = z.infer<
	(typeof clientRequestSchemas)[T]
>

export const clientMessageSchema = z.object({
	id: z.number().int().nonnegative(),
	type: z.enum(
		Object.keys(clientRequestSchemas) as [ClientRequestType, ...ClientRequestType[]],
	),
	data: z.unknown(),
})

export type TransportInfo = {
	id: string
	iceParameters: Record<string, unknown>
	iceCandidates: Record<string, unknown>[]
	dtlsParameters: Record<string, unknown>
	iceServers: IceServer[]
}

export type ConsumerInfo = ProducerInfo & {
	id: string
	rtpParameters: Record<string, unknown>
}

export type RoomSnapshot = {
	code: string
	creatorId: string
	peers: Peer[]
}

export type ServerResponses = {
	hello: { guestId: string; name: string }
	peek: { room: RoomSnapshot; routerRtpCapabilities: Record<string, unknown> }
	join: { peerId: string; peers: Peer[]; producers: ProducerInfo[] }
	createTransport: TransportInfo
	connectTransport: Record<string, never>
	restartIce: { iceParameters: Record<string, unknown> }
	produce: { producerId: string }
	closeProducer: Record<string, never>
	pauseProducer: Record<string, never>
	resumeProducer: Record<string, never>
	consume: ConsumerInfo
	resumeConsumer: Record<string, never>
	pauseConsumer: Record<string, never>
	setConsumerLayer: Record<string, never>
	requestKeyFrame: Record<string, never>
	updateState: Record<string, never>
	reaction: Record<string, never>
	chat: Record<string, never>
	e2eeKey: Record<string, never>
	invite: { delivered: boolean }
	moderate: Record<string, never>
	leave: Record<string, never>
}

export type ServerEvents = {
	roomChanged: { room: RoomSnapshot }
	peerJoined: { peer: Peer }
	peerUpdated: { peer: Peer }
	peerLeft: { peerId: string }
	newProducer: ProducerInfo
	producerClosed: { producerId: string; peerId: string }
	activeSpeaker: { peerId: string | null }
	reaction: { peerId: string; emoji: (typeof reactionEmojis)[number] }
	chat: { peerId: string; sealed: Sealed; at: number }
	e2eeKey: { from: string; sealed: Sealed }
	invited: { code: string; from: { guestId: string; name: string } }
	forceMute: Record<string, never>
	removed: Record<string, never>
}

export type ServerEventType = keyof ServerEvents

export type ServerMessage =
	| { kind: 'response'; id: number; ok: true; data: unknown }
	| { kind: 'response'; id: number; ok: false; error: { code: string; message: string } }
	| {
			[K in ServerEventType]: { kind: 'event'; type: K; data: ServerEvents[K] }
	  }[ServerEventType]

export const signalingErrorCodes = {
	badRequest: 'bad_request',
	unauthorized: 'unauthorized',
	roomNotFound: 'room_not_found',
	roomEnded: 'room_ended',
	roomFull: 'room_full',
	notJoined: 'not_joined',
	forbidden: 'forbidden',
	internal: 'internal',
} as const
