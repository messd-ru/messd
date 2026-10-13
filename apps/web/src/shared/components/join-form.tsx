import { parseRoomInput } from '@messd/contracts/room'
import { Button } from '@messd/ui/components/button'
import { Input } from '@messd/ui/components/input'
import { cn } from '@messd/ui/lib/utils'
import { LinkIcon } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router'

const JOIN_ERROR = 'Проверьте ссылку — например, messd.app/abc-defg-hij'

type JoinFormProps = {
	placeholder?: string
	autoFocus?: boolean
	size?: 'md' | 'lg'
	className?: string
}

export function JoinForm({
	placeholder = 'messd.app/код-комнаты',
	autoFocus,
	size = 'md',
	className,
}: JoinFormProps) {
	const navigate = useNavigate()
	const [value, setValue] = useState('')
	const [error, setError] = useState<string | null>(null)
	const large = size === 'lg'

	function submit(event: FormEvent) {
		event.preventDefault()
		const code = parseRoomInput(value)
		if (!code) {
			setError(JOIN_ERROR)
			return
		}
		void navigate(`/${code}`)
	}

	return (
		<form onSubmit={submit} noValidate className={cn('flex flex-col gap-2', className)}>
			<div className="flex gap-2">
				<Input
					aria-label="Ссылка или код комнаты"
					icon={<LinkIcon />}
					placeholder={placeholder}
					value={value}
					autoFocus={autoFocus}
					invalid={Boolean(error)}
					autoCapitalize="none"
					autoCorrect="off"
					spellCheck={false}
					onChange={(event) => {
						setValue(event.target.value)
						setError(null)
					}}
					className={cn('flex-1', large && 'h-11 rounded-[10px]')}
				/>
				<Button type="submit" variant="inverse" size={large ? 'lg' : 'md'}>
					Войти
				</Button>
			</div>
			{error && (
				<span role="alert" className="text-[13px] font-medium text-danger">
					{error}
				</span>
			)}
		</form>
	)
}
