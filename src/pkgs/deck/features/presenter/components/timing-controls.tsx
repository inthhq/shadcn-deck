import {
	History,
	MoreHorizontal,
	Pause,
	Play,
	RotateCcw,
	Square,
} from 'lucide-react';
import { type RefObject, useId, useRef } from 'react';
import { Button } from '~/components/ui/button';
import { usePresentation } from '../../../core/hooks';
import { useTimer } from '../hooks/use-timer';
import { formatDuration, isAppendix } from '../lib/rehearsal';
import { usePresenterStore } from '../state/presenter-store';

export function TimingControls({
	triggerRef,
	onHistory,
	onReset,
}: {
	triggerRef: RefObject<HTMLButtonElement | null>;
	onHistory: () => void;
	onReset: () => void;
}) {
	const { currentSlug, currentSlide, slides } = usePresentation();
	const {
		run,
		isRunning,
		remaining,
		plannedSeconds,
		formattedTime,
		pace,
		slideSeconds,
	} = useTimer();
	const { start, pause, finish } = usePresenterStore();
	const timingMenuId = useId();
	const timingMenu = useRef<HTMLDivElement>(null);
	const appendix = currentSlide ? isAppendix(currentSlide) : false;
	const roundedPace = Math.round(pace ?? 0);
	const paceLabel = describePace(!!run, pace, plannedSeconds);
	const slideTarget = currentSlide?.metadata?.duration;
	const hasSlideTarget =
		slideTarget !== undefined &&
		Number.isFinite(slideTarget) &&
		slideTarget > 0;
	const startSlideNumber = run
		? run.plan.findIndex((slide) => slide.slug === run.startSlug) + 1
		: 0;
	const toggleLabel = isRunning
		? 'Pause rehearsal'
		: run
			? 'Resume rehearsal'
			: 'Start rehearsal';
	return (
		<section className="presenter-pacing" aria-label="Talk timing">
			<TimerSummary
				remaining={remaining}
				plannedSeconds={plannedSeconds}
				formattedTime={formattedTime}
				hasRun={!!run}
				isRunning={isRunning}
				paceLabel={paceLabel}
				roundedPace={roundedPace}
			/>
			<Button
				variant="ghost"
				size="icon"
				onClick={() => (isRunning ? pause() : start(currentSlug, slides))}
				disabled={!currentSlide}
				aria-label={toggleLabel}
				title={toggleLabel}
				data-running={isRunning}
			>
				{isRunning ? <Pause /> : <Play />}
			</Button>
			<Button
				ref={triggerRef}
				className="presenter-timing-trigger"
				variant="ghost"
				size="icon"
				popoverTarget={timingMenuId}
				aria-label="Timing and rehearsal options"
				title="Timing and rehearsal options"
			>
				<MoreHorizontal />
			</Button>
			<div
				ref={timingMenu}
				id={timingMenuId}
				popover="auto"
				className="presenter-timing-popover"
				role="dialog"
				aria-label="Timing and rehearsal"
			>
				<h2>Timing &amp; rehearsal</h2>
				<p className="presenter-menu-pace" data-behind={roundedPace > 3}>
					{paceLabel}
				</p>
				<dl className="presenter-timing-details">
					<div>
						<dt>Elapsed</dt>
						<dd>{formattedTime}</dd>
					</div>
					<div>
						<dt>{appendix ? 'Appendix slide' : 'This slide'}</dt>
						<dd>{formatDuration(slideSeconds)}</dd>
					</div>
					<div>
						<dt>Slide target</dt>
						<dd>
							{hasSlideTarget ? formatDuration(slideTarget) : 'Unscheduled'}
						</dd>
					</div>
				</dl>
				{run && startSlideNumber > 0 && (
					<p className="presenter-timing-origin">
						Plan measured from slide {startSlideNumber}
						{!isRunning ? ' · paused' : ''}
					</p>
				)}
				<div className="presenter-timing-options">
					<Button
						variant="ghost"
						disabled={!run}
						onClick={() => {
							finish();
							timingMenu.current?.hidePopover();
							onHistory();
						}}
					>
						<Square />
						Finish &amp; save rehearsal
					</Button>
					<Button
						variant="ghost"
						onClick={() => {
							timingMenu.current?.hidePopover();
							onHistory();
						}}
					>
						<History />
						Rehearsal history
					</Button>
					<Button
						variant="ghost"
						disabled={!run}
						onClick={() => {
							timingMenu.current?.hidePopover();
							onReset();
						}}
					>
						<RotateCcw />
						Reset current rehearsal
					</Button>
				</div>
			</div>
		</section>
	);
}

function TimerSummary({
	remaining,
	plannedSeconds,
	formattedTime,
	hasRun,
	isRunning,
	paceLabel,
	roundedPace,
}: {
	remaining: number | null;
	plannedSeconds: number | null;
	formattedTime: string;
	hasRun: boolean;
	isRunning: boolean;
	paceLabel: string;
	roundedPace: number;
}) {
	const overtime = remaining !== null && remaining < 0;
	return (
		<div className="presenter-timer-summary" title={paceLabel}>
			<div className="presenter-time-readout">
				<strong data-overtime={overtime}>
					{overtime ? '+' : ''}
					{remaining === null
						? formattedTime
						: formatDuration(remaining > 0 ? Math.ceil(remaining) : remaining)}
				</strong>
				<span>
					{remaining === null ? 'elapsed' : overtime ? 'over' : 'left'}
				</span>
			</div>
			<span className="presenter-pace-summary" data-behind={roundedPace > 3}>
				{!hasRun
					? plannedSeconds === null
						? 'No planned duration'
						: `${formatDuration(plannedSeconds)} planned`
					: !isRunning
						? 'Paused'
						: paceLabel.replace(' seconds', 's')}
			</span>
		</div>
	);
}

function describePace(
	hasRun: boolean,
	pace: number | null,
	plannedSeconds: number | null
) {
	if (plannedSeconds === null) return 'No planned duration';
	if (!hasRun) return 'Ready when you are';
	if (pace === null) return 'Outside the talk plan';
	const rounded = Math.round(pace);
	const magnitude = Math.abs(rounded);
	if (magnitude <= 3) return 'On pace';
	const duration =
		magnitude < 60 ? `${magnitude} seconds` : formatDuration(rounded);
	return `${duration} ${rounded > 0 ? 'behind' : 'ahead'}`;
}
