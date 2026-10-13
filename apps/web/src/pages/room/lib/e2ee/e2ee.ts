import type { Sealed } from '@messd/contracts/signaling'
import { fromBase64, toBase64 } from '#pages/room/lib/e2ee/encoding.ts'
import {
	LOCAL_PEER,
	type TransformOptions,
	type WorkerRequest,
} from '#pages/room/lib/e2ee/protocol.ts'

type EncodedStreams = { readable: ReadableStream; writable: WritableStream }
type Transformable = (RTCRtpSender | RTCRtpReceiver) & {
	createEncodedStreams?: () => EncodedStreams
}

const ECDH = { name: 'ECDH', namedCurve: 'P-256' } as const
const KEY_SWITCH_DELAY_MS = 1500
const IV_LENGTH = 12

const scriptTransformSupported = typeof RTCRtpScriptTransform !== 'undefined'
const insertableStreamsSupported =
	typeof RTCRtpSender !== 'undefined' && 'createEncodedStreams' in RTCRtpSender.prototype

export const e2eeSupported = scriptTransformSupported || insertableStreamsSupported

export const e2eeTransportSettings =
	!scriptTransformSupported && insertableStreamsSupported
		? ({ encodedInsertableStreams: true } as Partial<RTCConfiguration>)
		: undefined

async function seal(
	key: CryptoKey,
	payload: BufferSource,
	index: number,
): Promise<Sealed> {
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
	const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payload)
	return { iv: toBase64(iv), data: toBase64(data), index }
}

async function unseal(key: CryptoKey, sealed: Sealed) {
	return crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: fromBase64(sealed.iv) },
		key,
		fromBase64(sealed.data),
	)
}

export class E2ee {
	publicKey = ''
	private readonly worker: Worker
	private keyPair: CryptoKeyPair | null = null
	private senderKey: CryptoKey | null = null
	private index = 0
	private switchTimer: ReturnType<typeof setTimeout> | null = null
	private readonly shared = new Map<string, { publicKey: string; key: CryptoKey }>()
	private readonly remoteKeys = new Map<string, Map<number, CryptoKey>>()

	private constructor() {
		this.worker = new Worker(new URL('./e2ee.worker.ts', import.meta.url), {
			type: 'module',
		})
	}

	static async create() {
		const e2ee = new E2ee()
		e2ee.keyPair = await crypto.subtle.generateKey(ECDH, false, ['deriveKey'])
		e2ee.publicKey = toBase64(
			await crypto.subtle.exportKey('raw', e2ee.keyPair.publicKey),
		)
		await e2ee.installSenderKey(0)
		e2ee.post({ type: 'useKey', index: 0 })
		return e2ee
	}

	attachSender(sender: RTCRtpSender) {
		this.attach(sender, { operation: 'encrypt', peerId: LOCAL_PEER })
	}

	attachReceiver(receiver: RTCRtpReceiver, peerId: string) {
		this.attach(receiver, { operation: 'decrypt', peerId })
	}

	async keyFor(peerId: string, publicKey: string) {
		const shared = await this.sharedKey(peerId, publicKey)
		const raw = await crypto.subtle.exportKey('raw', this.requireSenderKey())
		return seal(shared, raw, this.index)
	}

	async receiveKey(peerId: string, publicKey: string, sealed: Sealed) {
		const shared = await this.sharedKey(peerId, publicKey)
		const raw = await unseal(shared, sealed)
		const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt'])
		const keys = this.remoteKeys.get(peerId) ?? new Map<number, CryptoKey>()
		keys.set(sealed.index, key)
		this.remoteKeys.set(peerId, keys)
		this.post({ type: 'setKey', peerId, index: sealed.index, key })
	}

	async rotate() {
		const next = (this.index + 1) % 256
		await this.installSenderKey(next)
		if (this.switchTimer) clearTimeout(this.switchTimer)
		this.switchTimer = setTimeout(
			() => this.post({ type: 'useKey', index: next }),
			KEY_SWITCH_DELAY_MS,
		)
	}

	removePeer(peerId: string) {
		this.shared.delete(peerId)
		this.remoteKeys.delete(peerId)
		this.post({ type: 'removePeer', peerId })
	}

	sealText(text: string) {
		return seal(this.requireSenderKey(), new TextEncoder().encode(text), this.index)
	}

	async openText(peerId: string, sealed: Sealed) {
		const key = this.remoteKeys.get(peerId)?.get(sealed.index)
		if (!key) return null
		try {
			return new TextDecoder().decode(await unseal(key, sealed))
		} catch {
			return null
		}
	}

	async safetyCode(publicKeys: string[]) {
		const material = new TextEncoder().encode([...publicKeys].sort().join('|'))
		const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', material))
		return Array.from({ length: 4 }, (_, group) => {
			const value = ((digest[group * 2] ?? 0) << 8) | (digest[group * 2 + 1] ?? 0)
			return String(value % 10_000).padStart(4, '0')
		}).join(' ')
	}

	destroy() {
		if (this.switchTimer) clearTimeout(this.switchTimer)
		this.worker.terminate()
	}

	private attach(target: Transformable, options: TransformOptions) {
		if (scriptTransformSupported) {
			target.transform = new RTCRtpScriptTransform(this.worker, options)
			return
		}
		const streams = target.createEncodedStreams?.()
		if (!streams) return
		this.worker.postMessage(
			{ type: 'transform', ...options, ...streams } satisfies WorkerRequest,
			[streams.readable, streams.writable],
		)
	}

	private async installSenderKey(index: number) {
		const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, true, [
			'encrypt',
			'decrypt',
		])
		this.senderKey = key
		this.index = index
		this.post({ type: 'setKey', peerId: LOCAL_PEER, index, key })
	}

	private async sharedKey(peerId: string, publicKey: string) {
		const known = this.shared.get(peerId)
		if (known?.publicKey === publicKey) return known.key
		if (!this.keyPair) throw new Error('E2EE is not initialized')
		const remote = await crypto.subtle.importKey(
			'raw',
			fromBase64(publicKey),
			ECDH,
			false,
			[],
		)
		const key = await crypto.subtle.deriveKey(
			{ name: 'ECDH', public: remote },
			this.keyPair.privateKey,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt', 'decrypt'],
		)
		this.shared.set(peerId, { publicKey, key })
		return key
	}

	private requireSenderKey() {
		if (!this.senderKey) throw new Error('E2EE is not initialized')
		return this.senderKey
	}

	private post(message: WorkerRequest) {
		this.worker.postMessage(message)
	}
}
