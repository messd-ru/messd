import type {
	MediaSource,
	Peer,
	ProducerInfo,
	Sealed,
	TransportInfo,
	reactionEmojis,
} from '@messd/contracts/signaling'
import { Device, type types } from 'mediasoup-client'
import { toast } from 'sonner'
import { E2ee, e2eeSupported, e2eeTransportSettings } from '#pages/room/lib/e2ee/e2ee.ts'
import { localMedia, useLocalMedia } from '#pages/room/lib/local-media.ts'
import { measureQuality } from '#pages/room/lib/quality.ts'
import { remotePeers, useRoomStore } from '#pages/room/store/room-store.ts'
import { SignalingError, signaling } from '#shared/api/signaling.ts'

type ConsumerData = { peerId: string; source: MediaSource; layer?: number }
type Emoji = (typeof reactionEmojis)[number]

const CAMERA_ENCODINGS: types.RtpEncodingParameters[] = [
	{ scaleResolutionDownBy: 4, maxBitrate: 150_000, scalabilityMode: 'L1T3' },
	{ scaleResolutionDownBy: 2, maxBitrate: 500_000, scalabilityMode: 'L1T3' },
	{ scaleResolutionDownBy: 1, maxBitrate: 1_500_000, scalabilityMode: 'L1T3' },
]
const SCREEN_ENCODINGS: types.RtpEncodingParameters[] = [{ maxBitrate: 2_500_000 }]
const MIC_OPTIONS: types.ProducerCodecOptions = {
	opusDtx: true,
	opusFec: true,
	opusStereo: false,
}
const QUALITY_INTERVAL_MS = 3000
const ICE_RESTART_DELAY_MS = 2000
const REJOIN_RETRY_MS = 2000
const REACTION_TTL_MS = 2800
const FATAL_JOIN_ERRORS = new Set(['room_not_found', 'room_ended', 'forbidden'])

const store = useRoomStore

export class RoomSession {
	private readonly code: string
	private readonly device: Device
	private readonly e2ee: E2ee
	private sendTransport: types.Transport | null = null
	private recvTransport: types.Transport | null = null
	private readonly producers = new Map<MediaSource, types.Producer>()
	private readonly consumers = new Map<string, types.Consumer<ConsumerData>>()
	private readonly pendingKeys = new Map<string, Sealed>()
	private readonly cleanups: (() => void)[] = []
	private peerId: string | null = null
	private queue: Promise<void> = Promise.resolve()
	private qualityTimer: ReturnType<typeof setInterval> | null = null
	private rejoinTimer: ReturnType<typeof setTimeout> | null = null
	private rejoining = false
	private closed = false

	private constructor(code: string, device: Device, e2ee: E2ee) {
		this.code = code
		this.device = device
		this.e2ee = e2ee
	}

	static async join(code: string, routerRtpCapabilities: Record<string, unknown>) {
		const device = await Device.factory()
		await device.load({
			routerRtpCapabilities: routerRtpCapabilities as types.RtpCapabilities,
		})
		const session = new RoomSession(code, device, await E2ee.create())
		session.listen()
		try {
			await session.enter()
		} catch (error) {
			session.dispose()
			throw error
		}
		return session
	}

	async leave() {
		if (this.closed) return
		this.closed = true
		await signaling.request('leave', {}).catch(() => undefined)
		this.dispose()
	}

	invite(guestId: string) {
		return signaling.request('invite', { guestId, code: this.code })
	}

	async sendChat(text: string) {
		const sealed = await this.e2ee.sealText(text)
		await signaling.request('chat', sealed)
		store.setState((state) => ({
			messages: [
				...state.messages,
				{
					id: crypto.randomUUID(),
					peerId: this.peerId ?? '',
					name: 'Вы',
					text,
					at: Date.now(),
					own: true,
				},
			],
		}))
	}

	async sendReaction(emoji: Emoji) {
		this.showReaction('Вы', emoji)
		await signaling.request('reaction', { emoji }).catch(() => undefined)
	}

	async setHand(hand: boolean) {
		store.setState({ hand })
		await signaling.request('updateState', { hand }).catch(() => undefined)
	}

	moderate(peerId: string, action: 'mute' | 'remove') {
		return signaling.request('moderate', { peerId, action })
	}

	async setAudioOnly(audioOnly: boolean) {
		store.setState({ audioOnly })
		if (audioOnly) await localMedia.setCamera(false)
		for (const consumer of this.consumers.values()) {
			if (consumer.appData.source !== 'camera') continue
			if (audioOnly) {
				consumer.pause()
				await signaling
					.request('pauseConsumer', { consumerId: consumer.id })
					.catch(() => undefined)
			} else {
				consumer.resume()
				await signaling
					.request('resumeConsumer', { consumerId: consumer.id })
					.catch(() => undefined)
			}
		}
	}

	private async enter() {
		const response = await signaling.request('join', {
			code: this.code,
			peerId: this.peerId ?? undefined,
			rtpCapabilities: this.device.rtpCapabilities,
			publicKey: this.e2ee.publicKey,
		})
		this.peerId = response.peerId
		const now = Date.now()
		store.setState((state) => ({
			phase: 'call',
			selfId: response.peerId,
			peers: Object.fromEntries(response.peers.map((peer) => [peer.id, peer])),
			media: {},
			connection: 'connected',
			encrypted: e2eeSupported,
			joinedAt: state.joinedAt ?? now,
			talkStartedAt: response.peers.length ? (state.talkStartedAt ?? now) : null,
		}))

		this.closeTransports()
		this.sendTransport = await this.createTransport('send')
		this.recvTransport = await this.createTransport('recv')
		await this.enqueue(() => this.publishAll())
		for (const peer of response.peers) void this.shareKey(peer)
		for (const producer of response.producers) void this.consume(producer)
		void this.updateSafetyCode()
		this.startQualityMonitor()
	}

	private listen() {
		this.cleanups.push(
			signaling.on('peerJoined', ({ peer }) => {
				this.setPeer(peer)
				store.setState((state) => ({
					leftPeer: null,
					invitee: null,
					talkStartedAt: state.talkStartedAt ?? Date.now(),
				}))
				void this.shareKey(peer)
				void this.updateSafetyCode()
			}),
			signaling.on('peerUpdated', ({ peer }) => {
				const previous = store.getState().peers[peer.id]
				this.setPeer(peer)
				if (previous?.publicKey !== peer.publicKey) {
					void this.shareKey(peer)
					void this.updateSafetyCode()
				}
			}),
			signaling.on('peerLeft', ({ peerId }) => this.handlePeerLeft(peerId)),
			signaling.on('newProducer', (info) => void this.consume(info)),
			signaling.on('producerClosed', ({ producerId }) => this.dropProducer(producerId)),
			signaling.on('activeSpeaker', ({ peerId }) => {
				store.setState({ activeSpeakerId: peerId })
				this.updateLayers()
			}),
			signaling.on('reaction', ({ peerId, emoji }) => {
				const peer = store.getState().peers[peerId]
				if (peer) this.showReaction(peer.name, emoji)
			}),
			signaling.on(
				'chat',
				({ peerId, sealed, at }) => void this.receiveChat(peerId, sealed, at),
			),
			signaling.on('e2eeKey', ({ from, sealed }) => void this.receiveKey(from, sealed)),
			signaling.on('forceMute', () => {
				void localMedia.setMic(false)
				toast('Создатель комнаты выключил ваш микрофон')
			}),
			signaling.on('removed', () => {
				this.closed = true
				this.dispose()
				store.setState({ phase: 'removed' })
			}),
			signaling.onStatus((status) => {
				if (status === 'reconnecting') store.setState({ connection: 'reconnecting' })
				if (status === 'open') void this.rejoin()
			}),
			useLocalMedia.subscribe((state, previous) => {
				if (
					state.micTrack !== previous.micTrack ||
					state.micEnabled !== previous.micEnabled
				) {
					void this.enqueue(() => this.syncMic())
				}
				if (
					state.videoTrack !== previous.videoTrack ||
					state.cameraEnabled !== previous.cameraEnabled
				) {
					void this.enqueue(() =>
						this.syncSource('camera', state.cameraEnabled ? state.videoTrack : null),
					)
				}
				if (state.screenTrack !== previous.screenTrack) {
					void this.enqueue(() => this.syncSource('screen', state.screenTrack))
				}
			}),
			store.subscribe((state, previous) => {
				if (
					state.layoutGroup !== previous.layoutGroup ||
					state.pinnedId !== previous.pinnedId ||
					state.panel !== previous.panel ||
					Object.keys(state.peers).length !== Object.keys(previous.peers).length
				) {
					this.updateLayers()
				}
			}),
		)
	}

	private enqueue(task: () => Promise<void>) {
		this.queue = this.queue.then(task).catch(() => undefined)
		return this.queue
	}

	private async createTransport(direction: 'send' | 'recv') {
		const info: TransportInfo = await signaling.request('createTransport', { direction })
		const options = {
			...info,
			additionalSettings: e2eeTransportSettings,
		} as unknown as types.TransportOptions
		const transport =
			direction === 'send'
				? this.device.createSendTransport(options)
				: this.device.createRecvTransport(options)

		transport.on('connect', ({ dtlsParameters }, callback, errback) => {
			signaling
				.request('connectTransport', { transportId: transport.id, dtlsParameters })
				.then(() => callback())
				.catch(errback)
		})

		if (direction === 'send') {
			transport.on('produce', ({ kind, rtpParameters, appData }, callback, errback) => {
				signaling
					.request('produce', {
						transportId: transport.id,
						kind,
						rtpParameters,
						source: appData.source as MediaSource,
					})
					.then(({ producerId }) => callback({ id: producerId }))
					.catch(errback)
			})
		}

		transport.on('connectionstatechange', (state) => {
			if (state === 'connected') {
				if (signaling.status === 'open') store.setState({ connection: 'connected' })
				return
			}
			if (state === 'disconnected') {
				store.setState({ connection: 'reconnecting' })
				setTimeout(() => {
					if (transport.connectionState === 'disconnected')
						void this.restartIce(transport)
				}, ICE_RESTART_DELAY_MS)
			}
			if (state === 'failed') {
				store.setState({ connection: 'reconnecting' })
				void this.restartIce(transport)
			}
		})

		return transport
	}

	private async restartIce(transport: types.Transport) {
		if (transport.closed || this.closed) return
		try {
			const { iceParameters } = await signaling.request('restartIce', {
				transportId: transport.id,
			})
			await transport.restartIce({ iceParameters: iceParameters as types.IceParameters })
		} catch {
			return
		}
	}

	private async rejoin() {
		if (this.rejoining || this.closed || !this.peerId) return
		this.rejoining = true
		if (this.rejoinTimer) clearTimeout(this.rejoinTimer)
		try {
			for (const consumer of this.consumers.values()) consumer.close()
			this.consumers.clear()
			this.producers.clear()
			await this.enter()
		} catch (error) {
			if (error instanceof SignalingError && FATAL_JOIN_ERRORS.has(error.code)) {
				this.closed = true
				this.dispose()
				store.setState({ phase: error.code === 'forbidden' ? 'removed' : 'ended' })
				return
			}
			this.rejoinTimer = setTimeout(() => void this.rejoin(), REJOIN_RETRY_MS)
		} finally {
			this.rejoining = false
		}
	}

	private async publishAll() {
		const { micTrack, micEnabled, videoTrack, cameraEnabled, screenTrack } =
			useLocalMedia.getState()
		if (micTrack && micEnabled) await this.publish('mic', micTrack)
		if (videoTrack && cameraEnabled) await this.publish('camera', videoTrack)
		if (screenTrack) await this.publish('screen', screenTrack)
	}

	private async publish(source: MediaSource, track: MediaStreamTrack) {
		const transport = this.sendTransport
		if (!transport || transport.closed) return
		const producer = await transport.produce({
			track,
			stopTracks: false,
			zeroRtpOnPause: source === 'mic',
			encodings:
				source === 'camera'
					? CAMERA_ENCODINGS
					: source === 'screen'
						? SCREEN_ENCODINGS
						: undefined,
			codecOptions: source === 'mic' ? MIC_OPTIONS : { videoGoogleStartBitrate: 1000 },
			appData: { source },
			onRtpSender: (sender) => this.e2ee.attachSender(sender),
		})
		this.producers.set(source, producer)
		if (source === 'camera' && store.getState().quality <= 2)
			producer.setMaxSpatialLayer(1)
	}

	private async syncMic() {
		const { micTrack, micEnabled } = useLocalMedia.getState()
		const producer = this.producers.get('mic')
		if (!micTrack || !micEnabled) {
			if (producer && !producer.paused) {
				producer.pause()
				await signaling.request('pauseProducer', { producerId: producer.id })
			}
			return
		}
		if (!producer) {
			await this.publish('mic', micTrack)
			return
		}
		if (producer.track !== micTrack) await producer.replaceTrack({ track: micTrack })
		if (producer.paused) {
			producer.resume()
			await signaling.request('resumeProducer', { producerId: producer.id })
		}
	}

	private async syncSource(source: 'camera' | 'screen', track: MediaStreamTrack | null) {
		const producer = this.producers.get(source)
		if (!track) {
			if (!producer) return
			producer.close()
			this.producers.delete(source)
			await signaling.request('closeProducer', { producerId: producer.id })
			return
		}
		if (producer) {
			if (producer.track !== track) await producer.replaceTrack({ track })
			return
		}
		await this.publish(source, track)
	}

	private async consume(info: ProducerInfo) {
		const transport = this.recvTransport
		if (!transport || transport.closed) return
		if ([...this.consumers.values()].some((item) => item.producerId === info.producerId))
			return
		try {
			const data = await signaling.request('consume', { producerId: info.producerId })
			const consumer = await transport.consume<ConsumerData>({
				id: data.id,
				producerId: data.producerId,
				kind: data.kind,
				rtpParameters: data.rtpParameters as types.RtpParameters,
				appData: { peerId: data.peerId, source: data.source },
				onRtpReceiver: (receiver) => this.e2ee.attachReceiver(receiver, data.peerId),
			})
			this.consumers.set(consumer.id, consumer)
			this.setMedia(data.peerId, data.source, consumer.track)
			const pause = data.source === 'camera' && store.getState().audioOnly
			if (pause) consumer.pause()
			else await signaling.request('resumeConsumer', { consumerId: consumer.id })
			this.updateLayers()
		} catch {
			return
		}
	}

	private dropProducer(producerId: string) {
		for (const consumer of this.consumers.values()) {
			if (consumer.producerId !== producerId) continue
			consumer.close()
			this.consumers.delete(consumer.id)
			this.setMedia(
				consumer.appData.peerId,
				consumer.appData.source,
				null,
				consumer.track,
			)
		}
	}

	private setPeer(peer: Peer) {
		store.setState((state) => ({ peers: { ...state.peers, [peer.id]: peer } }))
		const pending = this.pendingKeys.get(peer.id)
		if (pending) {
			this.pendingKeys.delete(peer.id)
			void this.receiveKey(peer.id, pending)
		}
	}

	private setMedia(
		peerId: string,
		source: MediaSource,
		track: MediaStreamTrack | null,
		expected?: MediaStreamTrack,
	) {
		const key = source === 'mic' ? 'audio' : source
		store.setState((state) => {
			const current = state.media[peerId] ?? {}
			if (expected && current[key] !== expected) return state
			return {
				media: { ...state.media, [peerId]: { ...current, [key]: track ?? undefined } },
			}
		})
	}

	private handlePeerLeft(peerId: string) {
		const state = store.getState()
		const peer = state.peers[peerId]
		for (const consumer of this.consumers.values()) {
			if (consumer.appData.peerId !== peerId) continue
			consumer.close()
			this.consumers.delete(consumer.id)
		}
		const { [peerId]: removedPeer, ...peers } = state.peers
		const { [peerId]: removedMedia, ...media } = state.media
		const alone = Object.keys(peers).length === 0
		const wasPair = Object.keys(state.peers).length === 1
		const now = Date.now()
		store.setState({
			peers,
			media,
			pinnedId: state.pinnedId === peerId ? null : state.pinnedId,
			activeSpeakerId: state.activeSpeakerId === peerId ? null : state.activeSpeakerId,
			talkStartedAt: alone ? null : state.talkStartedAt,
			leftPeer:
				peer && alone && wasPair
					? { peer, duration: now - (state.talkStartedAt ?? now), leftAt: now }
					: state.leftPeer,
		})
		this.e2ee.removePeer(peerId)
		this.pendingKeys.delete(peerId)
		void this.rotateKey()
		void this.updateSafetyCode()
	}

	private async shareKey(peer: Peer) {
		try {
			const sealed = await this.e2ee.keyFor(peer.id, peer.publicKey)
			await signaling.request('e2eeKey', { to: peer.id, sealed })
		} catch {
			return
		}
	}

	private async receiveKey(peerId: string, sealed: Sealed) {
		const peer = store.getState().peers[peerId]
		if (!peer) {
			this.pendingKeys.set(peerId, sealed)
			return
		}
		try {
			await this.e2ee.receiveKey(peerId, peer.publicKey, sealed)
		} catch {
			return
		}
		for (const consumer of this.consumers.values()) {
			if (consumer.appData.peerId === peerId && consumer.kind === 'video') {
				void signaling
					.request('requestKeyFrame', { consumerId: consumer.id })
					.catch(() => undefined)
			}
		}
	}

	private async rotateKey() {
		await this.e2ee.rotate()
		for (const peer of Object.values(store.getState().peers)) void this.shareKey(peer)
	}

	private async updateSafetyCode() {
		const keys = [
			this.e2ee.publicKey,
			...Object.values(store.getState().peers).map((peer) => peer.publicKey),
		]
		store.setState({
			safetyCode: keys.length > 1 ? await this.e2ee.safetyCode(keys) : null,
		})
	}

	private async receiveChat(peerId: string, sealed: Sealed, at: number) {
		const peer = store.getState().peers[peerId]
		const text = await this.e2ee.openText(peerId, sealed)
		if (!peer || text === null) return
		store.setState((state) => ({
			messages: [
				...state.messages,
				{ id: crypto.randomUUID(), peerId, name: peer.name, text, at, own: false },
			],
			unread: state.panel === 'chat' ? 0 : state.unread + 1,
		}))
	}

	private showReaction(name: string, emoji: string) {
		const id = crypto.randomUUID()
		store.setState((state) => ({ reactions: [...state.reactions, { id, name, emoji }] }))
		setTimeout(() => {
			store.setState((state) => ({
				reactions: state.reactions.filter((item) => item.id !== id),
			}))
		}, REACTION_TTL_MS)
	}

	private updateLayers() {
		const state = store.getState()
		const count = remotePeers(state).length
		const compact = window.innerWidth < 1024
		for (const consumer of this.consumers.values()) {
			if (consumer.kind !== 'video' || consumer.appData.source !== 'camera') continue
			const { peerId } = consumer.appData
			const focused =
				state.pinnedId === peerId ||
				(state.layoutGroup === 'speaker' && state.activeSpeakerId === peerId)
			let layer =
				count <= 1 || focused
					? 2
					: state.layoutGroup === 'speaker'
						? 0
						: count <= 3
							? 2
							: count <= 5
								? 1
								: 0
			if (compact) layer = Math.min(layer, 1)
			if (consumer.appData.layer === layer) continue
			consumer.appData.layer = layer
			void signaling
				.request('setConsumerLayer', { consumerId: consumer.id, spatialLayer: layer })
				.catch(() => undefined)
		}
	}

	private startQualityMonitor() {
		if (this.qualityTimer) clearInterval(this.qualityTimer)
		this.qualityTimer = setInterval(() => void this.checkQuality(), QUALITY_INTERVAL_MS)
	}

	private async checkQuality() {
		const transport = this.producers.size ? this.sendTransport : this.recvTransport
		if (!transport || transport.closed || transport.connectionState !== 'connected')
			return
		const quality = measureQuality(await transport.getStats())
		if (quality === store.getState().quality) return
		store.setState({ quality })
		this.producers.get('camera')?.setMaxSpatialLayer(quality <= 2 ? 1 : 2)
		await signaling.request('updateState', { quality }).catch(() => undefined)
	}

	private closeTransports() {
		this.sendTransport?.close()
		this.recvTransport?.close()
		this.sendTransport = null
		this.recvTransport = null
	}

	private dispose() {
		for (const cleanup of this.cleanups.splice(0)) cleanup()
		if (this.qualityTimer) clearInterval(this.qualityTimer)
		if (this.rejoinTimer) clearTimeout(this.rejoinTimer)
		for (const consumer of this.consumers.values()) consumer.close()
		this.consumers.clear()
		this.producers.clear()
		this.closeTransports()
		this.e2ee.destroy()
	}
}
