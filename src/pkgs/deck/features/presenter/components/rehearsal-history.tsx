'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import { formatDuration } from '../lib/rehearsal';
import { usePresenterStore } from '../state/presenter-store';

export function RehearsalHistory({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const dialog = useRef<HTMLDialogElement>(null);
	const history = usePresenterStore((state) => state.history);
	const active = usePresenterStore((state) => state.run);
	const storageError = usePresenterStore((state) => state.storageError);
	const [selectedId, setSelectedId] = useState('');
	useEffect(() => {
		if (open) dialog.current?.showModal();
		else dialog.current?.close();
	}, [open]);
	const runs = active ? [active, ...history] : history;
	const selected = runs.find((run) => run.id === selectedId) ?? runs[0];
	const visited =
		selected?.plan.filter((slide) => (selected.timings[slide.slug] ?? 0) > 0) ??
		[];
	const over = visited.filter(
		(slide) =>
			slide.duration > 0 &&
			Math.floor((selected?.timings[slide.slug] ?? 0) / 1000) > slide.duration
	);
	return (
		<dialog
			ref={dialog}
			className="presenter-history"
			onClose={onClose}
			aria-labelledby="rehearsal-title"
		>
			<div className="presenter-history-header">
				<div>
					<span className="presenter-eyebrow">Practice, then refine</span>
					<h2 id="rehearsal-title">Rehearsal feedback</h2>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					aria-label="Close rehearsal feedback"
				>
					<X />
				</Button>
			</div>
			<p className="presenter-muted">
				{storageError
					? 'Browser storage is unavailable. These results will not survive a refresh.'
					: 'Saved on this browser. Your current run and the last 10 finished rehearsals are kept.'}
			</p>
			{selected ? (
				<>
					<label className="presenter-run-picker">
						Rehearsal
						<select
							value={selected.id}
							onChange={(event) => setSelectedId(event.target.value)}
						>
							{runs.map((run) => (
								<option key={run.id} value={run.id}>
									{run.finishedAt
										? new Date(run.startedAt).toLocaleString([], {
												dateStyle: 'medium',
												timeStyle: 'short',
											})
										: 'Current run (unfinished)'}{' '}
									· {formatDuration(run.elapsedMs / 1000)}
								</option>
							))}
						</select>
					</label>
					<div className="presenter-rehearsal-stats">
						<div>
							<strong>{formatDuration(selected.elapsedMs / 1000)}</strong>
							<span>Total speaking time</span>
						</div>
						<div>
							<strong>
								{visited.length} / {selected.plan.length}
							</strong>
							<span>Slides timed, including appendix</span>
						</div>
						<div>
							<strong>{over.length}</strong>
							<span>Over their target</span>
						</div>
					</div>
					<p className="presenter-muted">
						Started on slide{' '}
						{selected.plan.findIndex(
							(slide) => slide.slug === selected.startSlug
						) + 1}
						. Revisits are added together; skipped slides remain untimed.
					</p>
					<section
						className="presenter-history-table-wrap"
						// biome-ignore lint/a11y/noNoninteractiveTabindex: The overflow table needs keyboard scrolling on small screens.
						tabIndex={0}
						aria-label="Per-slide rehearsal timings"
					>
						<table className="presenter-history-table">
							<thead>
								<tr>
									<th scope="col">Slide</th>
									<th scope="col">Target</th>
									<th scope="col">Actual</th>
									<th scope="col">Difference</th>
								</tr>
							</thead>
							<tbody>
								{selected.plan.map((slide, index) => {
									const ms = selected.timings[slide.slug] ?? 0;
									const difference = Math.floor(ms / 1000) - slide.duration;
									return (
										<tr
											key={slide.slug}
											data-over={ms > 0 && slide.duration > 0 && difference > 0}
										>
											<th scope="row">
												<span>{String(index + 1).padStart(2, '0')}</span>
												{slide.title}
												{slide.appendix && <small>Appendix</small>}
											</th>
											<td>
												{slide.duration > 0
													? formatDuration(slide.duration)
													: 'Unscheduled'}
											</td>
											<td>{ms > 0 ? formatDuration(ms / 1000) : '—'}</td>
											<td>
												{ms === 0
													? 'Not timed'
													: slide.duration === 0
														? 'No target'
														: difference === 0
															? 'On target'
															: `${difference > 0 ? '+' : '−'}${formatDuration(difference)}`}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</section>
				</>
			) : (
				<div className="presenter-history-empty">
					<h3>Your first rehearsal starts here.</h3>
					<p>
						Start the timer and move through the deck. Finish & save to review
						each slide against its target.
					</p>
				</div>
			)}
		</dialog>
	);
}
