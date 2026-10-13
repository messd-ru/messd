import { cn } from '@messd/ui/lib/utils'
import { HouseIcon, SettingsIcon } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { LogoMark } from '#shared/components/logo-mark.tsx'
import { ThemeToggle } from '#shared/components/theme-toggle.tsx'

const navigation = [
	{ to: '/', label: 'Главная', icon: HouseIcon },
	{ to: '/settings', label: 'Настройки', icon: SettingsIcon },
]

export function AppShell() {
	return (
		<div className="flex h-dvh flex-col lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
			<aside className="hidden flex-col gap-11 px-5 py-8 lg:flex">
				<LogoMark className="ml-3 self-start" />
				<nav aria-label="Основное меню" className="flex flex-col gap-1.5">
					{navigation.map(({ to, label, icon: Icon }) => (
						<NavLink
							key={to}
							to={to}
							end
							className={({ isActive }) =>
								cn(
									'flex h-[42px] items-center gap-3 rounded-[10px] px-3 font-medium text-muted transition-colors hover:text-foreground',
									isActive && 'bg-surface font-semibold text-foreground',
								)
							}
						>
							<Icon className="size-4" />
							{label}
						</NavLink>
					))}
				</nav>
				<ThemeToggle variant="icons" className="mt-auto" />
			</aside>
			<main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
				<Outlet />
			</main>
			<nav
				aria-label="Основное меню"
				className="grid shrink-0 grid-cols-2 border-t border-line pt-2.5 safe-bottom lg:hidden"
			>
				{navigation.map(({ to, label, icon: Icon }) => (
					<NavLink
						key={to}
						to={to}
						end
						className={({ isActive }) =>
							cn(
								'flex min-h-[64px] flex-col items-center gap-1 text-[11px] font-semibold text-muted',
								isActive && 'text-foreground',
							)
						}
					>
						<Icon className="size-5" />
						{label}
					</NavLink>
				))}
			</nav>
		</div>
	)
}
