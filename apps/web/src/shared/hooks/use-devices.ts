import { useCallback, useEffect, useState } from 'react'

export type DeviceGroups = {
	cameras: MediaDeviceInfo[]
	microphones: MediaDeviceInfo[]
	speakers: MediaDeviceInfo[]
}

const empty: DeviceGroups = { cameras: [], microphones: [], speakers: [] }

async function listDevices(): Promise<DeviceGroups> {
	if (!navigator.mediaDevices?.enumerateDevices) return empty
	const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
		(device) => device.deviceId && device.label,
	)
	return {
		cameras: devices.filter((device) => device.kind === 'videoinput'),
		microphones: devices.filter((device) => device.kind === 'audioinput'),
		speakers: devices.filter((device) => device.kind === 'audiooutput'),
	}
}

export function useDevices(refreshKey?: unknown) {
	const [devices, setDevices] = useState<DeviceGroups>(empty)

	const refresh = useCallback(async () => {
		setDevices(await listDevices())
	}, [])

	useEffect(() => {
		let active = true
		const update = () => {
			void listDevices().then((next) => {
				if (active) setDevices(next)
			})
		}
		update()
		navigator.mediaDevices?.addEventListener('devicechange', update)
		return () => {
			active = false
			navigator.mediaDevices?.removeEventListener('devicechange', update)
		}
	}, [refreshKey])

	return { ...devices, refresh }
}
