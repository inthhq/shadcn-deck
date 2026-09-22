'use client';

import { ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import { useHasHydrated, usePresentation } from '../../../core/hooks';
import { usePresenterStore } from '../state/presenter-store';
import { AudienceStatus } from './audience-status';
import { RehearsalHistory } from './rehearsal-history';
import { TimingControls } from './timing-controls';

export function Controls() {
	const hydrated = useHasHydrated();
	const router = useRouter();
	const { currentSlug } = usePresentation();
	const { pause, reset, recovered, storageError } = usePresenterStore();
	const timingTrigger = useRef<HTMLButtonElement>(null);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [confirmReset, setConfirmReset] = useState(false);
	const exit = () => {
		pause();
		const prefix = window.location.pathname.match(/^\/(ref\/[^/]+)/)?.[0] ?? '';
		router.push(`${prefix}/${currentSlug}`);
	};
	if (!hydrated) return null;
	return (
		<>
			<div className="presenter-header-controls">
				<TimingControls
					triggerRef={timingTrigger}
					onHistory={() => setHistoryOpen(true)}
					onReset={() => setConfirmReset(true)}
				/>
				<AudienceStatus />
				<Button
					className="presenter-exit"
					variant="ghost"
					size="icon"
					onClick={exit}
					aria-label="Exit presenter view"
					title="Exit presenter view"
				>
					<ArrowUpRight />
				</Button>
			</div>
			{confirmReset && (
				<div className="presenter-notice" role="alert">
					<span>Reset this unfinished run? Saved rehearsals are kept.</span>
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
							reset();
							setConfirmReset(false);
						}}
					>
						Reset run
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => setConfirmReset(false)}
					>
						Keep run
					</Button>
				</div>
			)}
			{recovered && (
				<div className="presenter-notice" role="status">
					Your unfinished rehearsal was restored, paused. Resume when you’re
					ready.
				</div>
			)}
			{storageError && (
				<div className="presenter-notice" role="alert">
					Browser storage is unavailable. Rehearsal results cannot be saved
					after refreshing.
				</div>
			)}
			<RehearsalHistory
				open={historyOpen}
				onClose={() => {
					setHistoryOpen(false);
					timingTrigger.current?.focus();
				}}
			/>
		</>
	);
}
