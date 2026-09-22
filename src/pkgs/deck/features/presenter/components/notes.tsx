'use client';

import { useHasHydrated, usePresentation } from '../../../core/hooks';
import { useTeleprompter } from '../hooks/use-teleprompter';
import { formatDuration } from '../lib/rehearsal';
import { usePresenterStore } from '../state/presenter-store';
import { NotesTextControls, TeleprompterControls } from './notes-controls';

export function Notes() {
	const hydrated = useHasHydrated();
	const { currentSlide: slide } = usePresentation();
	const fontSize = usePresenterStore((state) => state.fontSize);
	const wordsPerMinute = usePresenterStore((state) => state.wordsPerMinute);
	const prompter = useTeleprompter({
		slug: slide?.slug,
		ready: hydrated && !!slide,
		wordsPerMinute,
	});
	if (!hydrated || !slide)
		return <div className="presenter-loading">Loading notes…</div>;
	return (
		<section className="presenter-notes-panel" aria-label="Speaker notes">
			<div className="presenter-panel-header">
				<div className="presenter-eyebrow">
					Speaker notes{' '}
					<span>
						{slide.metadata?.duration
							? `· ${formatDuration(slide.metadata.duration)} target`
							: '· unscheduled'}
					</span>
				</div>
				<NotesTextControls />
			</div>
			<section
				id="presenter-note-script"
				className="presenter-notes-scroll"
				ref={prompter.scroll}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable notes must be reachable for keyboard scrolling.
				tabIndex={0}
				aria-label={`Notes for slide ${slide.slug}`}
				onWheel={prompter.pauseForInteraction}
				onTouchStart={prompter.pauseForInteraction}
				onPointerDown={prompter.pauseForInteraction}
				onKeyDown={(event) => {
					if (
						[
							' ',
							'ArrowUp',
							'ArrowDown',
							'PageUp',
							'PageDown',
							'Home',
							'End',
						].includes(event.key)
					) {
						event.stopPropagation();
						prompter.pauseForInteraction();
					}
				}}
			>
				<div
					className="presenter-script"
					ref={prompter.script}
					style={{ fontSize }}
				>
					{typeof slide.notes === 'string'
						? slide.notes
								.split(/\n{2,}/)
								.map((paragraph, index) => (
									<p key={`${slide.slug}-${index}`}>{paragraph}</p>
								))
						: slide.notes || (
								<p className="presenter-muted">
									No speaker notes for this slide.
								</p>
							)}
				</div>
			</section>
			<TeleprompterControls prompter={prompter} />
		</section>
	);
}
