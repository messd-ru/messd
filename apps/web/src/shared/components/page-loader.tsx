import { LoaderCircleIcon } from 'lucide-react'

export function PageLoader() {
	return (
		<div className="grid h-dvh place-items-center text-muted">
			<LoaderCircleIcon className="size-6 animate-spin" aria-label="Загрузка" />
		</div>
	)
}
