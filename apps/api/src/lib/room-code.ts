import { randomInt } from 'node:crypto'

const ALPHABET = 'abcdefghijkmnopqrstuvwxyz'

function segment(length: number) {
	return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
}

export function generateRoomCode() {
	return [segment(3), segment(4), segment(3)].join('-')
}
