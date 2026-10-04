'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCallback, useMemo } from 'react';
import { getSlideDataBySlug } from '../services/slides-service';
import { usePresentationStore } from '../store/presentation-store';

/**
 * Hook that extends the presentation store with presenter-specific functionality
 * This provides compatibility with components that previously used usePresentationContext
 */
export function usePresentation() {
	const pathname = usePathname();
	const { theme, setTheme } = useTheme();

	// Base store state
	const {
		slug,
		activeSlide: currentSlideIndex,
		totalSlides,
		isFirstSlide,
		isLastSlide,
		slides,
		goToNextSlide: baseGoToNextSlide,
		goToPreviousSlide: baseGoToPreviousSlide,
	} = usePresentationStore();

	// Toggle theme using next-themes
	const toggleTheme = useCallback(() => {
		setTheme(theme === 'dark' ? 'light' : 'dark');
	}, [theme, setTheme]);

	// Detect presenter mode
	const isPresenterMode = useMemo(
		() => pathname.includes('/presenter'),
		[pathname]
	);

	// Get slide data
	const currentSlide = useMemo(() => getSlideDataBySlug(slug) || null, [slug]);
	const nextSlide = useMemo(() => {
		return isLastSlide ? null : slides[currentSlideIndex + 1];
	}, [isLastSlide, currentSlideIndex, slides]);
	const previousSlide = useMemo(() => {
		return isFirstSlide ? null : slides[currentSlideIndex - 1];
	}, [isFirstSlide, currentSlideIndex, slides]);

	// All controls share the store's navigation path, including sync broadcasts.
	const goToSlide = useCallback(
		(slug: string) => {
			const index = slides.findIndex((slide) => slide.slug === slug);
			if (index >= 0) usePresentationStore.getState().goToSlide(index);
		},
		[slides]
	);
	const navigateInPresenterMode = goToSlide;
	const goToNextSlide = baseGoToNextSlide;
	const goToPreviousSlide = baseGoToPreviousSlide;

	// Notes accessor
	const getSlideNotes = useCallback((slug: string) => {
		const slide = getSlideDataBySlug(slug);
		return slide?.notes || '';
	}, []);

	return {
		// Basic slide info
		currentSlug: slug,
		currentSlideIndex,
		totalSlides,
		isFirstSlide,
		isLastSlide,

		// Slide data
		slides: slides,
		currentSlide,
		nextSlide,
		previousSlide,

		// Navigation
		goToSlide,
		goToNextSlide,
		goToPreviousSlide,

		// Theme
		theme,
		setTheme,
		toggleTheme,

		// Presenter mode
		isPresenterMode,
		navigateInPresenterMode,

		// Helpers
		getSlideDataBySlug,
		getSlideNotes,
	};
}
