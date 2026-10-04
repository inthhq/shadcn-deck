import assert from 'node:assert/strict';
import { test } from 'node:test';
import { animateProgress } from '../src/components/ui/progress-animation.ts';
import { observePromise } from '../src/lib/observe-promise.ts';

function deferred() {
	let resolve;
	let reject;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

function frameClock(t) {
	const requestDescriptor = Object.getOwnPropertyDescriptor(
		globalThis,
		'requestAnimationFrame'
	);
	const cancelDescriptor = Object.getOwnPropertyDescriptor(
		globalThis,
		'cancelAnimationFrame'
	);
	const frames = new Map();
	let nextId = 0;
	globalThis.requestAnimationFrame = (callback) => {
		frames.set(++nextId, callback);
		return nextId;
	};
	globalThis.cancelAnimationFrame = (id) => frames.delete(id);
	t.mock.method(performance, 'now', () => 0);
	t.after(() => {
		if (requestDescriptor)
			Object.defineProperty(
				globalThis,
				'requestAnimationFrame',
				requestDescriptor
			);
		else delete globalThis.requestAnimationFrame;
		if (cancelDescriptor)
			Object.defineProperty(
				globalThis,
				'cancelAnimationFrame',
				cancelDescriptor
			);
		else delete globalThis.cancelAnimationFrame;
	});
	return {
		frames,
		tick(timestamp) {
			const [id, callback] = frames.entries().next().value;
			frames.delete(id);
			callback(timestamp);
		},
	};
}

test('a current asynchronous result commits successfully', async () => {
	const job = deferred();
	const results = [];
	observePromise(job.promise, (value) => results.push(value), assert.fail);
	job.resolve('rendered SVG');
	await job.promise;
	assert.deepEqual(results, ['rendered SVG']);
});

test('a failed load settles through the fallback handler', async () => {
	const job = deferred();
	const failures = [];
	observePromise(job.promise, assert.fail, (error) =>
		failures.push(error.message)
	);
	job.reject(new Error('chunk unavailable'));
	await job.promise.catch(() => {});
	assert.deepEqual(failures, ['chunk unavailable']);
});

test('a stale result cannot replace a newer diagram or language', async () => {
	const previous = deferred();
	const next = deferred();
	const results = [];
	const cleanup = observePromise(
		previous.promise,
		(value) => results.push(value),
		assert.fail
	);
	cleanup();
	observePromise(next.promise, (value) => results.push(value), assert.fail);
	next.resolve('new content');
	await next.promise;
	previous.resolve('stale content');
	await previous.promise;
	assert.deepEqual(results, ['new content']);
});

test('unmounted consumers ignore both success and failure', async () => {
	const success = deferred();
	const failure = deferred();
	observePromise(success.promise, assert.fail, assert.fail)();
	observePromise(failure.promise, assert.fail, assert.fail)();
	success.resolve('unused');
	failure.reject(new Error('unused'));
	await Promise.allSettled([success.promise, failure.promise]);
});

test('cleanup cancels the latest recursive animation frame', (t) => {
	const clock = frameClock(t);
	const updates = [];
	const cleanup = animateProgress({
		from: 0,
		to: 100,
		duration: 100,
		onUpdate: (value) => updates.push(value),
	});
	clock.tick(25);
	clock.tick(50);
	assert.equal(clock.frames.size, 1);
	const lateFrame = [...clock.frames.values()][0];
	cleanup();
	assert.equal(clock.frames.size, 0);
	const updateCount = updates.length;
	lateFrame(75);
	assert.equal(updates.length, updateCount);
});

test('an interrupted animation can reverse from the current visible value', (t) => {
	const clock = frameClock(t);
	let visibleValue = 0;
	const update = (value) => {
		visibleValue = value;
	};
	const cleanup = animateProgress({
		from: 0,
		to: 100,
		duration: 100,
		onUpdate: update,
	});
	clock.tick(50);
	assert.equal(visibleValue, 75);
	cleanup();
	animateProgress({
		from: visibleValue,
		to: 0,
		duration: 100,
		onUpdate: update,
	});
	clock.tick(50);
	assert.equal(visibleValue, 18.75);
	clock.tick(100);
	assert.equal(visibleValue, 0);
	assert.equal(clock.frames.size, 0);
});

test('zero duration and unchanged values do not schedule a frame', (t) => {
	const clock = frameClock(t);
	const updates = [];
	animateProgress({
		from: 10,
		to: 20,
		duration: 0,
		onUpdate: (value) => updates.push(value),
	});
	animateProgress({ from: 20, to: 20, duration: 100, onUpdate: assert.fail });
	assert.deepEqual(updates, [20]);
	assert.equal(clock.frames.size, 0);
});
