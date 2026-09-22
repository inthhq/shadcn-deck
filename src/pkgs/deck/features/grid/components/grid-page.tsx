'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { useDeck } from '../../../core/layouts/deck-context';
import { usePresentation } from '../../../core/hooks';
import type { SlideDefinition } from '../../../core/types/types';
import { DirectSlidePreview } from '../../preview/components/direct-slide-preview';

// Define base dimensions that maintain 16:9 ratio
const SLIDE_BASE_WIDTH = 1280;
const SLIDE_BASE_HEIGHT = 720; // 16:9 ratio

export function GridPage() {
	const { slides } = usePresentation();
	const { activeSlide, goToSlide } = useDeck();
	const router = useRouter();

	// Handle closing grid view
	const handleClose = useCallback(() => {
		const params = new URLSearchParams(window.location.search);
		const ref = params.get('ref');
		router.push(ref ? `/ref/${ref}/1` : '/1');
	}, [router]);

	return (
		<div className="min-h-screen bg-background p-8">
			{/* Header */}
			<div className="mb-6 flex items-center justify-between">
				<h2 className="font-bold text-2xl text-foreground">All Slides</h2>
				<Button
					onClick={handleClose}
					variant="ghost"
					size="icon"
					className="rounded-full"
					aria-label="Close grid view"
				>
					<X className="size-5" />
				</Button>
			</div>

			{/* Grid - exactly like test demo */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
				{slides.map((slide: SlideDefinition, index: number) => (
					// biome-ignore lint/a11y/noStaticElementInteractions: we get hydration errors otherwise
					// biome-ignore lint/a11y/useKeyWithClickEvents: we get hydration errors otherwise
					<div
						key={index}
						// type="button"
						className={cn(
							'cursor-pointer overflow-hidden rounded-lg border-2 p-0 transition-all hover:scale-105',
							index === activeSlide
								? 'border-primary ring-2 ring-primary/50'
								: 'border-border'
						)}
						onClick={() => {
							goToSlide(index);
							handleClose();
						}}
					>
						{/* Exact same pattern as working test demo */}
						<div className="relative aspect-video w-full overflow-hidden bg-gray-100">
							<DirectSlidePreview
								component={slide.component}
								baseWidth={SLIDE_BASE_WIDTH}
								baseHeight={SLIDE_BASE_HEIGHT}
								className="h-full w-full"
								centerContent={true}
								disablePointerEvents={true}
							/>
							{/* Slide number overlay */}
							<div className="absolute right-2 bottom-1 z-10 rounded-sm bg-background/80 px-2 py-0.5 text-foreground text-xs">
								{index + 1}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
