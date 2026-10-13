import { Button } from '@messd/ui/components/button'
import { PlayIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
	SettingRow,
	SettingsSection,
} from '#pages/settings/components/settings-section.tsx'
import { DeviceSelect } from '#shared/components/device-select.tsx'
import { LevelBars } from '#shared/components/level-bars.tsx'
import { useAudioLevel } from '#shared/hooks/use-audio-level.ts'
import { useDevices } from '#shared/hooks/use-devices.ts'
import { supportsSinkSelection } from '#shared/lib/media-support.ts'
import { playTone } from '#shared/lib/tone.ts'
import { usePreferences } from '#shared/store/preferences.ts'

function useMicrophoneTrack(enabled: boolean, deviceId: string | null) {
	const [track, setTrack] = useState<MediaStreamTrack | null>(null)

	useEffect(() => {
		if (!enabled) return
		let active = true
		let current: MediaStreamTrack | null = null
		navigator.mediaDevices
			.getUserMedia({ audio: deviceId ? { deviceId: { exact: deviceId } } : true })
			.then((stream) => {
				current = stream.getAudioTracks()[0] ?? null
				if (active) setTrack(current)
				else current?.stop()
			})
			.catch(() => undefined)
		return () => {
			active = false
			current?.stop()
			setTrack(null)
		}
	}, [enabled, deviceId])

	return track
}

export function DevicesSection() {
	const { cameras, microphones, speakers, refresh } = useDevices()
	const cameraId = usePreferences((state) => state.cameraId)
	const micId = usePreferences((state) => state.micId)
	const speakerId = usePreferences((state) => state.speakerId)
	const setPreference = usePreferences((state) => state.set)
	const granted = microphones.length > 0 || cameras.length > 0
	const micTrack = useMicrophoneTrack(microphones.length > 0, micId)
	const level = useAudioLevel(micTrack)

	async function requestAccess() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: true,
			})
			for (const track of stream.getTracks()) track.stop()
			await refresh()
		} catch {
			toast.error('Браузер не дал доступ к камере и микрофону')
		}
	}

	async function testSpeaker() {
		try {
			await playTone('test', speakerId ?? undefined)
		} catch {
			toast.error('Не удалось воспроизвести звук')
		}
	}

	return (
		<SettingsSection title="Устройства">
			{!granted && (
				<div className="flex items-center justify-between gap-5 px-5 py-4">
					<span className="text-muted">
						Разрешите доступ, чтобы выбрать камеру и микрофон
					</span>
					<Button size="md" variant="inverse" onClick={() => void requestAccess()}>
						Разрешить доступ
					</Button>
				</div>
			)}
			<SettingRow label="Камера">
				<DeviceSelect
					kind="camera"
					devices={cameras}
					value={cameraId}
					onChange={(id) => setPreference('cameraId', id)}
					className="h-[38px] w-[280px]"
				/>
			</SettingRow>
			<SettingRow label="Микрофон">
				<div className="flex flex-col items-end gap-2">
					<DeviceSelect
						kind="microphone"
						devices={microphones}
						value={micId}
						onChange={(id) => setPreference('micId', id)}
						className="h-[38px] w-[280px]"
					/>
					<LevelBars level={level} variant="meter" className="w-[280px]" />
				</div>
			</SettingRow>
			<SettingRow label="Динамик">
				<div className="flex gap-2">
					<Button size="md" variant="outline" onClick={() => void testSpeaker()}>
						<PlayIcon className="size-[13px]!" />
						Проверить
					</Button>
					<DeviceSelect
						kind="speaker"
						devices={supportsSinkSelection ? speakers : []}
						value={speakerId}
						fallback="Системный"
						onChange={(id) => setPreference('speakerId', id)}
						className="h-[38px] w-[180px]"
					/>
				</div>
			</SettingRow>
		</SettingsSection>
	)
}
