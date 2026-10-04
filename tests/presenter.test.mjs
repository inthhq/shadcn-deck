import assert from 'node:assert/strict';
import { register } from 'node:module';
import { afterEach, test } from 'node:test';
import { randomId } from '../src/pkgs/deck/core/lib/random-id.ts';
import {
	checkpoint,
	formatDuration,
	getPacing,
	getPlannedDuration,
	snapshotPlan,
	visitSlide,
} from '../src/pkgs/deck/features/presenter/lib/rehearsal.ts';

register('./helpers/resolve-store.mjs', import.meta.url);
const { SyncService } = await import(
	'../src/pkgs/deck/core/services/sync-service.ts'
);

const plan = [
	{ slug: '1', title: 'Opening', duration: 15, appendix: false },
	{ slug: '2', title: 'Context', duration: 45, appendix: false },
	{ slug: '3', title: 'Questions', duration: 60, appendix: true },
];
const run = () => ({
	id: 'test',
	startedAt: 1000,
	finishedAt: null,
	elapsedMs: 0,
	runningSince: 1000,
	activeSlug: '1',
	startSlug: '1',
	timings: {},
	plan,
});

test('wall-clock time survives throttled ticks, transitions and revisits without double counting', () => {
	let value = checkpoint(run(), 11000);
	assert.equal(value.elapsedMs, 10000);
	value = visitSlide(value, '2', 16000);
	assert.equal(value.timings['1'], 15000);
	value = visitSlide(value, '1', 36000);
	value = checkpoint(value, 41000);
	assert.equal(value.elapsedMs, 40000);
	assert.deepEqual(value.timings, { 1: 20000, 2: 20000 });
	assert.equal(checkpoint(value, 41000).elapsedMs, 40000);
});

test('pause excludes time away and resume credits the correct slide', () => {
	let value = { ...checkpoint(run(), 6000), runningSince: null };
	assert.equal(checkpoint(value, 600000).elapsedMs, 5000);
	value = { ...visitSlide(value, '2', 600000), runningSince: 600000 };
	value = checkpoint(value, 604000);
	assert.equal(value.elapsedMs, 9000);
	assert.deepEqual(value.timings, { 1: 5000, 2: 4000 });
});

test('pacing retains prior delay, then adds the current slide overrun', () => {
	let value = visitSlide(run(), '2', 61000); // 60s spent against a 15s opening.
	assert.equal(getPacing(value, '2'), 45);
	value = checkpoint(value, 91000); // 30s within the next slide's 45s target.
	assert.equal(getPacing(value, '2'), 45);
	value = checkpoint(value, 121000); // Now 15s over the second slide's target.
	assert.equal(getPacing(value, '2'), 60);
	assert.equal(getPacing(value, '3'), null);
});

test('partial rehearsal pacing starts from its chosen slide and excludes appendix', () => {
	const value = {
		...run(),
		startSlug: '2',
		activeSlug: '2',
		elapsedMs: 20000,
		timings: { 2: 20000 },
	};
	assert.equal(getPacing(value, '2'), 0);
	assert.equal(getPacing(value, '1'), null);
	assert.equal(getPacing(value, '3'), null);
	assert.equal(getPacing(null, '1'), null);
});

test('returning from the appendix does not add Q&A time to talk pacing', () => {
	let value = visitSlide(run(), '2', 31000); // Opening is 15s over.
	value = visitSlide(value, '3', 41000); // 10s on the current talk slide.
	value = visitSlide(value, '2', 161000); // Two minutes in the appendix.
	assert.equal(getPacing(value, '2'), 15);
	value = checkpoint(value, 201000); // Current slide now totals 50s / 45s.
	assert.equal(getPacing(value, '2'), 20);
});

test('going backwards excludes time on later slides from the current pace', () => {
	let value = visitSlide(run(), '2', 16000);
	value = visitSlide(value, '1', 76000);
	assert.equal(getPacing(value, '1'), 0);
	value = checkpoint(value, 86000);
	assert.equal(getPacing(value, '1'), 10);
});

test('pace excludes earlier and appendix timings while retaining skipped planned time', () => {
	const value = {
		...run(),
		startSlug: '2',
		activeSlug: '5',
		elapsedMs: 190000,
		timings: { 1: 30000, 2: 20000, 3: 120000, 5: 20000 },
		plan: [
			...plan,
			{ slug: '4', title: 'Skipped', duration: 20, appendix: false },
			{ slug: '5', title: 'Closing', duration: 30, appendix: false },
		],
	};
	assert.equal(getPacing(value, '5'), -45); // (20 - 45) + (0 - 20).
});

test('saved plans are snapshots of titles and timings, and formatting supports overtime', () => {
	const slides = [
		{ slug: '1', title: 'Title', metadata: { duration: 15, tags: ['Talk'] } },
		{
			slug: '2',
			title: 'Extra',
			metadata: { duration: 30, tags: ['Appendix'] },
		},
	];
	const snapshot = snapshotPlan(slides);
	slides[0].metadata.duration = 60;
	assert.equal(snapshot[0].duration, 15);
	assert.equal(snapshot[1].appendix, true);
	assert.equal(formatDuration(-65), '01:05');
	assert.equal(formatDuration(3601), '60:01');
});

test('planned duration follows arbitrary slide targets and excludes appendix time', () => {
	const custom = [
		{ ...plan[0], duration: 90 },
		{ ...plan[2], duration: 600 },
		{ ...plan[1], duration: 225 },
	];
	assert.equal(getPlannedDuration(custom), 315);
	assert.equal(getPlannedDuration(custom, '2'), 225);
	assert.equal(getPlannedDuration(custom, '3'), null);
	assert.equal(getPlannedDuration(custom, 'missing'), null);
	assert.equal(getPlannedDuration([]), null);
});

test('untimed or incomplete plans have no countdown or misleading pacing', () => {
	for (const duration of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
		const mixed = [{ ...plan[0], duration }, plan[1], plan[2]];
		const value = { ...run(), plan: mixed, timings: { 1: 30000, 2: 10000 } };
		assert.equal(getPlannedDuration(mixed), null);
		assert.equal(getPacing(value, '1'), null);
		assert.equal(getPacing(value, '2'), null);
		// An independently rehearsed, fully timed suffix still has a valid plan.
		assert.equal(getPlannedDuration(mixed, '2'), 45);
		assert.equal(getPacing({ ...value, startSlug: '2' }, '2'), 0);
	}
	const untimed = snapshotPlan([{ slug: 'intro', title: 'Introduction' }]);
	assert.equal(getPlannedDuration(untimed), null);
	assert.equal(getPlannedDuration([{ ...plan[2], duration: 0 }]), null);
	assert.equal(
		getPlannedDuration([...plan, { ...plan[0], slug: '4', duration: 0 }]),
		null
	);
});

// Real BroadcastChannels exercise cross-instance delivery and ordering.
const browserEvents = new EventTarget();
globalThis.window = browserEvents;
const services = [];
afterEach(() => {
	for (const service of services.splice(0)) service.destroy();
});
function service(presenter, channel) {
	const value = new SyncService(presenter, channel);
	services.push(value);
	return value;
}
function deferred() {
	let resolve;
	const promise = new Promise((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

test('audience connection needs a rendered-slide acknowledgement, and disconnect clears it', {
	timeout: 3000,
}, async () => {
	const channel = `test-${crypto.randomUUID()}`;
	const presenter = service(true, channel);
	const acknowledged = deferred();
	const disconnected = deferred();
	const joined = deferred();
	let lastPeers = [];
	let didConnect = false;
	presenter.configureAudience(
		() => '7',
		(peers) => {
			lastPeers = peers;
			if (peers.length) {
				didConnect = true;
				acknowledged.resolve();
			} else if (didConnect) disconnected.resolve();
		}
	);
	presenter.init(() => {});
	const audience = service(false, channel);
	audience.init((slug) => {
		assert.equal(slug, '7');
		joined.resolve();
	});
	await joined.promise;
	assert.equal(
		lastPeers.length,
		0,
		'A navigation command is not a rendered acknowledgement'
	);
	audience.reportDisplayed('7');
	await acknowledged.promise;
	assert.equal(lastPeers[0].slug, '7');
	audience.destroy();
	await disconnected.promise;
	assert.equal(lastPeers.length, 0);
});

test('rapid slide navigation delivers the final slide without a cooldown dropping commands', {
	timeout: 3000,
}, async () => {
	const channel = `test-${crypto.randomUUID()}`;
	const presenter = service(true, channel);
	const ready = deferred();
	const completed = deferred();
	const received = [];
	presenter.configureAudience(
		() => '1',
		() => {}
	);
	presenter.init(() => {});
	const audience = service(false, channel);
	audience.init((slug) => {
		if (slug === '1') ready.resolve();
		else received.push(slug);
		if (slug === '5') completed.resolve();
	});
	await ready.promise;
	for (const slug of ['2', '3', '4', '5']) presenter.broadcast(slug);
	await completed.promise;
	assert.deepEqual(received, ['2', '3', '4', '5']);
});

test('a window that disappears without a leave message expires instead of remaining falsely connected', {
	timeout: 3000,
}, async (context) => {
	context.mock.timers.enable({ apis: ['Date', 'setInterval'], now: 1000 });
	const channel = `test-${crypto.randomUUID()}`;
	const presenter = service(true, channel);
	const connected = deferred();
	let peers = [];
	presenter.configureAudience(
		() => '1',
		(next) => {
			peers = next;
			if (next.length) connected.resolve();
		}
	);
	presenter.init(() => {});
	const vanished = new BroadcastChannel(channel);
	vanished.postMessage({
		type: 'PRESENCE',
		role: 'audience',
		source: 'vanished',
		slug: '1',
		timestamp: 1000,
	});
	await connected.promise;
	vanished.close();
	context.mock.timers.tick(9000);
	assert.equal(peers.length, 0);
});

test('random IDs use UUIDs when available and work without browser crypto', (context) => {
	context.mock.method(globalThis.crypto, 'randomUUID', () => 'native-uuid');
	assert.equal(randomId(), 'native-uuid');
	const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
	try {
		for (const crypto of [{}, undefined]) {
			Object.defineProperty(globalThis, 'crypto', {
				configurable: true,
				value: crypto,
			});
			const first = randomId();
			assert.match(first, /^[a-z0-9]+-[a-z0-9]+$/);
			assert.notEqual(randomId(), first);
			assert.doesNotThrow(() => service(false, 'fallback-test'));
		}
	} finally {
		Object.defineProperty(globalThis, 'crypto', original);
	}
});

test('audience notifications ignore heartbeats but retain fresh peers on changes', {
	timeout: 3000,
}, async (context) => {
	context.mock.timers.enable({ apis: ['Date', 'setInterval'], now: 1000 });
	const channel = `test-${crypto.randomUUID()}`;
	const presenter = service(true, channel);
	const publications = [];
	presenter.configureAudience(
		() => '1',
		(peers) => publications.push(peers)
	);
	let delivered;
	presenter.init(() => delivered.resolve());
	const sender = new BroadcastChannel(channel);
	context.after(() => sender.close());
	const send = async (type, source, slug) => {
		delivered = deferred();
		sender.postMessage({ type, source, slug, role: 'audience' });
		// A command on the same channel confirms preceding messages were handled.
		sender.postMessage({ type: 'SLIDE_CHANGE', source: 'barrier', slug: '1' });
		await delivered.promise;
	};
	await send('PRESENCE', 'audience-a', '1');
	assert.equal(publications.length, 1);
	context.mock.timers.tick(3000);
	await send('PRESENCE', 'audience-a', '1');
	assert.equal(publications.length, 1);
	await send('PRESENCE', 'audience-b', '1');
	assert.equal(publications.length, 2);
	assert.deepEqual(publications.at(-1), [
		{ id: 'audience-a', slug: '1', seenAt: 4000 },
		{ id: 'audience-b', slug: '1', seenAt: 4000 },
	]);
	await send('PRESENCE', 'audience-a', '2');
	assert.equal(publications.length, 3);
	assert.equal(publications.at(-1)[0].slug, '2');
	await send('LEAVE', 'audience-b');
	assert.equal(publications.length, 4);
	await send('LEAVE', 'audience-b');
	assert.equal(publications.length, 4);
	context.mock.timers.tick(9000);
	assert.equal(publications.length, 5);
	assert.deepEqual(publications.at(-1), []);
	presenter.destroy();
	assert.equal(publications.length, 5);
});
