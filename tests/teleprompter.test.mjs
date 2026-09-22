import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	advanceReadingWords,
	readingTop,
	wordsAtTop,
} from '../src/pkgs/deck/features/presenter/lib/teleprompter.ts';

test('the same speaking time advances equally with smooth or delayed frames', () => {
	const play = (timestamps) => {
		let words = 0;
		let previous = null;
		for (const now of timestamps) {
			words = advanceReadingWords(words, previous, now, 130);
			previous = now;
		}
		return words;
	};
	const smooth = play(
		Array.from({ length: 3601 }, (_, frame) => (frame * 60000) / 3600)
	);
	const delayed = play([0, 16, 1016, 15000, 15500, 60000]);
	assert.ok(Math.abs(smooth - 130) < 1e-8);
	assert.ok(Math.abs(delayed - 130) < 1e-8);
});

test('starting or resuming excludes time before the first frame', () => {
	assert.equal(advanceReadingWords(20, null, 60000, 130), 20);
	assert.equal(advanceReadingWords(20, 60000, 90000, 130), 85);
	assert.equal(advanceReadingWords(85, null, 150000, 130), 85);
});

// A short first line, a longer second line and a paragraph gap.
const stops = [
	{ word: 0, top: 40 },
	{ word: 4, top: 80 },
	{ word: 16, top: 160 },
	{ word: 24, top: 200 },
];

test('reading pace follows word density and paragraph spacing rather than a fixed pixel speed', () => {
	assert.equal(readingTop(stops, 2), 60);
	assert.equal(readingTop(stops, 10), 120);
	assert.equal(readingTop(stops, 20), 180);
	assert.equal(readingTop(stops, 100), 200);
});

test('manual resume maps a position back to the same word after reflow', () => {
	const words = wordsAtTop(stops, 120);
	assert.equal(words, 10);
	const narrower = [
		{ word: 0, top: 40 },
		{ word: 4, top: 80 },
		{ word: 10, top: 120 },
		{ word: 16, top: 200 },
		{ word: 24, top: 280 },
	];
	assert.equal(readingTop(narrower, words), 120);
	assert.equal(wordsAtTop(stops, -20), 0);
	assert.equal(wordsAtTop(stops, 500), 24);
	assert.equal(readingTop([], 10), 0);
	assert.equal(wordsAtTop([], 10), 0);
});
