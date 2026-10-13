import { signalingErrorCodes } from '@messd/contracts/signaling'

type SignalingErrorCode = (typeof signalingErrorCodes)[keyof typeof signalingErrorCodes]

export class SignalingError extends Error {
	readonly code: SignalingErrorCode

	constructor(code: SignalingErrorCode, message: string) {
		super(message)
		this.code = code
	}
}

export const errors = {
	unauthorized: () =>
		new SignalingError(signalingErrorCodes.unauthorized, 'Нужна гостевая сессия'),
	notJoined: () => new SignalingError(signalingErrorCodes.notJoined, 'Вы не в комнате'),
	roomNotFound: () =>
		new SignalingError(signalingErrorCodes.roomNotFound, 'Комната не найдена'),
	roomEnded: () =>
		new SignalingError(signalingErrorCodes.roomEnded, 'Звонок уже завершён'),
	roomFull: () => new SignalingError(signalingErrorCodes.roomFull, 'Комната заполнена'),
	forbidden: () => new SignalingError(signalingErrorCodes.forbidden, 'Недостаточно прав'),
	badRequest: (message: string) =>
		new SignalingError(signalingErrorCodes.badRequest, message),
}
