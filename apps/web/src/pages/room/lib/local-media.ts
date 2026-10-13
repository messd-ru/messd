import { toast } from 'sonner'
import { create } from 'zustand'
import { blurTrack } from '#pages/room/lib/background-blur.ts'
import { usePreferences } from '#shared/store/preferences.ts'

export type Permission = 'pending' | 'granted' | 'denied' | 'unavailable'
export type Facing = 'user' | 'environment'

type LocalMediaState = {
	permission: Permission
	micTrack: MediaStreamTrack | null
	cameraTrack: MediaStreamTrack | null
	videoTrack: MediaStreamTrack | null
	screenTrack: MediaStreamTrack | null
	micEnabled: boolean
	cameraEnabled: boolean
	blur: boolean
	blurPending: boolean
	noiseSuppression: boolean
	facing: Facing
}

const initialState: LocalMediaState = {
	permission: 'pending',
	micTrack: null,
	cameraTrack: null,
	videoTrack: null,
	screenTrack: null,
	micEnabled: true,
	cameraEnabled: true,
	blur: false,
	blurPending: false,
	noiseSuppression: true,
	facing: 'user',
}

export const useLocalMedia = create<LocalMediaState>(() => initialState)

const set = useLocalMedia.setState
const get = useLocalMedia.getState

let stopBlur: (() => void) | null = null
let pipelineVersion = 0

function audioConstraints(): MediaTrackConstraints {
	const { micId } = usePreferences.getState()
	return {
		deviceId: micId ? { ideal: micId } : undefined,
		echoCancellation: true,
		autoGainControl: true,
		noiseSuppression: get().noiseSuppression,
	}
}

function videoConstraints(): MediaTrackConstraints {
	const { cameraId } = usePreferences.getState()
	const { facing } = get()
	const byDevice = cameraId && facing === 'user'
	return {
		deviceId: byDevice ? { ideal: cameraId } : undefined,
		facingMode: byDevice ? undefined : { ideal: facing },
		width: { ideal: 1280 },
		height: { ideal: 720 },
		frameRate: { ideal: 30, max: 30 },
	}
}

function isDenied(error: unknown) {
	const name = (error as DOMException).name
	return name === 'NotAllowedError' || name === 'SecurityError'
}

async function acquire(kind: 'audio' | 'video') {
	const stream = await navigator.mediaDevices.getUserMedia(
		kind === 'audio' ? { audio: audioConstraints() } : { video: videoConstraints() },
	)
	const track = stream.getTracks()[0]
	if (!track) throw new Error('No track')
	return track
}

async function applyVideoPipeline() {
	const version = ++pipelineVersion
	stopBlur?.()
	stopBlur = null
	const { cameraTrack, blur } = get()
	if (!cameraTrack || !blur) {
		set({ videoTrack: cameraTrack, blurPending: false })
		return
	}
	set({ blurPending: true })
	try {
		const blurred = await blurTrack(cameraTrack)
		if (version !== pipelineVersion) {
			blurred.stop()
			return
		}
		stopBlur = blurred.stop
		set({ videoTrack: blurred.track, blurPending: false })
	} catch {
		if (version !== pipelineVersion) return
		toast.error('Размытие фона не поддерживается в этом браузере')
		set({ blur: false, blurPending: false, videoTrack: cameraTrack })
	}
}

function stopCamera() {
	pipelineVersion += 1
	stopBlur?.()
	stopBlur = null
	get().cameraTrack?.stop()
	set({ cameraTrack: null, videoTrack: null })
}

export const localMedia = {
	async start() {
		const preferences = usePreferences.getState()
		set({
			...initialState,
			micEnabled: !preferences.joinMuted,
			cameraEnabled: !preferences.joinWithoutCamera,
			blur: preferences.blur,
			noiseSuppression: preferences.noiseSuppression,
		})
		if (!navigator.mediaDevices?.getUserMedia) {
			set({ permission: 'unavailable', micEnabled: false, cameraEnabled: false })
			return
		}
		const withCamera = get().cameraEnabled
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: audioConstraints(),
				video: withCamera ? videoConstraints() : false,
			})
			const micTrack = stream.getAudioTracks()[0] ?? null
			if (micTrack) micTrack.enabled = get().micEnabled
			set({
				permission: 'granted',
				micTrack,
				cameraTrack: stream.getVideoTracks()[0] ?? null,
			})
			await applyVideoPipeline()
		} catch (error) {
			if (isDenied(error)) {
				set({ permission: 'denied', micEnabled: false, cameraEnabled: false })
				return
			}
			try {
				const micTrack = await acquire('audio')
				micTrack.enabled = get().micEnabled
				set({ permission: 'granted', micTrack, cameraEnabled: false })
			} catch {
				set({ permission: 'unavailable', micEnabled: false, cameraEnabled: false })
			}
		}
	},

	async setMic(enabled: boolean) {
		let { micTrack } = get()
		if (enabled && !micTrack) {
			try {
				micTrack = await acquire('audio')
				set({ micTrack, permission: 'granted' })
			} catch (error) {
				toast.error(isDenied(error) ? 'Нет доступа к микрофону' : 'Микрофон не найден')
				return
			}
		}
		if (micTrack) micTrack.enabled = enabled
		set({ micEnabled: enabled })
	},

	async setCamera(enabled: boolean) {
		if (!enabled) {
			stopCamera()
			set({ cameraEnabled: false })
			return
		}
		set({ cameraEnabled: true })
		try {
			const cameraTrack = await acquire('video')
			if (!get().cameraEnabled) {
				cameraTrack.stop()
				return
			}
			set({ cameraTrack, permission: 'granted' })
			await applyVideoPipeline()
		} catch (error) {
			set({ cameraEnabled: false })
			toast.error(isDenied(error) ? 'Нет доступа к камере' : 'Камера не найдена')
		}
	},

	async setBlur(enabled: boolean) {
		set({ blur: enabled })
		await applyVideoPipeline()
	},

	async setNoiseSuppression(enabled: boolean) {
		set({ noiseSuppression: enabled })
		await get()
			.micTrack?.applyConstraints(audioConstraints())
			.catch(() => undefined)
	},

	async switchCamera() {
		set({ facing: get().facing === 'user' ? 'environment' : 'user' })
		if (!get().cameraEnabled) return
		stopCamera()
		await localMedia.setCamera(true)
	},

	async reselect(kind: 'camera' | 'microphone') {
		if (kind === 'camera') {
			if (!get().cameraEnabled) return
			stopCamera()
			await localMedia.setCamera(true)
			return
		}
		const previous = get().micTrack
		if (!previous) return
		try {
			const micTrack = await acquire('audio')
			micTrack.enabled = get().micEnabled
			previous.stop()
			set({ micTrack })
		} catch {
			toast.error('Не удалось переключить микрофон')
		}
	},

	async startScreen() {
		try {
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: { frameRate: { ideal: 15, max: 30 } },
				audio: false,
			})
			const screenTrack = stream.getVideoTracks()[0]
			if (!screenTrack) return
			screenTrack.contentHint = 'detail'
			screenTrack.addEventListener('ended', () => localMedia.stopScreen())
			set({ screenTrack })
		} catch (error) {
			if (!isDenied(error)) toast.error('Не удалось начать демонстрацию экрана')
		}
	},

	stopScreen() {
		get().screenTrack?.stop()
		set({ screenTrack: null })
	},

	stop() {
		stopCamera()
		const { micTrack, screenTrack } = get()
		micTrack?.stop()
		screenTrack?.stop()
		set(initialState)
	},
}
