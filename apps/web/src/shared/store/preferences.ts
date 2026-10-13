import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

type Preferences = {
	theme: Theme
	blur: boolean
	noiseSuppression: boolean
	joinMuted: boolean
	joinWithoutCamera: boolean
	ringtone: boolean
	browserNotifications: boolean
	cameraId: string | null
	micId: string | null
	speakerId: string | null
}

type PreferencesStore = Preferences & {
	set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
}

export const usePreferences = create<PreferencesStore>()(
	persist(
		(set) => ({
			theme: 'light',
			blur: false,
			noiseSuppression: true,
			joinMuted: false,
			joinWithoutCamera: false,
			ringtone: true,
			browserNotifications: false,
			cameraId: null,
			micId: null,
			speakerId: null,
			set: (key, value) => set({ [key]: value }),
		}),
		{ name: 'messd:preferences', version: 1 },
	),
)
