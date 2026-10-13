import { decryptFrame, encryptFrame } from '#pages/room/lib/e2ee/frame-crypto.ts'
import {
	LOCAL_PEER,
	type TransformOptions,
	type WorkerRequest,
} from '#pages/room/lib/e2ee/protocol.ts'

type TransformEvent = {
	transformer: {
		readable: ReadableStream
		writable: WritableStream
		options: TransformOptions
	}
}

type WorkerScope = {
	onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null
	onrtctransform: ((event: TransformEvent) => void) | null
}

const scope = globalThis as unknown as WorkerScope
const keys = new Map<string, Map<number, CryptoKey>>()
let sendIndex = 0

function pipe(
	readable: ReadableStream,
	writable: WritableStream,
	{ operation, peerId }: TransformOptions,
) {
	const transform = new TransformStream<RTCEncodedVideoFrame | RTCEncodedAudioFrame>({
		async transform(frame, controller) {
			if (operation === 'encrypt') {
				const key = keys.get(LOCAL_PEER)?.get(sendIndex)
				if (!key) return
				controller.enqueue(await encryptFrame(frame, key, sendIndex))
				return
			}
			const result = await decryptFrame(frame, (index) => keys.get(peerId)?.get(index))
			if (result) controller.enqueue(result)
		},
	})
	void readable
		.pipeThrough(transform)
		.pipeTo(writable)
		.catch(() => undefined)
}

scope.onmessage = ({ data }) => {
	switch (data.type) {
		case 'setKey': {
			const peerKeys = keys.get(data.peerId) ?? new Map<number, CryptoKey>()
			peerKeys.set(data.index, data.key)
			keys.set(data.peerId, peerKeys)
			break
		}
		case 'useKey':
			sendIndex = data.index
			break
		case 'removePeer':
			keys.delete(data.peerId)
			break
		case 'transform':
			pipe(data.readable, data.writable, data)
			break
	}
}

scope.onrtctransform = ({ transformer }) => {
	pipe(transformer.readable, transformer.writable, transformer.options)
}
