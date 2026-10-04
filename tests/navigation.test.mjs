import assert from 'node:assert/strict';
import { register } from 'node:module';
import { test } from 'node:test';
import { NavigationService } from '../src/pkgs/deck/core/services/navigation-service.ts';

globalThis.window = Object.assign(new EventTarget(), {
	location: { pathname: '/presenter/2' },
	localStorage: {
		getItem: () => null,
		setItem: () => {},
		removeItem: () => {},
	},
});

// The app's bundler resolves extensionless TypeScript imports; scope the Node
// test resolver to the store's services and their shared helper.
const storeUrl = new URL(
	'../src/pkgs/deck/core/store/presentation-store.ts',
	import.meta.url
);
register('./helpers/resolve-store.mjs', import.meta.url);
const { usePresentationStore } = await import(storeUrl.href);

const slides = ['1', '2', '3'].map((slug) => ({
	slug,
	title: `Slide ${slug}`,
}));
const actions = [
	{ name: 'goToNextSlide', args: [], target: '3' },
	{ name: 'goToPreviousSlide', args: [], target: '1' },
	{ name: 'goToSlide', args: [2], target: '3' },
];
function setup(pathname, presenter) {
	const pushed = [];
	const broadcast = [];
	window.location.pathname = pathname;
	usePresentationStore.setState(
		{
			...usePresentationStore.getInitialState(),
			slug: '2',
			slides,
			isServicesInitialized: true,
			isPresenterMode: presenter,
			navigationService: new NavigationService(slides),
			syncService: { broadcast: (slug) => broadcast.push(slug) },
			router: { push: (path) => pushed.push(path) },
		},
		true
	);
	return { pushed, broadcast };
}

for (const prefix of ['', '/ref/review-123', '/ref/feature%2Fdemo']) {
	test(`all presenter navigation actions preserve prefix ${prefix || '(none)'}`, () => {
		for (const { name, args, target } of actions) {
			const { pushed, broadcast } = setup(`${prefix}/presenter/2`, true);
			usePresentationStore.getState()[name](...args);
			assert.deepEqual(pushed, [`${prefix}/presenter/${target}`], name);
			assert.deepEqual(broadcast, [target], `${name} still syncs the audience`);
			assert.equal(usePresentationStore.getState().slug, target);
		}
	});
}

test('audience navigation still emits unprefixed paths for the provider to route', () => {
	for (const { name, args, target } of actions) {
		const { pushed } = setup('/ref/review-123/2', false);
		let detail;
		window.addEventListener(
			'urlchange',
			(event) => {
				detail = event.detail;
			},
			{ once: true }
		);
		usePresentationStore.getState()[name](...args);
		assert.deepEqual(pushed, []);
		assert.equal(detail.path, `/${target}`, name);
		assert.equal(detail.slug, target);
	}
});
