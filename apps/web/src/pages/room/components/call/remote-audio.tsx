import { useEffect, useRef } from 'react'
import { useRoomStore } from '#pages/room/store/room-store.ts'
import { usePreferences } from '#shared/store/preferences.ts'

type SinkAudio = HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }

function PeerAudio({
	track,
	sinkId,
}: {
	track: MediaStreamTrack
	sinkId: string | null
}) {
	const ref = useRef<SinkAudio>(null)

	useEffect(() => {
		const audio = ref.current
		if (!audio) return
		audio.srcObject = new MediaStream([track])
		void audio.play().catch(() => undefined)
		return () => {
			audio.srcObject = null
		}
	}, [track])

	useEffect(() => {
		if (sinkId) void ref.current?.setSinkId?.(sinkId).catch(() => undefined)
	}, [sinkId])

	return <audio ref={ref} autoPlay />
}

export function RemoteAudio() {
	const media = useRoomStore((state) => state.media)
	const speakerId = usePreferences((state) => state.speakerId)

	return (
		<div hidden>
			{Object.entries(media).map(([peerId, { audio }]) =>
				audio ? <PeerAudio key={peerId} track={audio} sinkId={speakerId} /> : null,
			)}
		</div>
	)
}
