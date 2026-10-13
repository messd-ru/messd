import { Toaster } from '@messd/ui/components/sonner'
import { TooltipProvider } from '@messd/ui/components/tooltip'
import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { signaling } from '#shared/api/signaling.ts'
import { IncomingCalls } from '#shared/components/incoming-calls.tsx'
import { NameDialog } from '#shared/components/name-dialog.tsx'
import { useIsDesktop } from '#shared/hooks/use-media-query.ts'
import { usePreferences } from '#shared/store/preferences.ts'
import { useSession } from '#shared/store/session.ts'

export function RootLayout() {
	const theme = usePreferences((state) => state.theme)
	const token = useSession((state) => state.token)
	const isDesktop = useIsDesktop()

	useEffect(() => {
		document.documentElement.dataset.theme = theme
	}, [theme])

	useEffect(() => {
		if (!token) return
		signaling.connect(token)
		const unsubscribe = signaling.onStatus((status) => {
			if (status === 'unauthorized') useSession.getState().clear()
		})
		return () => {
			unsubscribe()
			signaling.disconnect()
		}
	}, [token])

	return (
		<TooltipProvider delayDuration={300}>
			<Outlet />
			<NameDialog open={!token} />
			<IncomingCalls />
			<Toaster position={isDesktop ? 'bottom-right' : 'top-center'} />
		</TooltipProvider>
	)
}
