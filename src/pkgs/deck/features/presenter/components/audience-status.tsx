'use client';

import { MonitorCheck, MonitorOff } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '~/components/ui/button';
import { usePresentationStore } from '../../../core/store/presentation-store';
import type {
	AudienceWindow,
	SlideDefinition,
} from '../../../core/types/types';

export function AudienceStatus() {
	const slug = usePresentationStore((state) => state.slug);
	const slides = usePresentationStore((state) => state.slides);
	const windows = usePresentationStore((state) => state.audienceWindows);
	const service = usePresentationStore((state) => state.syncService);
	const statusId = useId();
	const [blocked, setBlocked] = useState(false);
	const connection = describeConnection(
		slug,
		slides,
		windows,
		service?.isConnected() ?? true
	);
	const openAudience = () => {
		const prefix = window.location.pathname.match(/^\/(ref\/[^/]+)/)?.[0] ?? '';
		const audience = window.open(`${prefix}/${slug}`, 'deck-audience');
		setBlocked(!audience);
		if (audience) {
			audience.opener = null;
			audience.focus();
		}
	};
	return (
		<div className="presenter-audience">
			<Button
				className="presenter-audience-open"
				variant="ghost"
				onClick={openAudience}
				aria-label="Open audience window"
				aria-describedby={statusId}
				title={connection.description}
				data-state={connection.state}
			>
				{connection.inSync ? <MonitorCheck /> : <MonitorOff />}
				<span className="presenter-audience-label">
					Audience
					<small
						className="presenter-audience-status"
						id={statusId}
						role="status"
					>
						{connection.status}
					</small>
				</span>
			</Button>
			{blocked && (
				<p className="presenter-audience-error" role="alert">
					Popup blocked. Allow popups and try again.
				</p>
			)}
		</div>
	);
}

function describeConnection(
	slug: string,
	slides: SlideDefinition[],
	windows: AudienceWindow[],
	supported: boolean
) {
	const connected = windows.length > 0;
	const inSync = connected && windows.every((peer) => peer.slug === slug);
	const slideNumbers = new Map(
		slides.map((slide, index) => [slide.slug, index + 1])
	);
	const displayed = [
		...new Set(windows.map((peer) => slideNumbers.get(peer.slug) ?? 'unknown')),
	].join(', ');
	let status = 'Sync unavailable';
	if (supported) {
		status = connected
			? `Slide ${displayed} · ${inSync ? 'in sync' : 'out of sync'}`
			: 'Disconnected';
	}
	const details = [`${status}.`];
	if (connected)
		details.push(
			`${windows.length} ${windows.length === 1 ? 'window' : 'windows'}.`
		);
	if (connected && !inSync)
		details.push(`Waiting for slide ${slideNumbers.get(slug) ?? 'unknown'}.`);
	details.push('Open audience window in the same browser on this device.');
	return {
		status,
		inSync,
		state: inSync ? 'synced' : connected ? 'pending' : 'disconnected',
		description: details.join(' '),
	};
}
