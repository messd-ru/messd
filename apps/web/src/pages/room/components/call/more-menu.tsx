import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@messd/ui/components/dropdown-menu'
import {
	CheckIcon,
	HandIcon,
	LayoutGridIcon,
	Maximize2Icon,
	MessageCircleIcon,
	MinimizeIcon,
	MonitorUpIcon,
	PhoneIcon,
	UserPlusIcon,
	UsersIcon,
	VideoIcon,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { EmojiRow } from '#pages/room/components/call/reactions.tsx'
import { localMedia, useLocalMedia } from '#pages/room/lib/local-media.ts'
import { useRoomSession } from '#pages/room/lib/session-context.ts'
import { roomActions, useRoomStore } from '#pages/room/store/room-store.ts'
import { useFullscreen } from '#shared/hooks/use-fullscreen.ts'
import { supportsFullscreen, supportsScreenShare } from '#shared/lib/media-support.ts'

export type CallMode = 'pair' | 'group' | 'waiting'

type MoreMenuProps = {
	mode: CallMode
	mobile: boolean
	children: ReactNode
}

function Check({ visible }: { visible: boolean }) {
	return <CheckIcon className={visible ? 'ml-auto text-accent!' : 'ml-auto opacity-0'} />
}

export function MoreMenu({ mode, mobile, children }: MoreMenuProps) {
	const session = useRoomSession()
	const [open, setOpen] = useState(false)
	const layoutPair = useRoomStore((state) => state.layoutPair)
	const layoutGroup = useRoomStore((state) => state.layoutGroup)
	const audioOnly = useRoomStore((state) => state.audioOnly)
	const hand = useRoomStore((state) => state.hand)
	const unread = useRoomStore((state) => state.unread)
	const screenTrack = useLocalMedia((state) => state.screenTrack)
	const fullscreen = useFullscreen()

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
			<DropdownMenuContent side="top" align={mobile ? 'end' : 'center'} className="w-64">
				{mobile && (
					<>
						<EmojiRow onPick={() => setOpen(false)} className="justify-between p-1" />
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={() => roomActions.togglePanel('chat')}>
							<MessageCircleIcon />
							Чат
							{unread > 0 && (
								<span className="ml-auto rounded-full bg-accent px-1.5 text-[11px] font-bold text-on-accent">
									{unread}
								</span>
							)}
						</DropdownMenuItem>
						{mode === 'group' && (
							<DropdownMenuItem onSelect={() => roomActions.togglePanel('participants')}>
								<UsersIcon />
								Участники
							</DropdownMenuItem>
						)}
						{supportsScreenShare && (
							<DropdownMenuItem
								onSelect={() =>
									screenTrack ? localMedia.stopScreen() : void localMedia.startScreen()
								}
							>
								<MonitorUpIcon />
								{screenTrack ? 'Остановить демонстрацию' : 'Демонстрация экрана'}
							</DropdownMenuItem>
						)}
						{mode !== 'group' && (
							<DropdownMenuItem onSelect={() => void session.setHand(!hand)}>
								<HandIcon />
								{hand ? 'Опустить руку' : 'Поднять руку'}
							</DropdownMenuItem>
						)}
					</>
				)}

				{mode === 'pair' && !mobile && (
					<>
						<DropdownMenuLabel>Раскладка</DropdownMenuLabel>
						<DropdownMenuItem onSelect={() => roomActions.setLayoutPair('focus')}>
							Собеседник на весь экран
							<Check visible={layoutPair === 'focus'} />
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => roomActions.setLayoutPair('split')}>
							Рядом, на равных
							<Check visible={layoutPair === 'split'} />
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}

				{mode === 'group' && (
					<>
						<DropdownMenuLabel>Раскладка</DropdownMenuLabel>
						<DropdownMenuItem onSelect={() => roomActions.setLayoutGroup('grid')}>
							<LayoutGridIcon />
							Сетка
							<Check visible={layoutGroup === 'grid'} />
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => roomActions.setLayoutGroup('speaker')}>
							<UsersIcon />
							Говорящий крупно
							<Check visible={layoutGroup === 'speaker'} />
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}

				<DropdownMenuItem onSelect={() => roomActions.setInviteOpen(true)}>
					<UserPlusIcon />
					{mode === 'group' ? 'Пригласить' : 'Добавить участника'}
				</DropdownMenuItem>
				{!mobile && supportsFullscreen && (
					<DropdownMenuItem onSelect={fullscreen.toggle}>
						{fullscreen.active ? <MinimizeIcon /> : <Maximize2Icon />}
						{fullscreen.active ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
					</DropdownMenuItem>
				)}
				<DropdownMenuItem onSelect={() => void session.setAudioOnly(!audioOnly)}>
					{audioOnly ? <VideoIcon /> : <PhoneIcon />}
					{audioOnly ? 'Вернуть видео' : 'Только звук'}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
