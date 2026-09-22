'use client';

import {
	type CSSProperties,
	type PointerEvent,
	type ReactNode,
	useRef,
} from 'react';
import { usePresenterStore } from '../state/presenter-store';

export function NotesWorkspace({
	notes,
	currentSlide,
	nextSlide,
}: {
	notes: ReactNode;
	currentSlide: ReactNode;
	nextSlide: ReactNode;
}) {
	const width = usePresenterStore((state) => state.notesWidth);
	const expanded = usePresenterStore((state) => state.notesExpanded);
	const setWidth = usePresenterStore((state) => state.setNotesWidth);
	const container = useRef<HTMLDivElement>(null);
	const finishResize = (event: PointerEvent<HTMLDivElement>) => {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
	};
	const resize = (event: PointerEvent<HTMLDivElement>) => {
		if (
			!event.currentTarget.hasPointerCapture(event.pointerId) ||
			!container.current
		)
			return;
		const bounds = container.current.getBoundingClientRect();
		setWidth(((event.clientX - bounds.left) / bounds.width) * 100);
	};
	return (
		<div
			ref={container}
			className="presenter-workspace"
			data-expanded={expanded}
			style={{ '--notes-width': `${width}%` } as CSSProperties}
		>
			<div id="presenter-notes" className="presenter-notes-column">
				{notes}
			</div>
			{/* biome-ignore lint/a11y/useSemanticElements: An adjustable window splitter needs a focusable separator, not a thematic break. */}
			<div
				className="presenter-resizer"
				role="separator"
				tabIndex={0}
				aria-label="Resize speaker notes"
				aria-orientation="vertical"
				aria-valuemin={35}
				aria-valuemax={75}
				aria-valuenow={Math.round(width)}
				aria-controls="presenter-notes"
				onPointerDown={(event) => {
					event.preventDefault();
					event.currentTarget.setPointerCapture(event.pointerId);
				}}
				onPointerMove={resize}
				onPointerUp={finishResize}
				onPointerCancel={finishResize}
				onLostPointerCapture={finishResize}
				onKeyDown={(event) => {
					if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
						event.preventDefault();
						event.stopPropagation();
						setWidth(width + (event.key === 'ArrowRight' ? 2 : -2));
					} else if (event.key === 'Home' || event.key === 'End') {
						event.preventDefault();
						setWidth(event.key === 'Home' ? 35 : 75);
					}
				}}
			>
				<span />
			</div>
			<aside className="presenter-previews" aria-label="Slide previews">
				<section className="presenter-preview-panel">
					<div className="presenter-eyebrow">
						<span className="presenter-live-dot" />
						Current slide
					</div>
					<div className="presenter-slide-preview">{currentSlide}</div>
				</section>
				{nextSlide}
			</aside>
		</div>
	);
}
