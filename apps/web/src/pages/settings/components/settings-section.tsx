import type { ReactNode } from 'react'

type SettingsSectionProps = {
	title: string
	children: ReactNode
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
	return (
		<section className="flex flex-col gap-2 lg:gap-2.5">
			<h2 className="m-0 pl-1 text-[13px] font-semibold text-muted lg:pl-0 lg:text-[15px]">
				{title}
			</h2>
			<div className="rounded-[14px] border border-line bg-background [&>*+*]:border-t [&>*+*]:border-line">
				{children}
			</div>
		</section>
	)
}

type SettingRowProps = {
	label: string
	description?: string
	icon?: ReactNode
	htmlFor?: string
	children: ReactNode
}

export function SettingRow({
	label,
	description,
	icon,
	htmlFor,
	children,
}: SettingRowProps) {
	return (
		<div className="flex min-h-[52px] items-center gap-3 px-4 lg:justify-between lg:gap-5 lg:px-5 lg:py-4">
			{icon && <span className="text-muted lg:hidden [&_svg]:size-[18px]">{icon}</span>}
			<label htmlFor={htmlFor} className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="font-semibold">{label}</span>
				{description && (
					<span className="hidden text-[13px] text-muted lg:block">{description}</span>
				)}
			</label>
			{children}
		</div>
	)
}
