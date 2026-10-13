import type { FastifyReply, FastifyRequest } from 'fastify'
import type { RoomModel } from '#models/room.model.ts'
import { currentGuest } from '#plugins/auth.ts'
import { roomView } from '#views/room.view.ts'

type CodeRequest = FastifyRequest<{ Params: { code: string } }>

export function createRoomController(rooms: RoomModel) {
	return {
		async create(request: FastifyRequest, reply: FastifyReply) {
			const room = await rooms.create(currentGuest(request).id)
			return reply.code(201).send({ room: roomView(room) })
		},

		async show(request: CodeRequest, reply: FastifyReply) {
			const room = await rooms.findByCode(request.params.code)
			const reason = rooms.unavailableReason(room)
			if (reason || !room) return reply.code(404).send({ reason: reason ?? 'not_found' })
			return reply.send({ room: roomView(room) })
		},
	}
}
