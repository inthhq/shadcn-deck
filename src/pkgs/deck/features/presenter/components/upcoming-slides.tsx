'use client'; // Needs client for goToSlide interaction
import { notFound } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { cn } from '~/lib/utils';
import { useHasHydrated } from '../../../core/hooks';
import { getSlideDataByIndex } from '../../../core/services/slides-service';
import { usePresentationStore } from '../../../core/store/presentation-store';
import { DirectSlidePreview } from '../../preview/components/direct-slide-preview';

// Use consistent base dimensions for all slide previews
const SLIDE_BASE_WIDTH = 1280;
const SLIDE_BASE_HEIGHT = 720; // 16:9 ratio

// Fixed SlideThumbnail with proper scaling (same pattern as working grid)
function SlideThumbnail({
	slideInfo,
	onSelect,
}: {
	slideInfo: NonNullable<ReturnType<typeof getSlideDataByIndex>>;
	onSelect: (slug: string) => void;
}) {
	return (
		<div
			className={cn(
				'relative overflow-hidden rounded-md border border-border bg-background p-0 shadow-sm transition-all hover:shadow-md',
				'hover:border-primary hover:bg-muted/50'
			)}
		>
			{/* Same pattern as working grid */}
			<div className="relative aspect-video w-full overflow-hidden" inert>
				<DirectSlidePreview
					component={slideInfo.component}
					disablePointerEvents={true}
					baseWidth={SLIDE_BASE_WIDTH}
					baseHeight={SLIDE_BASE_HEIGHT}
					className="h-full w-full"
					centerContent={true}
					prioritizeWidth={true}
				/>
				<div className="absolute right-1 bottom-1 z-10 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground shadow-sm">
					{slideInfo.slug}
				</div>
			</div>
			<button
				type="button"
				onClick={() => onSelect(slideInfo.slug)}
				className="absolute inset-0 z-20 cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px]"
				aria-label={`Go to slide ${slideInfo.slug}: ${slideInfo.title}`}
				title={`Go to slide ${slideInfo.slug}: ${slideInfo.title}`}
			/>
		</div>
	);
}

export function UpcomingSlides() {
	// Use Zustand store directly
	const { slug: currentSlug, goToSlide, slides } = usePresentationStore();
	const hasHydrated = useHasHydrated();

	// Use callback to avoid recreation on each render
	const handleThumbnailClick = useCallback(
		(slug: string) => {
			// Find the index of the clicked slide
			const slideIndex = slides.findIndex((def) => def.slug === slug);
			if (slideIndex !== -1) {
				goToSlide(slideIndex);
			}
		},
		[goToSlide, slides]
	);

	// Use useMemo for computations to avoid recalculations on each render
	const { upcomingSlidesData, slideCount } = useMemo(() => {
		if (!hasHydrated) {
			return { upcomingSlidesData: [], slideCount: 0 };
		}
		// Find current slide index
		const currentSlideIndex = slides.findIndex(
			(def) => def.slug === currentSlug
		);

		if (currentSlideIndex === -1) {
			return { upcomingSlidesData: [], slideCount: 0 };
		}

		const totalSlides = slides.length;

		// Calculate upcoming slides, starting from index + 2 (skipping current and next)
		const upcomingSlideIndices = Array.from({ length: 6 })
			.map((_, i) => {
				const slideIndex = currentSlideIndex + i + 2; // Skip current and next slide
				return slideIndex < totalSlides ? slideIndex : null;
			})
			.filter((index) => index !== null) as number[];

		const slidesData = upcomingSlideIndices
			.map((index) => getSlideDataByIndex(index))
			.filter(Boolean) as NonNullable<ReturnType<typeof getSlideDataByIndex>>[];

		return { upcomingSlidesData: slidesData, slideCount: slidesData.length };
	}, [currentSlug, slides, hasHydrated]);

	if (!hasHydrated) {
		return null;
	}

	// Early return if no valid slide
	if (!currentSlug) {
		notFound();
	}

	return (
		<Card className="flex-1 overflow-y-auto">
			<CardHeader>
				<CardTitle className="flex items-center text-sm">
					<span className="mr-2 rounded-full bg-primary/15 px-2 py-0.5 text-primary text-xs">
						Upcoming
					</span>
					<span className="font-medium">{slideCount} slides</span>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Add a key to force re-render when slide changes */}
				<div key={`upcoming-${currentSlug}`} className="grid grid-cols-2 gap-3">
					{upcomingSlidesData.map((slideInfo) => (
						<SlideThumbnail
							key={`thumbnail-${slideInfo.slug}`}
							slideInfo={slideInfo}
							onSelect={handleThumbnailClick}
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
