import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { observePrintReadiness } from '../src/pkgs/deck/features/print/lib/readiness.ts';

const cleanups = [];
afterEach(() => {
	for (const cleanup of cleanups.splice(0)) cleanup();
});
const flush = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
	let resolve;
	let reject;
	const promise = new Promise((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return { promise, resolve, reject };
}
function fixture() {
	let changed;
	let observerOptions;
	const original = globalThis.MutationObserver;
	globalThis.MutationObserver = class {
		constructor(callback) {
			changed = callback;
		}
		observe(_root, options) {
			observerOptions = options;
		}
		disconnect() {
			changed = () => {};
		}
	};
	cleanups.push(() => {
		globalThis.MutationObserver = original;
	});
	const fonts = Object.assign(new EventTarget(), { ready: Promise.resolve() });
	const backgroundLoads = new Map();
	const decodedBackgrounds = [];
	const root = {
		ownerDocument: {
			fonts,
			createElement(tagName) {
				assert.equal(tagName, 'img');
				return {
					src: '',
					decode() {
						decodedBackgrounds.push(this.src);
						return backgroundLoads.get(this.src) ?? Promise.resolve();
					},
				};
			},
		},
		busy: false,
		images: [],
		backgrounds: [],
		querySelector() {
			return this.busy ? {} : null;
		},
		querySelectorAll(selector) {
			if (selector === 'img') return this.images;
			assert.equal(selector, '[data-print-background-image]');
			return this.backgrounds.map((source) => ({
				getAttribute: () => source,
			}));
		},
	};
	const updates = [];
	const observe = () => {
		const stop = observePrintReadiness(root, (value) => updates.push(value));
		cleanups.push(stop);
		return stop;
	};
	return {
		root,
		fonts,
		updates,
		observe,
		backgroundLoads,
		decodedBackgrounds,
		get observerOptions() {
			return observerOptions;
		},
		changed: () => changed(),
	};
}

test('printing waits for fonts and decodes offscreen images eagerly', async () => {
	const f = fixture();
	const image = deferred();
	const font = deferred();
	f.fonts.ready = font.promise;
	f.root.images = [{ loading: 'lazy', decode: () => image.promise }];
	f.observe();
	assert.equal(f.root.images[0].loading, 'eager');
	image.resolve();
	await flush();
	assert.equal(f.updates.at(-1).ready, false);
	font.resolve();
	await flush();
	assert.deepEqual(f.updates.at(-1), { ready: true, failedImages: 0 });
});

test('busy diagrams and late images invalidate an earlier readiness check', async () => {
	const f = fixture();
	const first = deferred();
	f.root.images = [{ decode: () => first.promise }];
	f.observe();
	f.root.busy = true;
	f.changed();
	first.resolve();
	await flush();
	assert.equal(f.updates.at(-1).ready, false);
	const late = deferred();
	f.root.images.push({ decode: () => late.promise });
	f.root.busy = false;
	f.changed();
	await flush();
	assert.equal(f.updates.at(-1).ready, false);
	late.resolve();
	await flush();
	assert.equal(f.updates.at(-1).ready, true);
});

test('failed images are reported without permanently disabling printing', async () => {
	const f = fixture();
	f.root.images = [
		{ decode: () => Promise.reject(new Error('Missing asset')) },
	];
	f.observe();
	await flush();
	assert.deepEqual(f.updates.at(-1), { ready: true, failedImages: 1 });
});

test('slide backgrounds are decoded before printing', async () => {
	const f = fixture();
	const background = deferred();
	f.root.backgrounds = ['/images/slide background.png'];
	f.backgroundLoads.set('/images/slide background.png', background.promise);
	f.observe();
	await flush();
	assert.equal(f.updates.at(-1).ready, false);
	assert.deepEqual(f.decodedBackgrounds, ['/images/slide background.png']);
	background.resolve();
	await flush();
	assert.deepEqual(f.updates.at(-1), { ready: true, failedImages: 0 });
});

test('failed backgrounds count as failed images without blocking printing', async () => {
	const f = fixture();
	f.root.backgrounds = ['/missing-background.png'];
	f.backgroundLoads.set(
		'/missing-background.png',
		Promise.reject(new Error('Missing background'))
	);
	f.observe();
	await flush();
	assert.deepEqual(f.updates.at(-1), { ready: true, failedImages: 1 });
});

test('replacing a background invalidates its pending readiness check', async () => {
	const f = fixture();
	const original = deferred();
	const replacement = deferred();
	f.root.backgrounds = ['/original.png'];
	f.backgroundLoads.set('/original.png', original.promise);
	f.backgroundLoads.set('/replacement.png', replacement.promise);
	f.observe();
	assert.ok(
		f.observerOptions.attributeFilter.includes('data-print-background-image')
	);
	f.root.backgrounds = ['/replacement.png'];
	f.changed();
	original.resolve();
	await flush();
	assert.equal(f.updates.at(-1).ready, false);
	replacement.resolve();
	await flush();
	assert.deepEqual(f.updates.at(-1), { ready: true, failedImages: 0 });
});

test('a new font load disables printing until that load completes', async () => {
	const f = fixture();
	f.observe();
	await flush();
	assert.equal(f.updates.at(-1).ready, true);
	const font = deferred();
	f.fonts.ready = font.promise;
	f.fonts.dispatchEvent(new Event('loading'));
	assert.equal(f.updates.at(-1).ready, false);
	font.resolve();
	await flush();
	assert.equal(f.updates.at(-1).ready, true);
});

test('unmount discards pending completion and removes font listeners', async () => {
	const f = fixture();
	const pending = deferred();
	f.root.images = [{ decode: () => pending.promise }];
	const stop = f.observe();
	stop();
	pending.resolve();
	f.fonts.dispatchEvent(new Event('loading'));
	await flush();
	assert.deepEqual(f.updates, [{ ready: false, failedImages: 0 }]);
});
