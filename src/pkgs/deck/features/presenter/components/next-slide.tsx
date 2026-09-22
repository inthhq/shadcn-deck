'use client';

import { useHasHydrated, usePresentation } from '../../../core/hooks';
import { DirectSlidePreview } from '../../preview/components/direct-slide-preview';
import { isAppendix } from '../lib/rehearsal';

export function NextSlide() {
	const hydrated = useHasHydrated();
	const { nextSlide, currentSlide, currentSlideIndex } = usePresentation();
	if (!hydrated) return null;
	return (
		<section className="presenter-preview-panel presenter-next-preview">
			<div className="presenter-preview-heading">
				<span className="presenter-eyebrow">
					Up next {nextSlide && `· ${currentSlideIndex + 2}`}
				</span>
				{nextSlide &&
					isAppendix(nextSlide) &&
					currentSlide &&
					!isAppendix(currentSlide) && (
						<span className="presenter-tag">Main talk complete</span>
					)}
			</div>
			{nextSlide ? (
				<>
					<p className="presenter-next-title">{nextSlide.title}</p>
					<div className="presenter-slide-preview" inert>
						<DirectSlidePreview
							component={nextSlide.component}
							baseWidth={1280}
							baseHeight={720}
							fullWidthAutoHeight
							disablePointerEvents
						/>
					</div>
				</>
			) : (
				<p className="presenter-empty">End of the deck. You’re all done.</p>
			)}
		</section>
	);
}
