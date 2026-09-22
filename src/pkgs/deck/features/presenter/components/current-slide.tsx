'use client';
import { useParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useHasHydrated } from '../../../core/hooks';
import { getSlideDataBySlug } from '../../../core/services/slides-service';
import { usePresentationStore } from '../../../core/store/presentation-store';
import type { SlideDefinition } from '../../../core/types/types';
import { DirectSlidePreview } from '../../preview/components/direct-slide-preview';

// Separate the slide preview for better organization
function SlidePreview({ slide }: { slide: SlideDefinition }) {
	return (
		<DirectSlidePreview
			component={slide.component}
			baseWidth={1280}
			baseHeight={720}
			fullWidthAutoHeight
		/>
	);
}

export function CurrentSlide() {
	const params = useParams();
	const { slug, setSlug, isServicesInitialized } = usePresentationStore();
	const hasHydrated = useHasHydrated();
	const urlSlug = params?.slug as string;

	// The URL is authoritative once navigation commits; do not roll back an
	// optimistic store update while the old route is still rendering.
	useEffect(() => {
		if (
			hasHydrated &&
			isServicesInitialized &&
			urlSlug &&
			usePresentationStore.getState().slug !== urlSlug
		) {
			// Browser back/forward and directly opened presenter URLs are navigation
			// too. Synced commands already changed the store, so they do not echo.
			setSlug(urlSlug, {
				direction: 'direct',
				fromSlug: usePresentationStore.getState().slug,
				toSlug: urlSlug,
				timestamp: Date.now(),
			});
		}
	}, [urlSlug, isServicesInitialized, hasHydrated, setSlug]);

	// Get the current slide ID either from the Zustand store or URL params
	const currentSlug = hasHydrated ? slug || urlSlug : null;

	// Use useMemo for slide data to avoid redundant calls
	const slide = useMemo(() => {
		if (!currentSlug) return null;
		return getSlideDataBySlug(currentSlug) || null;
	}, [currentSlug]);

	if (!slide || !hasHydrated) {
		return (
			<div className="flex aspect-video w-full items-center justify-center">
				<div className="text-muted-foreground">Loading slide...</div>
			</div>
		);
	}

	return <SlidePreview slide={slide} />;
}
