import { VideoIcon } from 'lucide-react'
import { useStartCall } from '#shared/hooks/use-start-call.ts'

export function NewCallCard() {
	const { start, pending } = useStartCall()

	return (
		<button
			type="button"
			disabled={pending}
			onClick={() => void start()}
			className="flex flex-col gap-[26px] rounded-[14px] bg-accent p-4 text-left text-on-accent transition-opacity outline-none hover:opacity-95 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 lg:min-h-[148px] lg:flex-row-reverse lg:items-end lg:justify-between lg:p-[22px]"
		>
			<span className="grid place-items-start lg:size-11 lg:place-items-center lg:rounded-xl lg:bg-white/16">
				<VideoIcon className="size-5" />
			</span>
			<span className="flex flex-col gap-1">
				<span className="text-[15px] font-semibold lg:text-xl">Новый звонок</span>
				<span className="hidden opacity-85 lg:block">
					Создать комнату и отправить ссылку
				</span>
			</span>
		</button>
	)
}
