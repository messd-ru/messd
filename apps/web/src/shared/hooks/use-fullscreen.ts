import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
	document.addEventListener('fullscreenchange', onChange)
	return () => document.removeEventListener('fullscreenchange', onChange)
}

export function useFullscreen() {
	const active = useSyncExternalStore(subscribe, () =>
		Boolean(document.fullscreenElement),
	)

	function toggle() {
		if (document.fullscreenElement) void document.exitFullscreen()
		else void document.documentElement.requestFullscreen().catch(() => undefined)
	}

	return { active, toggle }
}
