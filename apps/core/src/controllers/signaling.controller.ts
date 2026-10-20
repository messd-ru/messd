import {
	type ClientRequestData,
	type ClientRequestType,
	type MediaSource,
	type ServerResponses,
	clientMessageSchema,
	clientRequestSchemas,
	signalingErrorCodes,
} from '@messd/contracts/signaling'
import type { FastifyBaseLogger, FastifyRequest } from 'fastify'
import type { types } from 'mediasoup'
import { randomUUID } from 'node:crypto'
import type { WebSocket } from 'ws'
import { z } from 'zod'
import type { Config } from '#config.ts'
import { Session } from '#lib/session.ts'
import { SignalingError, errors } from '#lib/signaling-error.ts'
import { createIceServers } from '#lib/turn.ts'
import type { ContactModel } from '#models/contact.model.ts'
import type { GuestModel } from '#models/guest.model.ts'
import { Peer, type ProducerAppData } from '#models/peer.model.ts'
import type { RoomRegistry } from '#models/room-registry.model.ts'
import type { Room } from '#models/room.model.ts'
import { peerView, producerView } from '#views/peer.view.ts'
import { roomSnapshotView } from '#views/room.view.ts'

type Handler<T extends ClientRequestType> = (
	session: Session,
	data: ClientRequestData<T>,
) => Promise<ServerResponses[T]> | ServerResponses[T]

type SignalingDeps = {
	config: Config
	logger: FastifyBaseLogger
	registry: RoomRegistry
	guests: GuestModel
	contacts: ContactModel
}

const HEARTBEAT_MS = 15_000
const MAX_TRANSPORTS = 4

const sourceStateKey = {
	mic: 'audio',
	camera: 'video',
	screen: 'screen',
} as const satisfies Record<MediaSource, string>

export function createSignalingController({
	config,
	logger,
	registry,
	guests,
	contacts,
}: SignalingDeps) {
	const sessions = new Set<Session>()
	const presence = new Map<string, Set<Session>>()

	const heartbeat = setInterval(() => {
		for (const session of sessions) {
			if (!session.alive) {
				session.socket.terminate()
				continue
			}
			session.alive = false
			session.socket.ping()
		}
	}, HEARTBEAT_MS)

	function requireGuest(session: Session) {
		if (!session.guest) throw errors.unauthorized()
		return session.guest
	}

	function requirePeer(session: Session) {
		const { peer, room } = session
		if (!peer || !room) throw errors.notJoined()
		return { peer, room }
	}

	function requireTransport(peer: Peer, transportId: string) {
		const transport = peer.transports.get(transportId)
		if (!transport) throw errors.badRequest('Транспорт не найден')
		return transport
	}

	function requireProducer(peer: Peer, producerId: string) {
		const producer = peer.producers.get(producerId)
		if (!producer) throw errors.badRequest('Поток не найден')
		return producer
	}

	function requireConsumer(peer: Peer, consumerId: string) {
		const consumer = peer.consumers.get(consumerId)
		if (!consumer) throw errors.badRequest('Поток не найден')
		return consumer
	}

	function addPresence(session: Session, guestId: string) {
		const set = presence.get(guestId) ?? new Set()
		set.add(session)
		presence.set(guestId, set)
	}

	function removePresence(session: Session) {
		if (!session.guest) return
		const set = presence.get(session.guest.id)
		set?.delete(session)
		if (!set?.size) presence.delete(session.guest.id)
	}

	function unwatch(session: Session) {
		const room = session.watching
		if (!room) return
		room.watchers.delete(session)
		session.watching = null
		registry.reconcile(room)
	}

	function announce(room: Room, peer: Peer) {
		room.broadcast('peerUpdated', { peer: peerView(peer) }, peer)
		room.notifyWatchers()
	}

	function setSourceState(room: Room, peer: Peer, source: MediaSource, enabled: boolean) {
		peer.updateState({ [sourceStateKey[source]]: enabled })
		announce(room, peer)
	}

	function closeProducer(
		room: Room,
		peer: Peer,
		producer: types.Producer<ProducerAppData>,
	) {
		producer.close()
		peer.producers.delete(producer.id)
		room.broadcast('producerClosed', { producerId: producer.id, peerId: peer.id }, peer)
	}

	function closePeerMedia(room: Room, peer: Peer) {
		for (const producer of peer.producers.values()) {
			room.broadcast('producerClosed', { producerId: producer.id, peerId: peer.id }, peer)
		}
		peer.closeMedia()
	}

	function detach(session: Session) {
		session.peer = null
		session.room = null
	}

	function removePeer(room: Room, peer: Peer) {
		peer.clearGraceTimer()
		if (room.peers.get(peer.id) !== peer) return
		room.peers.delete(peer.id)
		peer.closeMedia()
		if (peer.session) detach(peer.session)
		room.broadcast('peerLeft', { peerId: peer.id })
		room.notifyWatchers()
		registry.reconcile(room)
	}

	const handlers: { [K in ClientRequestType]: Handler<K> } = {
		async hello(session, { token }) {
			const guest = await guests.findByToken(token)
			if (!guest) throw errors.unauthorized()
			removePresence(session)
			session.guest = guest
			addPresence(session, guest.id)
			return { guestId: guest.id, name: guest.name }
		},

		async peek(session, { code }) {
			requireGuest(session)
			const room = await registry.open(code)
			unwatch(session)
			room.watchers.add(session)
			session.watching = room
			registry.reconcile(room)
			return {
				room: roomSnapshotView(room),
				routerRtpCapabilities: room.router.rtpCapabilities,
			}
		},

		async join(session, data) {
			const guest = requireGuest(session)

			if (session.peer && session.room) removePeer(session.room, session.peer)
			const room = await registry.open(data.code)
			if (room.banned.has(guest.id)) throw errors.forbidden()

			const requested = data.peerId ? room.peers.get(data.peerId) : undefined
			const existing = requested?.guestId === guest.id ? requested : room.findPeerByGuest(guest.id)
			const rejoining = Boolean(existing)

			let peer: Peer

			if (existing) {
				peer = existing
				closePeerMedia(room, peer)
				if (peer.session && peer.session !== session) detach(peer.session)
			} else {
				if (room.peers.size >= config.MAX_PEERS) throw errors.roomFull()
				peer = new Peer({
					id: randomUUID(),
					guestId: guest.id,
					name: (await guests.findName(guest.id)) ?? guest.name,
					role: guest.id === room.creatorId ? 'creator' : 'member',
				})
				room.peers.set(peer.id, peer)
			}

			peer.clearGraceTimer()
			peer.reconnecting = false
			peer.session = session
			peer.rtpCapabilities = data.rtpCapabilities as types.RtpCapabilities
			peer.publicKey = data.publicKey
			peer.updateState({ audio: false, video: false, screen: false })
			session.peer = peer
			session.room = room
			unwatch(session)
			registry.reconcile(room)

			const others = [...room.peers.values()].filter((item) => item !== peer)
			await registry.markStarted(room)
			await contacts.recordCall(
				guest.id,
				others.map((item) => item.guestId),
			)

			room.broadcast(
				rejoining ? 'peerUpdated' : 'peerJoined',
				{ peer: peerView(peer) },
				peer,
			)
			room.notifyWatchers()

			return {
				peerId: peer.id,
				peers: others.map(peerView),
				producers: room.producers(peer).map(producerView),
			}
		},

		async createTransport(session, { direction }) {
			const { room, peer } = requirePeer(session)
			if (peer.transports.size >= MAX_TRANSPORTS) {
				throw errors.badRequest('Слишком много транспортов')
			}
			const transport = await room.router.createWebRtcTransport({
				webRtcServer: room.webRtcServer,
				enableUdp: true,
				enableTcp: true,
				preferUdp: true,
				initialAvailableOutgoingBitrate: 1_000_000,
				appData: { direction },
			})
			if (direction === 'send') await transport.setMaxIncomingBitrate(4_000_000)
			peer.transports.set(transport.id, transport)
			transport.observer.once('close', () => peer.transports.delete(transport.id))
			return {
				id: transport.id,
				iceParameters: transport.iceParameters,
				iceCandidates: transport.iceCandidates,
				dtlsParameters: transport.dtlsParameters,
				iceServers: createIceServers(config, peer.guestId),
			}
		},

		async connectTransport(session, { transportId, dtlsParameters }) {
			const { peer } = requirePeer(session)
			await requireTransport(peer, transportId).connect({
				dtlsParameters: dtlsParameters as types.DtlsParameters,
			})
			return {}
		},

		async restartIce(session, { transportId }) {
			const { peer } = requirePeer(session)
			return { iceParameters: await requireTransport(peer, transportId).restartIce() }
		},

		async produce(session, { transportId, kind, rtpParameters, source }) {
			const { room, peer } = requirePeer(session)
			const transport = requireTransport(peer, transportId)
			if (
				transport.appData.direction !== 'send' ||
				(source === 'mic') !== (kind === 'audio')
			) {
				throw errors.badRequest('Неверные параметры потока')
			}
			const previous = peer.producerBySource(source)
			if (previous) closeProducer(room, peer, previous)

			const producer = await transport.produce<ProducerAppData>({
				kind,
				rtpParameters: rtpParameters as types.RtpParameters,
				appData: { peerId: peer.id, source },
			})
			peer.producers.set(producer.id, producer)
			producer.observer.once('close', () => peer.producers.delete(producer.id))
			if (source === 'mic')
				await room.audioObserver.addProducer({ producerId: producer.id })

			setSourceState(room, peer, source, true)
			room.broadcast('newProducer', producerView(producer), peer)
			return { producerId: producer.id }
		},

		closeProducer(session, { producerId }) {
			const { room, peer } = requirePeer(session)
			const producer = requireProducer(peer, producerId)
			closeProducer(room, peer, producer)
			setSourceState(room, peer, producer.appData.source, false)
			return {}
		},

		async pauseProducer(session, { producerId }) {
			const { room, peer } = requirePeer(session)
			const producer = requireProducer(peer, producerId)
			await producer.pause()
			setSourceState(room, peer, producer.appData.source, false)
			return {}
		},

		async resumeProducer(session, { producerId }) {
			const { room, peer } = requirePeer(session)
			const producer = requireProducer(peer, producerId)
			await producer.resume()
			setSourceState(room, peer, producer.appData.source, true)
			return {}
		},

		async consume(session, { producerId }) {
			const { room, peer } = requirePeer(session)
			const producer = room.findProducer(producerId)
			const transport = peer.recvTransport()
			if (!producer || producer.appData.peerId === peer.id || !transport) {
				throw errors.badRequest('Поток недоступен')
			}
			const rtpCapabilities = peer.rtpCapabilities
			if (!rtpCapabilities || !room.router.canConsume({ producerId, rtpCapabilities })) {
				throw errors.badRequest('Браузер не поддерживает этот поток')
			}
			const consumer = await transport.consume<ProducerAppData>({
				producerId,
				rtpCapabilities,
				paused: true,
				appData: { ...producer.appData },
			})
			peer.consumers.set(consumer.id, consumer)
			consumer.observer.once('close', () => peer.consumers.delete(consumer.id))
			return {
				id: consumer.id,
				producerId,
				peerId: producer.appData.peerId,
				kind: consumer.kind,
				source: producer.appData.source,
				rtpParameters: consumer.rtpParameters,
			}
		},

		async resumeConsumer(session, { consumerId }) {
			const { peer } = requirePeer(session)
			await requireConsumer(peer, consumerId).resume()
			return {}
		},

		async pauseConsumer(session, { consumerId }) {
			const { peer } = requirePeer(session)
			await requireConsumer(peer, consumerId).pause()
			return {}
		},

		async setConsumerLayer(session, { consumerId, spatialLayer }) {
			const { peer } = requirePeer(session)
			await requireConsumer(peer, consumerId).setPreferredLayers({ spatialLayer })
			return {}
		},

		async requestKeyFrame(session, { consumerId }) {
			const { peer } = requirePeer(session)
			await requireConsumer(peer, consumerId).requestKeyFrame()
			return {}
		},

		updateState(session, patch) {
			const { room, peer } = requirePeer(session)
			peer.updateState(patch)
			announce(room, peer)
			return {}
		},

		reaction(session, { emoji }) {
			const { room, peer } = requirePeer(session)
			room.broadcast('reaction', { peerId: peer.id, emoji }, peer)
			return {}
		},

		chat(session, sealed) {
			const { room, peer } = requirePeer(session)
			room.broadcast('chat', { peerId: peer.id, sealed, at: Date.now() }, peer)
			return {}
		},

		e2eeKey(session, { to, sealed }) {
			const { room, peer } = requirePeer(session)
			room.peers.get(to)?.session?.emit('e2eeKey', { from: peer.id, sealed })
			return {}
		},

		invite(session, { guestId, code }) {
			const { room, peer } = requirePeer(session)
			if (room.code !== code) throw errors.forbidden()
			const targets = presence.get(guestId)
			for (const target of targets ?? []) {
				target.emit('invited', { code, from: { guestId: peer.guestId, name: peer.name } })
			}
			return { delivered: Boolean(targets?.size) }
		},

		async moderate(session, { peerId, action }) {
			const { room, peer } = requirePeer(session)
			if (peer.role !== 'creator') throw errors.forbidden()
			const target = room.peers.get(peerId)
			if (!target || target === peer) throw errors.badRequest('Участник не найден')
			if (action === 'mute') {
				const mic = target.producerBySource('mic')
				if (mic && !mic.paused) {
					await mic.pause()
					setSourceState(room, target, 'mic', false)
				}
				target.session?.emit('forceMute', {})
				return {}
			}
			room.banned.add(target.guestId)
			target.session?.emit('removed', {})
			removePeer(room, target)
			return {}
		},

		leave(session) {
			if (session.peer && session.room) removePeer(session.room, session.peer)
			return {}
		},
	}

	async function handleMessage(session: Session, raw: string) {
		let id = 0
		try {
			const envelope = clientMessageSchema.safeParse(JSON.parse(raw))
			if (!envelope.success) throw errors.badRequest('Неверный формат сообщения')
			id = envelope.data.id
			const { type } = envelope.data
			const parsed = clientRequestSchemas[type].safeParse(envelope.data.data)
			if (!parsed.success) throw errors.badRequest(z.prettifyError(parsed.error))
			const handler = handlers[type] as Handler<typeof type>
			const data = await handler(session, parsed.data as ClientRequestData<typeof type>)
			session.send({ kind: 'response', id, ok: true, data })
		} catch (error) {
			if (error instanceof SignalingError) {
				session.send({
					kind: 'response',
					id,
					ok: false,
					error: { code: error.code, message: error.message },
				})
				return
			}
			logger.error({ err: error }, 'signaling request failed')
			session.send({
				kind: 'response',
				id,
				ok: false,
				error: { code: signalingErrorCodes.internal, message: 'Внутренняя ошибка' },
			})
		}
	}

	function handleClose(session: Session) {
		sessions.delete(session)
		removePresence(session)
		unwatch(session)
		const { peer, room } = session
		if (!peer || !room || peer.session !== session) return
		peer.session = null
		peer.reconnecting = true
		announce(room, peer)
		peer.graceTimer = setTimeout(
			() => removePeer(room, peer),
			config.PEER_RECONNECT_GRACE_MS,
		)
	}

	return {
		connect(socket: WebSocket, request: FastifyRequest) {
			const origin = request.headers.origin ?? ''
			if (config.APP_ORIGINS.length && !config.APP_ORIGINS.includes(origin)) {
				socket.close(1008, 'Origin not allowed')
				return
			}
			const session = new Session(socket)
			sessions.add(session)
			socket.on('pong', () => {
				session.alive = true
			})
			socket.on('message', (raw) => {
				void handleMessage(session, raw.toString())
			})
			socket.on('close', () => handleClose(session))
		},

		close() {
			clearInterval(heartbeat)
			for (const session of sessions) session.socket.close(1001, 'Server shutdown')
		},
	}
}
