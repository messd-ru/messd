import { useEffect, useState } from 'react'

const SAMPLE_INTERVAL_MS = 100

export function useAudioLevel(track: MediaStreamTrack | null | undefined) {
	const [level, setLevel] = useState(0)

	useEffect(() => {
		if (!track || track.readyState === 'ended') return
		const context = new AudioContext()
		const source = context.createMediaStreamSource(new MediaStream([track]))
		const analyser = context.createAnalyser()
		analyser.fftSize = 512
		source.connect(analyser)
		const samples = new Float32Array(analyser.fftSize)

		const timer = setInterval(() => {
			if (context.state === 'suspended') void context.resume()
			analyser.getFloatTimeDomainData(samples)
			let sum = 0
			for (const sample of samples) sum += sample * sample
			const rms = Math.sqrt(sum / samples.length)
			setLevel(track.enabled ? Math.min(1, rms * 6) : 0)
		}, SAMPLE_INTERVAL_MS)

		return () => {
			clearInterval(timer)
			source.disconnect()
			void context.close()
			setLevel(0)
		}
	}, [track])

	return level
}
