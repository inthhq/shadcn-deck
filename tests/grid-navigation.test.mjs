import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getGridSlideHref } from '../src/pkgs/deck/features/grid/lib/grid-navigation.ts';

test('links to the selected semantic slug rather than slide one', () => {
	assert.equal(
		getGridSlideHref('everything-slide', '/grid'),
		'/everything-slide'
	);
	assert.equal(getGridSlideHref('4', '/grid'), '/4');
});

test('preserves the ref in the current path', () => {
	assert.equal(
		getGridSlideHref('everything-slide', '/ref/review-123/grid'),
		'/ref/review-123/everything-slide'
	);
});

test('keeps an encoded path ref without double encoding it', () => {
	assert.equal(
		getGridSlideHref('everything-slide', '/ref/feature%2Fdemo/grid'),
		'/ref/feature%2Fdemo/everything-slide'
	);
});

test('uses the path ref ahead of a stale query ref', () => {
	assert.equal(
		getGridSlideHref('thank-you-slide', '/ref/current/grid', 'stale'),
		'/ref/current/thank-you-slide'
	);
});

test('supports and encodes legacy query refs as a single segment', () => {
	assert.equal(
		getGridSlideHref('everything-slide', '/grid', 'feature/demo'),
		'/ref/feature%2Fdemo/everything-slide'
	);
	assert.equal(
		getGridSlideHref('everything-slide', '/grid', ''),
		'/everything-slide'
	);
});

test('encodes reserved slug characters without creating extra path segments', () => {
	assert.equal(
		getGridSlideHref('chapter 1/2?', '/grid'),
		'/chapter%201%2F2%3F'
	);
});
