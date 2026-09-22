'use client';

import { useEffect } from 'react';
import { usePresentationStore } from '../../../core/store/presentation-store';
import { DirectSlidePreview } from './direct-slide-preview';

export function SlidePageWrapper({ slug }: { slug: string }) {
	const { slides, setSlug, isServicesInitialized } = usePresentationStore();
	const slide = slides.find((s) => s.slug === slug);

	// Reconcile only when the URL changes. Reacting to the store's optimistic
	// update would put the previous URL back while navigation is still pending.
	useEffect(() => {
		if (
			isServicesInitialized &&
			usePresentationStore.getState().slug !== slug
		) {
			setSlug(slug);
		}
	}, [slug, isServicesInitialized, setSlug]);

	useEffect(() => {
		if (!isServicesInitialized || !slide) return;
		const service = usePresentationStore.getState().syncService;
		service?.reportDisplayed(slug);
		return () => service?.reportDisplayed(null);
	}, [slug, slide, isServicesInitialized]);

	if (!slide) {
		return null;
	}

	return (
		<DirectSlidePreview
			component={slide.component}
			baseWidth={1280}
			baseHeight={720}
			className="h-full w-full"
			centerContent={true}
		/>
	);
}
