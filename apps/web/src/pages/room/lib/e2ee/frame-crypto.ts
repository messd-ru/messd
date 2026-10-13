const IV_LENGTH = 12
const TRAILER_LENGTH = IV_LENGTH + 1
const TAG_LENGTH = 16

type EncodedFrame = RTCEncodedVideoFrame | RTCEncodedAudioFrame

function headerLength(frame: EncodedFrame) {
	if (!('type' in frame)) return 1
	if (frame.type === 'key') return 10
	if (frame.type === 'delta') return 3
	return 0
}

export async function encryptFrame(frame: EncodedFrame, key: CryptoKey, index: number) {
	const data = new Uint8Array(frame.data)
	const header = headerLength(frame)
	if (!data.length || header === 0) return frame
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
	const cipher = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv, additionalData: data.subarray(0, header) },
			key,
			data.subarray(header),
		),
	)
	const output = new Uint8Array(header + cipher.length + TRAILER_LENGTH)
	output.set(data.subarray(0, header))
	output.set(cipher, header)
	output.set(iv, header + cipher.length)
	output[output.length - 1] = index
	frame.data = output.buffer
	return frame
}

export async function decryptFrame(
	frame: EncodedFrame,
	resolveKey: (index: number) => CryptoKey | undefined,
) {
	const data = new Uint8Array(frame.data)
	const header = headerLength(frame)
	if (!data.length || header === 0) return frame
	if (data.length < header + TAG_LENGTH + TRAILER_LENGTH) return null
	const key = resolveKey(data[data.length - 1] ?? 0)
	if (!key) return null
	const iv = data.subarray(data.length - TRAILER_LENGTH, data.length - 1)
	try {
		const plain = new Uint8Array(
			await crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv, additionalData: data.subarray(0, header) },
				key,
				data.subarray(header, data.length - TRAILER_LENGTH),
			),
		)
		const output = new Uint8Array(header + plain.length)
		output.set(data.subarray(0, header))
		output.set(plain, header)
		frame.data = output.buffer
		return frame
	} catch {
		return null
	}
}
