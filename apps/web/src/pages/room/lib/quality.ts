type StatsEntry = {
	type: string
	state?: string
	nominated?: boolean
	currentRoundTripTime?: number
	roundTripTime?: number
	fractionLost?: number
	packetsLost?: number
	packetsReceived?: number
}

export function measureQuality(stats: RTCStatsReport) {
	let rtt = 0
	let loss = 0
	let lost = 0
	let received = 0
	stats.forEach((entry: StatsEntry) => {
		if (
			entry.type === 'candidate-pair' &&
			entry.nominated &&
			entry.state === 'succeeded'
		) {
			rtt = Math.max(rtt, entry.currentRoundTripTime ?? 0)
		}
		if (entry.type === 'remote-inbound-rtp') {
			loss = Math.max(loss, entry.fractionLost ?? 0)
			rtt = Math.max(rtt, entry.roundTripTime ?? 0)
		}
		if (entry.type === 'inbound-rtp') {
			lost += Math.max(0, entry.packetsLost ?? 0)
			received += entry.packetsReceived ?? 0
		}
	})
	if (lost + received > 0) loss = Math.max(loss, lost / (lost + received))
	if (rtt > 0.6 || loss > 0.1) return 1
	if (rtt > 0.35 || loss > 0.05) return 2
	if (rtt > 0.2 || loss > 0.02) return 3
	return 4
}
