export function createHealthController() {
	return {
		check() {
			return { status: 'ok' as const }
		},
	}
}
