import { Greeting } from '#pages/home/components/greeting.tsx'
import { JoinCard, JoinTile } from '#pages/home/components/join-card.tsx'
import { NewCallCard } from '#pages/home/components/new-call-card.tsx'
import { PeopleSearch } from '#pages/home/components/people-search.tsx'
import { LogoMark } from '#shared/components/logo-mark.tsx'
import { useIsDesktop } from '#shared/hooks/use-media-query.ts'

export function HomePage() {
	const isDesktop = useIsDesktop()

	if (!isDesktop) {
		return (
			<div className="flex flex-1 flex-col safe-top">
				<div className="flex items-center px-5 pt-[calc(8px+max(0px,12px-env(safe-area-inset-top)))]">
					<LogoMark />
				</div>
				<div className="flex flex-col gap-5 px-5 pt-6">
					<Greeting />
					<div className="grid grid-cols-2 gap-2.5">
						<NewCallCard />
						<JoinTile />
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-8 p-12">
			<div className="flex w-full max-w-[760px] items-end justify-between gap-6">
				<Greeting />
				<PeopleSearch />
			</div>
			<div className="grid w-full max-w-[760px] grid-cols-2 gap-4">
				<NewCallCard />
				<JoinCard />
			</div>
		</div>
	)
}
