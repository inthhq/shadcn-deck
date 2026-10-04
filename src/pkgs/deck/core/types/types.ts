import type { ComponentType, ReactNode } from 'react';

// Enhanced slide definition with better typing
export interface SlideDefinition {
	slug: string;
	title: string;
	component: ComponentType<{ children?: ReactNode }>;
	notes?: string | ReactNode;
	metadata?: {
		duration?: number;
		tags?: string[];
		description?: string;
	};
}

// Navigation types
type NavigationDirection = 'next' | 'previous' | 'direct';

export interface NavigationContext {
	direction: NavigationDirection;
	fromSlug: string;
	toSlug: string;
	timestamp: number;
}

// Sync service types
export interface SyncMessage {
	type: 'SLIDE_CHANGE' | 'HELLO' | 'PRESENCE' | 'LEAVE';
	slug?: string;
	timestamp: number;
	source: string;
	target?: string;
	role: 'presenter' | 'audience';
}

export interface AudienceWindow {
	id: string;
	slug: string;
	seenAt: number;
}

// Store state types
export interface PresentationError {
	message: string;
	code?: string;
	timestamp: number;
}

// Service interfaces for dependency injection
export interface INavigationService {
	goToSlide(index: number): string | null;
	goToNext(currentSlug: string): string | null;
	goToPrevious(currentSlug: string): string | null;
	getSlideIndex(slug: string): number;
	isValidSlide(slug: string): boolean;
	getTotalSlides(): number;
}

export interface ISyncService {
	init(
		onSlideChange: (slug: string, context?: NavigationContext) => void
	): void;
	broadcast(slug: string, context?: NavigationContext): void;
	destroy(): void;
	isConnected(): boolean;
	reportDisplayed(slug: string | null): void;
}
