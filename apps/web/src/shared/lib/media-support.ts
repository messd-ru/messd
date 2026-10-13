export const supportsSinkSelection =
	typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype

export const supportsScreenShare =
	typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getDisplayMedia)

export const supportsFullscreen =
	typeof document !== 'undefined' && Boolean(document.documentElement.requestFullscreen)
