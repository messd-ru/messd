import { Avatar } from '@messd/ui/components/avatar'
import { Button } from '@messd/ui/components/button'
import { PhoneOffIcon, VideoIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { signaling } from '#shared/api/signaling.ts'
import { initials } from '#shared/lib/format.ts'
import { playTone } from '#shared/lib/tone.ts'
import { usePreferences } from '#shared/store/preferences.ts'

const RING_TIMEOUT_MS = 30_000

export function IncomingCalls() {
	const navigate = useNavigate()

	useEffect(() => {
		return signaling.on('invited', ({ code, from }) => {
			if (window.location.pathname === `/${code}`) return
			const { ringtone, browserNotifications, speakerId } = usePreferences.getState()
			let ring: HTMLAudioElement | null = null
			let notification: Notification | null = null
			const toastId = `invite-${code}`

			const stop = () => {
				ring?.pause()
				notification?.close()
				toast.dismiss(toastId)
			}

			if (ringtone) {
				void playTone('ring', speakerId ?? undefined, true)
					.then((audio) => {
						ring = audio
					})
					.catch(() => undefined)
			}

			if (
				browserNotifications &&
				document.visibilityState === 'hidden' &&
				'Notification' in window &&
				Notification.permission === 'granted'
			) {
				notification = new Notification(`${from.name} звонит вам`, {
					body: 'Нажмите, чтобы ответить',
					tag: toastId,
				})
				notification.onclick = () => {
					window.focus()
					stop()
					void navigate(`/${code}`)
				}
			}

			toast.custom(
				() => (
					<div className="flex w-[356px] items-center gap-3 rounded-[14px] border border-line bg-background p-3 shadow-lg">
						<Avatar initials={initials(from.name)} size="md" />
						<div className="flex min-w-0 flex-1 flex-col">
							<span className="truncate font-semibold">{from.name}</span>
							<span className="text-xs text-muted">Звонит вам</span>
						</div>
						<Button
							size="icon"
							variant="danger"
							aria-label="Отклонить"
							onClick={stop}
							className="rounded-full"
						>
							<PhoneOffIcon />
						</Button>
						<Button
							size="icon"
							variant="accent"
							aria-label="Ответить"
							onClick={() => {
								stop()
								void navigate(`/${code}`)
							}}
							className="rounded-full"
						>
							<VideoIcon />
						</Button>
					</div>
				),
				{ id: toastId, duration: RING_TIMEOUT_MS, onAutoClose: stop, onDismiss: stop },
			)
		})
	}, [navigate])

	return null
}
