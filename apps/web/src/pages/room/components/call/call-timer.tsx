import { useNow } from '#shared/hooks/use-now.ts'
import { formatDuration } from '#shared/lib/format.ts'

export function CallTimer({ since }: { since: number | null }) {
	const now = useNow()
	return <span className="tabular">{formatDuration(since ? now - since : 0)}</span>
}
