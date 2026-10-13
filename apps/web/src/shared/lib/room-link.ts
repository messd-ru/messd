export function roomUrl(code: string) {
	return `${window.location.origin}/${code}`
}

export function roomLinkLabel(code: string) {
	return `${window.location.host}/${code}`
}
