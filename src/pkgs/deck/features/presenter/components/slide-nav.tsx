'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { useHasHydrated, usePresentation } from '../../../core/hooks';
import { isAppendix } from '../lib/rehearsal';

export function SlideNav() {
	const hydrated = useHasHydrated();
	const {
		slides,
		currentSlide,
		goToNextSlide,
		goToPreviousSlide,
		isFirstSlide,
		isLastSlide,
	} = usePresentation();
	const main = slides.filter((slide) => !isAppendix(slide));
	const appendix = slides.filter(isAppendix);
	const inAppendix = currentSlide ? isAppendix(currentSlide) : false;
	const group = inAppendix ? appendix : main;
	const index = group.findIndex((slide) => slide.slug === currentSlide?.slug);
	const progress = group.length ? ((index + 1) / group.length) * 100 : 0;
	if (!hydrated) return null;
	return (
		<nav className="presenter-slide-nav" aria-label="Slide navigation">
			<div className="presenter-nav-buttons">
				<Button
					variant="ghost"
					size="icon"
					onClick={goToPreviousSlide}
					disabled={isFirstSlide}
					aria-label="Previous slide"
					title="Previous slide (←)"
				>
					<ChevronLeft />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					onClick={goToNextSlide}
					disabled={isLastSlide}
					aria-label="Next slide"
					title="Next slide (→)"
				>
					<ChevronRight />
				</Button>
			</div>
			<div className="presenter-slide-location">
				<span className="presenter-slide-count">
					{inAppendix ? 'Appendix' : 'Talk'} {Math.max(0, index + 1)}{' '}
					<span>/ {group.length}</span>
				</span>
				<span
					className="presenter-section-name"
					title={currentSlide?.metadata?.tags?.[0]}
				>
					{currentSlide?.metadata?.tags?.[0]}
				</span>
			</div>
			<div
				className="presenter-nav-progress"
				role="progressbar"
				aria-label={inAppendix ? 'Appendix progress' : 'Main talk progress'}
				aria-valuemin={0}
				aria-valuemax={group.length}
				aria-valuenow={Math.max(0, index + 1)}
			>
				<span style={{ width: `${progress}%` }} />
			</div>
		</nav>
	);
}
