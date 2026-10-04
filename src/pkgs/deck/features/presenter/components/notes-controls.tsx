import {
	Maximize2,
	Minimize2,
	Minus,
	Pause,
	Play,
	Plus,
	RotateCcw,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import type { useTeleprompter } from '../hooks/use-teleprompter';
import { usePresenterStore } from '../state/presenter-store';

type Prompter = ReturnType<typeof useTeleprompter>;

export function NotesTextControls() {
	const fontSize = usePresenterStore((state) => state.fontSize);
	const expanded = usePresenterStore((state) => state.notesExpanded);
	const setFontSize = usePresenterStore((state) => state.setFontSize);
	const toggleNotes = usePresenterStore((state) => state.toggleNotes);
	return (
		<div className="presenter-text-controls">
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setFontSize(fontSize - 2)}
				disabled={fontSize <= 18}
				aria-label="Decrease notes text size"
			>
				<Minus />
			</Button>
			<output aria-label="Notes text size">{fontSize}</output>
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setFontSize(fontSize + 2)}
				disabled={fontSize >= 40}
				aria-label="Increase notes text size"
			>
				<Plus />
			</Button>
			<span className="presenter-control-divider" />
			<Button
				variant="ghost"
				size="icon"
				onClick={toggleNotes}
				aria-expanded={expanded}
				aria-controls="presenter-notes"
				aria-label={expanded ? 'Restore slide previews' : 'Expand notes'}
			>
				{expanded ? <Minimize2 /> : <Maximize2 />}
			</Button>
		</div>
	);
}

export function TeleprompterControls({ prompter }: { prompter: Prompter }) {
	const wordsPerMinute = usePresenterStore((state) => state.wordsPerMinute);
	const setWordsPerMinute = usePresenterStore(
		(state) => state.setWordsPerMinute
	);
	return (
		<section className="presenter-prompter" aria-label="Teleprompter controls">
			<Button
				variant="ghost"
				onClick={prompter.toggle}
				disabled={!prompter.overflowing}
				aria-controls="presenter-note-script"
				aria-label={
					prompter.playing
						? 'Pause auto-scroll'
						: prompter.atEnd
							? 'Restart auto-scroll'
							: 'Start auto-scroll'
				}
			>
				{prompter.playing ? (
					<Pause />
				) : prompter.atEnd ? (
					<RotateCcw />
				) : (
					<Play />
				)}
				{prompter.playing
					? 'Pause scroll'
					: prompter.atEnd
						? 'Restart scroll'
						: 'Auto-scroll'}
			</Button>
			<span className="presenter-prompter-hint">
				{describeScrollState(prompter)}
			</span>
			<label className="presenter-prompter-pace">
				<span className="sr-only">Speaking pace</span>
				<select
					value={wordsPerMinute}
					onChange={(event) => setWordsPerMinute(Number(event.target.value))}
				>
					{Array.from({ length: 15 }, (_, index) => 80 + index * 10).map(
						(pace) => (
							<option key={pace} value={pace}>
								{pace} wpm
							</option>
						)
					)}
				</select>
			</label>
		</section>
	);
}

function describeScrollState(prompter: Prompter) {
	if (!prompter.overflowing) return 'Notes fit on screen';
	if (prompter.playing) return 'Scroll by hand to pause';
	if (prompter.atEnd) return 'Bottom reached';
	if (prompter.paused) return 'Paused · resume when ready';
	return 'Start when ready';
}
