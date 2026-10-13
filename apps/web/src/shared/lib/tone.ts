const SAMPLE_RATE = 22_050

type Note = { frequency: number; duration: number; gap: number }

const tones: Record<'test' | 'ring', Note[]> = {
	test: [
		{ frequency: 660, duration: 0.18, gap: 0.06 },
		{ frequency: 880, duration: 0.26, gap: 0 },
	],
	ring: [
		{ frequency: 523, duration: 0.22, gap: 0.08 },
		{ frequency: 659, duration: 0.22, gap: 0.08 },
		{ frequency: 784, duration: 0.32, gap: 1.2 },
	],
}

const cache = new Map<string, string>()

function encodeWav(samples: Float32Array) {
	const buffer = new ArrayBuffer(44 + samples.length * 2)
	const view = new DataView(buffer)
	const write = (offset: number, text: string) => {
		for (let index = 0; index < text.length; index += 1) {
			view.setUint8(offset + index, text.charCodeAt(index))
		}
	}
	write(0, 'RIFF')
	view.setUint32(4, 36 + samples.length * 2, true)
	write(8, 'WAVE')
	write(12, 'fmt ')
	view.setUint32(16, 16, true)
	view.setUint16(20, 1, true)
	view.setUint16(22, 1, true)
	view.setUint32(24, SAMPLE_RATE, true)
	view.setUint32(28, SAMPLE_RATE * 2, true)
	view.setUint16(32, 2, true)
	view.setUint16(34, 16, true)
	write(36, 'data')
	view.setUint32(40, samples.length * 2, true)
	samples.forEach((sample, index) => {
		view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true)
	})
	return new Blob([buffer], { type: 'audio/wav' })
}

function render(notes: Note[]) {
	const total = notes.reduce((sum, note) => sum + note.duration + note.gap, 0)
	const samples = new Float32Array(Math.ceil(total * SAMPLE_RATE))
	let cursor = 0
	for (const note of notes) {
		const length = Math.floor(note.duration * SAMPLE_RATE)
		for (let index = 0; index < length; index += 1) {
			const time = index / SAMPLE_RATE
			const envelope = Math.min(1, index / 300) * Math.exp(-time * 6)
			samples[cursor + index] =
				Math.sin(2 * Math.PI * note.frequency * time) * envelope * 0.5
		}
		cursor += length + Math.floor(note.gap * SAMPLE_RATE)
	}
	return samples
}

export function toneUrl(kind: keyof typeof tones) {
	const cached = cache.get(kind)
	if (cached) return cached
	const url = URL.createObjectURL(encodeWav(render(tones[kind])))
	cache.set(kind, url)
	return url
}

type SinkAudio = HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }

export async function playTone(kind: keyof typeof tones, sinkId?: string, loop = false) {
	const audio: SinkAudio = new Audio(toneUrl(kind))
	audio.loop = loop
	if (sinkId && audio.setSinkId) await audio.setSinkId(sinkId).catch(() => undefined)
	await audio.play()
	return audio
}
