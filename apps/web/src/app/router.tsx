import { Navigate, createBrowserRouter } from 'react-router'
import { AppShell } from '#app/app-shell.tsx'
import { RootLayout } from '#app/root-layout.tsx'
import { HomePage } from '#pages/home/home-page.tsx'
import { SettingsPage } from '#pages/settings/settings-page.tsx'
import { PageLoader } from '#shared/components/page-loader.tsx'

export const router = createBrowserRouter([
	{
		element: <RootLayout />,
		hydrateFallbackElement: <PageLoader />,
		children: [
			{
				element: <AppShell />,
				children: [
					{ index: true, element: <HomePage /> },
					{ path: 'settings', element: <SettingsPage /> },
				],
			},
			{
				path: ':code',
				lazy: async () => {
					const { RoomPage } = await import('#pages/room/room-page.tsx')
					return { Component: RoomPage }
				},
			},
			{ path: '*', element: <Navigate to="/" replace /> },
		],
	},
])
