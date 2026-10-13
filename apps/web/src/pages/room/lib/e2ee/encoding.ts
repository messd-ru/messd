export function toBase64(bytes: ArrayBuffer | Uint8Array) {
	const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
	let binary = ''
	for (const byte of view) binary += String.fromCharCode(byte)
	return btoa(binary)
}

export function fromBase64(value: string) {
	const binary = atob(value)
	const bytes = new Uint8Array(binary.length)
	for (let index = 0; index < binary.length; index += 1)
		bytes[index] = binary.charCodeAt(index)
	return bytes
}
