'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { usePresentation } from '../../../core/hooks';
import { useDeck } from '../../../core/layouts/deck-context';
import { DirectSlidePreview } from '../../preview/components/direct-slide-preview';
import { getGridSlideHref } from '../lib/grid-navigation';

// Define base dimensions that maintain 16:9 ratio
const SLIDE_BASE_WIDTH = 1280;
const SLIDE_BASE_HEIGHT = 720; // 16:9 ratio

function GridContent() {
	const { slides } = usePresentation();
	const { activeSlide } = useDeck();
	const pathname = usePathname();
	const ref = useSearchParams().get('ref');
	const closeSlide = slides[activeSlide] ?? slides[0];
	const closeHref = closeSlide
		? getGridSlideHref(closeSlide.slug, pathname, ref)
		: '/';

	return (
		<main className="min-h-screen bg-background p-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="font-bold text-2xl text-foreground">All Slides</h1>
				<Button asChild variant="ghost" size="icon" className="rounded-full">
					<Link href={closeHref} aria-label="Close grid view">
						<X className="size-5" />
					</Link>
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
				{slides.map((slide, index) => (
					<div
						key={slide.slug}
						className={cn(
							'relative overflow-hidden rounded-lg border-2 bg-card transition-transform focus-within:outline-2 focus-within:outline-ring focus-within:outline-offset-4 hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none',
							index === activeSlide
								? 'border-primary ring-2 ring-primary/50'
								: 'border-border'
						)}
					>
						{/* Keep preview controls out of the tab order and card link. */}
						<div
							inert
							aria-hidden="true"
							className="relative aspect-video w-full overflow-hidden bg-muted"
						>
							<DirectSlidePreview
								component={slide.component}
								baseWidth={SLIDE_BASE_WIDTH}
								baseHeight={SLIDE_BASE_HEIGHT}
								className="h-full w-full"
								centerContent={true}
								disablePointerEvents={true}
							/>
						</div>
						<Link
							href={getGridSlideHref(slide.slug, pathname, ref)}
							aria-label={`Slide ${index + 1}: ${slide.title}`}
							aria-current={index === activeSlide ? 'true' : undefined}
							className="flex items-start gap-3 border-border border-t px-4 py-3 text-foreground after:absolute after:inset-0 after:z-10 focus-visible:outline-none"
						>
							<span className="font-mono text-muted-foreground text-sm">
								{index + 1}
							</span>
							<span className="font-medium text-sm">{slide.title}</span>
						</Link>
					</div>
				))}
			</div>
		</main>
	);
}

export function GridPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-background p-8 text-muted-foreground">
					Loading slides...
				</div>
			}
		>
			<GridContent />
		</Suspense>
	);
}
