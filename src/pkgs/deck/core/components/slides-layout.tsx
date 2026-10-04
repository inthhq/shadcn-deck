'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, Suspense, useCallback } from 'react';
import { UnifiedControls } from '../layouts/unified-controls';
import { useViewTransitions } from '../providers/view-transitions-provider';
import { usePresentationStore } from '../store/presentation-store';

function DynamicControls() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { startViewTransition } = useViewTransitions();
	const { isFullyReady } = usePresentationStore();

	const isPreview = searchParams.get('preview') === 'true';
	const showControls = isFullyReady && !isPreview;

	const handleGridButtonClick = useCallback(() => {
		startViewTransition(() => {
			const params = new URLSearchParams(window.location.search);
			const ref = params.get('ref');
			router.push(ref ? `/ref/${ref}/grid` : '/grid');
		});
	}, [router, startViewTransition]);

	if (!showControls) {
		return null;
	}

	return (
		<UnifiedControls
			showFullscreen
			showNavigation
			showProgress
			showGrid={true}
			showOverview={true}
			showStartButton={true}
			onGridButtonClick={handleGridButtonClick}
		/>
	);
}

export function SlidesLayout({ children }: { children: ReactNode }) {
	return (
		<>
			<div className="flex h-dvh w-screen flex-col items-center justify-center overflow-hidden bg-bg-black">
				{children}
			</div>
			<Suspense>
				<DynamicControls />
			</Suspense>
		</>
	);
}
