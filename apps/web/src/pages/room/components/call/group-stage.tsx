import { Button } from '@messd/ui/components/button'
import { cn } from '@messd/ui/lib/utils'
import { ChevronLeftIcon, ChevronRightIcon, CopyIcon, UsersIcon } from 'lucide-react'
import { useState } from 'react'
import { CallControls } from '#pages/room/components/call/call-controls.tsx'
import { CallTimer } from '#pages/room/components/call/call-timer.tsx'
import { EncryptionIcon } from '#pages/room/components/call/encryption-badge.tsx'
import {
	ReconnectingOverlay,
	WeakNetworkBanner,
} from '#pages/room/components/call/network-status.tsx'
import { VideoTile } from '#pages/room/components/call/video-tile.tsx'
import type { Tile } from '#pages/room/hooks/use-tiles.ts'
import { roomActions, useRoomStore } from '#pages/room/store/room-store.ts'
import { LogoMark } from '#shared/components/logo-mark.tsx'
import { copyRoomLink } from '#shared/lib/clipboard.ts'
import { firstName, plural } from '#shared/lib/format.ts'

const PAGE_SIZE = 6

type GroupStageProps = {
	self: Tile
	remote: Tile[]
	screens: Tile[]
	mobile: boolean
	onLeave: () => void
}

function groupTitle(remote: Tile[]) {
	const names = remote.slice(0, 2).map((tile) => firstName(tile.fullName))
	const rest = remote.length - names.length
	return `${names.join(', ')}${rest ? ` и ещё ${rest}` : ''}`
}

function Pager({
	page,
	pages,
	onChange,
}: {
	page: number
	pages: number
	onChange: (page: number) => void
}) {
	if (pages <= 1) return null
	return (
		<div className="flex items-center gap-1 text-[13px] font-semibold text-muted">
			<button
				type="button"
				aria-label="Предыдущая страница"
				disabled={page === 0}
				onClick={() => onChange(page - 1)}
				className="grid size-8 place-items-center rounded-lg outline-none hover:bg-surface disabled:opacity-40"
			>
				<ChevronLeftIcon className="size-4" />
			</button>
			<span className="tabular">
				{page + 1} / {pages}
			</span>
			<button
				type="button"
				aria-label="Следующая страница"
				disabled={page >= pages - 1}
				onClick={() => onChange(page + 1)}
				className="grid size-8 place-items-center rounded-lg outline-none hover:bg-surface disabled:opacity-40"
			>
				<ChevronRightIcon className="size-4" />
			</button>
		</div>
	)
}

function gridShape(count: number, mobile: boolean, narrow: boolean) {
	if (mobile || narrow) {
		const cols = count <= 2 ? 1 : 2
		return { cols, rows: Math.ceil(count / cols) }
	}
	const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3
	return { cols, rows: Math.ceil(count / cols) }
}

export function GroupStage({ self, remote, screens, mobile, onLeave }: GroupStageProps) {
	const layoutGroup = useRoomStore((state) => state.layoutGroup)
	const pinnedId = useRoomStore((state) => state.pinnedId)
	const panel = useRoomStore((state) => state.panel)
	const joinedAt = useRoomStore((state) => state.joinedAt)
	const code = useRoomStore((state) => state.code)
	const connection = useRoomStore((state) => state.connection)
	const [requestedPage, setPage] = useState(0)

	const tiles = [self, ...remote]
	const total = tiles.length
	const pinned = [...screens, ...tiles].find((tile) => tile.id === pinnedId)
	const forced = pinned ?? screens[0]
	const speakerMode = Boolean(forced) || layoutGroup === 'speaker'
	const main = forced ?? remote.find((tile) => tile.speaking) ?? remote[0] ?? self
	const strip = [...screens, ...tiles].filter((tile) => tile !== main)
	const pages = Math.ceil(total / PAGE_SIZE)
	const page = Math.min(requestedPage, pages - 1)
	const visible = tiles.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
	const { cols, rows } = gridShape(visible.length, mobile, Boolean(panel))
	const title = groupTitle(remote)

	const grid = (
		<div
			data-testid="call-grid"
			className={cn(
				'grid min-h-0 flex-1',
				mobile ? 'gap-2 px-3' : 'gap-2.5 px-6',
				panel && !mobile && 'pr-0',
			)}
			style={{
				gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
				gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
			}}
		>
			{visible.map((tile) => (
				<VideoTile
					key={tile.id}
					tile={mobile ? { ...tile, name: firstName(tile.name) } : tile}
					size={mobile ? 'mobile' : panel ? 'compact' : 'grid'}
				/>
			))}
		</div>
	)

	const speaker = mobile ? (
		<div className="flex min-h-0 flex-1 flex-col gap-2 px-3">
			<VideoTile tile={main} size="main" showLevel className="flex-1" />
			<div className="flex shrink-0 gap-2 overflow-x-auto">
				{strip.map((tile) => (
					<VideoTile key={tile.id} tile={tile} size="strip" className="w-24" />
				))}
			</div>
		</div>
	) : (
		<div
			className={cn(
				'grid min-h-0 flex-1',
				panel ? 'grid-cols-[minmax(0,1fr)_180px]' : 'grid-cols-[minmax(0,1fr)_220px]',
			)}
		>
			<VideoTile tile={main} size="main" showLevel className="ml-6" />
			<div
				className={cn(
					'flex flex-col gap-2.5 overflow-y-auto pl-3',
					panel ? 'pr-0' : 'pr-6',
				)}
			>
				{strip.map((tile) => (
					<VideoTile key={tile.id} tile={tile} size="strip" />
				))}
			</div>
		</div>
	)

	if (mobile) {
		return (
			<div className="relative flex size-full flex-col safe-top">
				<header className="flex items-center justify-between gap-3 px-4 pt-[calc(6px+max(0px,44px-env(safe-area-inset-top)))] pb-3">
					<div className="flex min-w-0 flex-col">
						<span className="truncate text-[15px] font-semibold">{title}</span>
						<span className="flex items-center gap-1 text-xs text-muted">
							<EncryptionIcon />
							<CallTimer since={joinedAt} /> · {plural(total, 'participant')}
						</span>
					</div>
					<button
						type="button"
						aria-label="Участники"
						onClick={() => roomActions.togglePanel('participants')}
						className="grid size-11 shrink-0 place-items-center rounded-xl border border-line"
					>
						<UsersIcon className="size-[18px]" />
					</button>
				</header>
				{speakerMode ? speaker : grid}
				{!speakerMode && (
					<div className="flex justify-center pt-2">
						<Pager page={page} pages={pages} onChange={setPage} />
					</div>
				)}
				{connection === 'reconnecting' && <ReconnectingOverlay mobile />}
				<CallControls
					variant="mobile-plain"
					mode="group"
					keys={['mic', 'camera', 'hand', 'more', 'leave']}
					onLeave={onLeave}
				/>
			</div>
		)
	}

	return (
		<div className="relative flex size-full flex-col">
			<header
				className={cn(
					'flex h-16 shrink-0 items-center justify-between gap-4 px-6',
					panel && 'pr-0',
				)}
			>
				<div className="flex min-w-0 items-center gap-3.5">
					<LogoMark className="h-[22px]" decorative />
					<span className="truncate text-[15px] font-semibold">{title}</span>
					<span className="flex items-center gap-1.5 text-muted">
						<EncryptionIcon />
						<CallTimer since={joinedAt} />
					</span>
				</div>
				{!speakerMode && <Pager page={page} pages={pages} onChange={setPage} />}
				{!panel && (
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="outline"
							aria-label={`Участники: ${total}`}
							onClick={() => roomActions.togglePanel('participants')}
						>
							<UsersIcon />
							{total}
						</Button>
						<Button size="sm" variant="outline" onClick={() => void copyRoomLink(code)}>
							<CopyIcon />
							Ссылка
						</Button>
					</div>
				)}
			</header>
			<div className="relative flex min-h-0 flex-1 flex-col">
				{speakerMode ? speaker : grid}
				<WeakNetworkBanner />
				{connection === 'reconnecting' && <ReconnectingOverlay />}
			</div>
			<CallControls
				variant="plain"
				mode="group"
				keys={[
					'mic',
					'camera',
					'screen',
					'hand',
					'reactions',
					'participants',
					'more',
					'leave',
				]}
				onLeave={onLeave}
				className={panel ? 'pl-6' : undefined}
			/>
		</div>
	)
}
