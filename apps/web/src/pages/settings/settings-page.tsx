import {
	AppearanceSection,
	MobileAppearanceSections,
} from '#pages/settings/components/appearance-section.tsx'
import { CallsSection } from '#pages/settings/components/calls-section.tsx'
import { DevicesSection } from '#pages/settings/components/devices-section.tsx'
import { useIsDesktop } from '#shared/hooks/use-media-query.ts'

export function SettingsPage() {
	const isDesktop = useIsDesktop()

	if (!isDesktop) {
		return (
			<div className="flex flex-col gap-5 px-4 pt-[calc(8px+max(0px,12px-env(safe-area-inset-top)))] safe-top pb-6">
				<h1 className="mx-1 my-0 text-[28px] font-semibold">Настройки</h1>
				<CallsSection desktop={false} />
				<MobileAppearanceSections />
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center px-12 py-14">
			<div className="flex w-full max-w-[760px] flex-col gap-8">
				<h1 className="m-0 text-[32px] font-semibold tracking-[-0.01em]">Настройки</h1>
				<DevicesSection />
				<CallsSection desktop />
				<AppearanceSection />
			</div>
		</div>
	)
}
