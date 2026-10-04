'use client';

import { useEffect } from 'react';
import { usePresentationStore } from '../../../core/store/presentation-store';
import { usePresenterStore } from '../state/presenter-store';

export function PresenterSession() {
	useEffect(() => {
		if (!usePresenterStore.persist.hasHydrated())
			usePresenterStore.persist.rehydrate();
		const timer = setInterval(() => usePresenterStore.getState().tick(), 1000);
		const unsubscribe = usePresentationStore.subscribe((state, previous) => {
			if (state.slug !== previous.slug)
				usePresenterStore.getState().visit(state.slug);
		});
		const pause = () => usePresenterStore.getState().pause();
		window.addEventListener('pagehide', pause);
		return () => {
			clearInterval(timer);
			unsubscribe();
			window.removeEventListener('pagehide', pause);
			pause();
		};
	}, []);
	return null;
}
