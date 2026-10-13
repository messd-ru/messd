import type { Peer } from '@messd/contracts/signaling'
import type { Invitee } from '#shared/hooks/use-start-call.ts'
import { firstName } from '#shared/lib/format.ts'

export function describeLobby(peers: Peer[], invitee: Invitee | null, compact: boolean) {
	if (!peers.length) {
		return {
			title: invitee?.name ?? 'Новый звонок',
			status: invitee
				? 'Позовём, как только вы подключитесь'
				: 'В комнате пока никого — отправьте ссылку',
			waiting: false,
		}
	}
	const [first] = peers
	if (peers.length === 1 && first) {
		return {
			title: first.name,
			status: compact
				? `${firstName(first.name)} уже ждёт`
				: `${firstName(first.name)} уже в комнате и ждёт вас`,
			waiting: true,
		}
	}
	const names = peers.slice(0, 2).map((peer) => firstName(peer.name))
	const rest = peers.length - names.length
	return {
		title: 'Групповой звонок',
		status: `${names.join(', ')}${rest ? ` и ещё ${rest}` : ''} уже в комнате`,
		waiting: true,
	}
}
