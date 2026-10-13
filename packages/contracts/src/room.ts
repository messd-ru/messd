import { z } from 'zod'

const ROOM_CODE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const roomCodeSchema = z
	.string()
	.min(3)
	.max(48)
	.regex(ROOM_CODE_PATTERN, 'Неверный формат кода комнаты')

export type RoomCode = z.infer<typeof roomCodeSchema>

export const roomSchema = z.object({
	code: roomCodeSchema,
	creatorId: z.uuid(),
	createdAt: z.iso.datetime(),
})

export type Room = z.infer<typeof roomSchema>

export const roomNotFoundReasonSchema = z.enum(['not_found', 'ended'])

export type RoomNotFoundReason = z.infer<typeof roomNotFoundReasonSchema>

export function parseRoomInput(input: string): RoomCode | null {
	const value = input.trim().toLowerCase()
	if (!value) return null
	const withoutProtocol = value.replace(/^[a-z]+:\/\//, '')
	const path = withoutProtocol.includes('/')
		? withoutProtocol.slice(withoutProtocol.indexOf('/') + 1)
		: withoutProtocol
	const code = path.split(/[?#]/)[0]?.replace(/\/+$/, '') ?? ''
	const result = roomCodeSchema.safeParse(code)
	return result.success ? result.data : null
}
