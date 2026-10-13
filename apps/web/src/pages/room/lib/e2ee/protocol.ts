export const LOCAL_PEER = 'local'

export type TransformOptions = { operation: 'encrypt' | 'decrypt'; peerId: string }

export type WorkerRequest =
	| { type: 'setKey'; peerId: string; index: number; key: CryptoKey }
	| { type: 'useKey'; index: number }
	| { type: 'removePeer'; peerId: string }
	| ({
			type: 'transform'
			readable: ReadableStream
			writable: WritableStream
	  } & TransformOptions)
