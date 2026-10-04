import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
	INavigationService,
	ISyncService,
	NavigationContext,
	PresentationError,
	SlideDefinition,
} from '~/pkgs/deck/core/types/types';
import { NavigationService } from '../services/navigation-service';
import { SyncService } from '../services/sync-service';

interface PresentationState {
	// Core state
	slug: string;
	slides: SlideDefinition[];
	activeSlide: number;
	totalSlides: number;
	isFirstSlide: boolean;
	isLastSlide: boolean;

	// UI state
	isFullscreen: boolean;
	isPresenterMode: boolean;
	isLoading: boolean;
	error: PresentationError | null;

	// Initialization state
	isServicesInitialized: boolean;
	isFullyReady: boolean;

	// Services (not persisted)
	navigationService: INavigationService | null;
	syncService: ISyncService | null;
	router: AppRouterInstance | null;

	// Actions
	setSlides: (slides: SlideDefinition[]) => void;
	setRouter: (router: AppRouterInstance) => void;
	setSlug: (slug: string, context?: NavigationContext) => void;
	setPresenterMode: (isPresenter: boolean) => void;
	setFullscreen: (isFullscreen: boolean) => void;
	goToNextSlide: () => void;
	goToPreviousSlide: () => void;
	goToSlide: (index: number) => void;
	clearError: () => void;
	initServices: () => void;
	cleanup: () => void;
	setError: (error: string | Error, code?: string) => void;
}

export const usePresentationStore = create<PresentationState>()(
	persist(
		(set, get) => ({
			// Initial state
			slug: '1',
			slides: [],
			activeSlide: 0,
			totalSlides: 0,
			isFirstSlide: true,
			isLastSlide: false,
			isFullscreen: false,
			isPresenterMode: false,
			isLoading: false,
			error: null,
			isServicesInitialized: false,
			isFullyReady: false,

			// Services
			navigationService: null,
			syncService: null,
			router: null,

			setError: (error, code) => {
				const errorObj: PresentationError = {
					message: error instanceof Error ? error.message : error,
					code: code || 'UNKNOWN_ERROR',
					timestamp: Date.now(),
				};
				set({ error: errorObj });
			},

			setSlides: (slides) => {
				set({ slides, totalSlides: slides.length });

				// If services are already initialized, update the navigation service
				const state = get();
				if (state.isServicesInitialized && state.navigationService) {
					try {
						(state.navigationService as NavigationService).updateSlides(slides);
						set({ error: null });
					} catch (error) {
						get().setError(
							error instanceof Error
								? error
								: new Error('Failed to update slides'),
							'UPDATE_SLIDES_ERROR'
						);
					}
				}
			},

			setRouter: (router) => set({ router }),

			setFullscreen: (isFullscreen) => set({ isFullscreen }),

			setSlug: (slug, context) => {
				const { navigationService, syncService, isServicesInitialized } = get();

				// Don't proceed if services aren't initialized
				if (!isServicesInitialized || !navigationService) {
					console.warn('⚠️ Store: Services not initialized, aborting setSlug');
					return;
				}

				try {
					if (!navigationService.isValidSlide(slug)) {
						console.error('❌ Store: Invalid slide', slug);
						get().setError(`Invalid slide: ${slug}`, 'INVALID_SLIDE');
						return;
					}

					const slideIndex = navigationService.getSlideIndex(slug);
					const totalSlides = navigationService.getTotalSlides();

					set({
						slug,
						activeSlide: slideIndex,
						isFirstSlide: slideIndex === 0,
						isLastSlide: slideIndex === totalSlides - 1,
						error: null,
					});

					// Broadcast from both presenters AND viewers when it's a user-initiated action
					const shouldBroadcast =
						syncService && context && context.direction !== 'direct';

					if (shouldBroadcast) {
						syncService.broadcast(slug, context);
					}
				} catch (error) {
					console.error('❌ Store: Error in setSlug', error);
					get().setError(
						error instanceof Error
							? error
							: new Error(`Failed to navigate to slide: ${slug}`),
						'NAVIGATION_ERROR'
					);
				}
			},

			setPresenterMode: (isPresenter) => {
				const { syncService, isServicesInitialized } = get();

				set({ isPresenterMode: isPresenter });

				if (syncService && isServicesInitialized) {
					(syncService as SyncService).setPresenterMode(isPresenter);
				}
			},

			goToNextSlide: () => {
				const {
					slug,
					navigationService,
					router,
					isPresenterMode,
					isServicesInitialized,
				} = get();

				if (!isServicesInitialized || !navigationService) {
					get().setError('Navigation service not available', 'SERVICE_ERROR');
					return;
				}

				try {
					const nextSlug = navigationService.goToNext(slug);
					if (nextSlug) {
						const context = (
							navigationService as NavigationService
						).createNavigationContext('next', slug, nextSlug);

						// Set slug first
						get().setSlug(nextSlug, context);

						// Then handle routing
						if (isPresenterMode && router) {
							router.push(`/presenter/${nextSlug}`);
						} else {
							window.dispatchEvent(
								new CustomEvent('urlchange', {
									detail: {
										path: `/${nextSlug}`,
										slug: nextSlug,
										source: 'navigation',
										context,
									},
								})
							);
						}
					}
				} catch (error) {
					get().setError(
						error instanceof Error
							? error
							: new Error('Failed to go to next slide'),
						'NAVIGATION_ERROR'
					);
				}
			},

			goToPreviousSlide: () => {
				const {
					slug,
					navigationService,
					router,
					isPresenterMode,
					isServicesInitialized,
				} = get();

				if (!isServicesInitialized || !navigationService) {
					get().setError('Navigation service not available', 'SERVICE_ERROR');
					return;
				}

				try {
					const prevSlug = navigationService.goToPrevious(slug);
					if (prevSlug) {
						const context = (
							navigationService as NavigationService
						).createNavigationContext('previous', slug, prevSlug);

						// Set slug first
						get().setSlug(prevSlug, context);

						// Then handle routing
						if (isPresenterMode && router) {
							router.push(`/presenter/${prevSlug}`);
						} else {
							window.dispatchEvent(
								new CustomEvent('urlchange', {
									detail: {
										path: `/${prevSlug}`,
										slug: prevSlug,
										source: 'navigation',
										context,
									},
								})
							);
						}
					}
				} catch (error) {
					get().setError(
						error instanceof Error
							? error
							: new Error('Failed to go to previous slide'),
						'NAVIGATION_ERROR'
					);
				}
			},

			goToSlide: (index) => {
				const {
					navigationService,
					router,
					isPresenterMode,
					slug,
					isServicesInitialized,
				} = get();

				if (!isServicesInitialized || !navigationService) {
					get().setError('Navigation service not available', 'SERVICE_ERROR');
					return;
				}

				try {
					const targetSlug = navigationService.goToSlide(index);
					if (targetSlug) {
						const context = (
							navigationService as NavigationService
						).createNavigationContext('direct', slug, targetSlug);

						// Set slug first
						get().setSlug(targetSlug, context);

						// Then handle routing
						if (isPresenterMode && router) {
							router.push(`/presenter/${targetSlug}`);
						} else {
							window.dispatchEvent(
								new CustomEvent('urlchange', {
									detail: {
										path: `/${targetSlug}`,
										slug: targetSlug,
										source: 'navigation',
										context,
									},
								})
							);
						}
					}
				} catch (error) {
					get().setError(
						error instanceof Error ? error : new Error('Failed to go to slide'),
						'NAVIGATION_ERROR'
					);
				}
			},

			clearError: () => set({ error: null }),

			initServices: () => {
				const { slides, isPresenterMode, isServicesInitialized } = get();

				// Prevent double initialization
				if (isServicesInitialized) {
					return;
				}

				try {
					if (slides.length === 0) {
						get().setError(
							'Cannot initialize services: no slides available',
							'INIT_ERROR'
						);
						return;
					}

					// Initialize navigation service
					const navigationService = new NavigationService(slides);

					// Initialize sync service
					const syncService = new SyncService(isPresenterMode);
					syncService.init((slug) => {
						const viewPath = window.location.pathname.replace(
							/^\/ref\/[^/]+/,
							''
						);
						if (viewPath === '/print' || viewPath === '/grid') return;
						// Handle incoming slide changes from other tabs
						const currentState = get();

						// Process sync messages from any source (bidirectional)
						if (currentState.isServicesInitialized) {
							// Update the store directly rather than dispatching events
							if (currentState.navigationService?.isValidSlide(slug)) {
								const slideIndex =
									currentState.navigationService.getSlideIndex(slug);
								const totalSlides =
									currentState.navigationService.getTotalSlides();

								// Update store state with context indicating this is from sync
								set({
									slug,
									activeSlide: slideIndex,
									isFirstSlide: slideIndex === 0,
									isLastSlide: slideIndex === totalSlides - 1,
									error: null,
								});

								// Then update the URL
								if (currentState.router) {
									const params = new URLSearchParams(window.location.search);
									const ref = params.get('ref');
									const basePath = currentState.isPresenterMode
										? `/presenter/${slug}`
										: `/${slug}`;
									const targetPath = ref ? `/ref/${ref}${basePath}` : basePath;
									currentState.router.push(targetPath);
								}
							} else {
								console.warn('⚠️ Store: Invalid slide from sync', slug);
							}
						} else {
							console.warn('⚠️ Store: Services not initialized, ignoring sync');
						}
					});

					set({
						navigationService,
						syncService,
						isServicesInitialized: true,
						isFullyReady: true,
						totalSlides: slides.length,
						error: null,
					});
				} catch (error) {
					get().setError(
						error instanceof Error
							? error
							: new Error('Failed to initialize services'),
						'INIT_ERROR'
					);
				}
			},

			cleanup: () => {
				const { syncService } = get();

				try {
					if (syncService) {
						syncService.destroy();
					}

					set({
						syncService: null,
						navigationService: null,
						isServicesInitialized: false,
						isFullyReady: false,
					});
				} catch (error) {
					console.error('Error during cleanup:', error);
				}
			},
		}),
		{
			name: 'presentation-storage',
			partialize: (state) => ({
				slug: state.slug,
				activeSlide: state.activeSlide,
				totalSlides: state.totalSlides,
				isFirstSlide: state.isFirstSlide,
				isLastSlide: state.isLastSlide,
			}),
		}
	)
);

// Cleanup on app unmount
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		try {
			usePresentationStore.getState().cleanup();
		} catch (error) {
			console.error('Error during window cleanup:', error);
		}
	});
}
