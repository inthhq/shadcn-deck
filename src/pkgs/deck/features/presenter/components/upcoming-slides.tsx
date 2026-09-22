'use client';

import { ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { useHasHydrated, usePresentation } from '../../../core/hooks';
import { formatDuration, isAppendix } from '../lib/rehearsal';

export function UpcomingSlides() {
	const hydrated = useHasHydrated();
	const { slides, currentSlug, goToSlide } = usePresentation();
	const [query, setQuery] = useState('');
	const [jump, setJump] = useState('');
	const [error, setError] = useState('');
	const needle = query.trim().toLowerCase();
	const filtered = slides.filter((slide, index) =>
		`${index + 1} ${slide.slug} ${slide.title} ${slide.metadata?.tags?.join(' ') ?? ''}`
			.toLowerCase()
			.includes(needle)
	);
	const sections = [
		...new Set(filtered.map((slide) => slide.metadata?.tags?.[0] ?? 'Slides')),
	];
	const mainCount = slides.filter((slide) => !isAppendix(slide)).length;
	if (!hydrated) return null;
	return (
		<details className="presenter-outline">
			<summary>
				<div>
					<ChevronDown size={16} />
					<strong>Slide outline</strong>
					<span>
						{mainCount} talk slides
						{slides.length > mainCount &&
							` · ${slides.length - mainCount} appendix`}
					</span>
				</div>
				<span className="presenter-outline-summary-hint">
					Browse or jump to a slide
				</span>
			</summary>
			<div className="presenter-outline-tools">
				<label className="presenter-search">
					<Search size={16} />
					<input
						type="search"
						placeholder="Search titles or sections…"
						aria-label="Search slides"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
				</label>
				<form
					className="presenter-jump"
					onSubmit={(event) => {
						event.preventDefault();
						const slide = slides[Number(jump) - 1];
						if (slide) {
							goToSlide(slide.slug);
							setError('');
							setJump('');
						} else setError(`Enter a slide number from 1 to ${slides.length}.`);
					}}
				>
					<label htmlFor="presenter-jump">Slide</label>
					<input
						id="presenter-jump"
						aria-label="Jump to slide number"
						type="number"
						min={1}
						max={slides.length}
						required
						placeholder="#"
						value={jump}
						onChange={(event) => setJump(event.target.value)}
					/>
					<Button type="submit" variant="outline" size="sm">
						Go
					</Button>
				</form>
			</div>
			{error && (
				<p className="presenter-outline-error" role="alert">
					{error}
				</p>
			)}
			<div className="presenter-outline-list">
				{sections.map((section) => (
					<section
						className="presenter-outline-group"
						key={section}
						aria-label={section}
					>
						<h3>
							{section === 'Appendix' ? 'Appendix · for questions' : section}
						</h3>
						{filtered
							.filter(
								(slide) => (slide.metadata?.tags?.[0] ?? 'Slides') === section
							)
							.map((slide) => (
								<button
									type="button"
									key={slide.slug}
									className="presenter-outline-slide"
									aria-current={slide.slug === currentSlug ? 'step' : undefined}
									onClick={() => goToSlide(slide.slug)}
								>
									<span className="presenter-outline-number">
										{String(slides.indexOf(slide) + 1).padStart(2, '0')}
									</span>
									<span>{slide.title}</span>
									<span className="presenter-outline-duration">
										{formatDuration(slide.metadata?.duration ?? 0)}
									</span>
								</button>
							))}
					</section>
				))}
				{!filtered.length && (
					<p className="presenter-empty" role="status">
						No slides match “{query}”. Try a title, section or slide number.
					</p>
				)}
			</div>
		</details>
	);
}
