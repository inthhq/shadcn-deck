import type {
	AudienceWindow,
	ISyncService,
	NavigationContext,
	SyncMessage,
} from '~/pkgs/deck/core/types/types';

const HEARTBEAT_MS = 1500;
const STALE_AFTER_MS = 7000;

/** Navigation commands and rendered-slide acknowledgements are deliberately separate. */
export class SyncService implements ISyncService {
	private channel: BroadcastChannel | null = null;
	private heartbeat: ReturnType<typeof setInterval> | null = null;
	private readonly tabId = `tab-${crypto.randomUUID()}`;
	private displayedSlug: string | null = null;
	private peers = new Map<string, AudienceWindow>();
	private onSlideChange:
		| ((slug: string, context?: NavigationContext) => void)
		| null = null;
	private onAudienceChange: ((windows: AudienceWindow[]) => void) | null = null;
	private getSlug: () => string = () => '';
	private isPresenter: boolean;
	private readonly channelName: string;

	constructor(isPresenter = false, channelName = 'slide-navigation-v2') {
		this.isPresenter = isPresenter;
		this.channelName = channelName;
	}

	init(
		onSlideChange: (slug: string, context?: NavigationContext) => void
	): void {
		this.onSlideChange = onSlideChange;
		if (typeof window === 'undefined' || this.channel) return;
		try {
			this.channel = new BroadcastChannel(this.channelName);
			this.channel.addEventListener('message', this.handleMessage);
			window.addEventListener('pagehide', this.leave);
			window.addEventListener('pageshow', this.announce);
			this.heartbeat = setInterval(() => {
				this.announce();
				const now = Date.now();
				for (const [id, peer] of this.peers) {
					if (now - peer.seenAt > STALE_AFTER_MS) this.peers.delete(id);
				}
				this.publishPeers();
			}, HEARTBEAT_MS);
			this.send('HELLO');
		} catch {
			this.channel = null;
		}
	}

	configureAudience(
		getSlug: () => string,
		onChange: (windows: AudienceWindow[]) => void
	) {
		this.getSlug = getSlug;
		this.onAudienceChange = onChange;
	}

	private send(type: SyncMessage['type'], slug?: string, target?: string) {
		this.channel?.postMessage({
			type,
			slug,
			target,
			source: this.tabId,
			role: this.isPresenter ? 'presenter' : 'audience',
			timestamp: Date.now(),
		} satisfies SyncMessage);
	}

	private handleMessage = (event: MessageEvent<SyncMessage>) => {
		const message = event.data;
		if (
			!message ||
			typeof message.source !== 'string' ||
			message.source === this.tabId ||
			(message.target && message.target !== this.tabId)
		)
			return;
		if (message.type === 'HELLO') {
			if (this.isPresenter && message.role === 'audience') {
				this.send('SLIDE_CHANGE', this.getSlug(), message.source);
			}
			this.announce();
		} else if (
			message.type === 'SLIDE_CHANGE' &&
			typeof message.slug === 'string'
		) {
			this.onSlideChange?.(message.slug, {
				direction: 'direct',
				fromSlug: '',
				toSlug: message.slug,
				timestamp: message.timestamp,
			});
		} else if (
			message.type === 'PRESENCE' &&
			message.role === 'audience' &&
			typeof message.slug === 'string'
		) {
			this.peers.set(message.source, {
				id: message.source,
				slug: message.slug,
				seenAt: Date.now(),
			});
			this.publishPeers();
		} else if (message.type === 'LEAVE') {
			this.peers.delete(message.source);
			this.publishPeers();
		}
	};

	private publishPeers() {
		this.onAudienceChange?.([...this.peers.values()]);
	}
	private announce = () => {
		if (!this.isPresenter && this.displayedSlug)
			this.send('PRESENCE', this.displayedSlug);
	};
	private leave = () => {
		this.send('LEAVE');
	};

	// Called by the audience slide component after React has committed the slide.
	reportDisplayed(slug: string | null) {
		this.displayedSlug = slug;
		if (slug) this.announce();
		else this.leave();
	}

	broadcast(slug: string, _context?: NavigationContext): void {
		// Receivers never rebroadcast commands; no cooldown is needed or safe here.
		this.send('SLIDE_CHANGE', slug);
	}

	isConnected(): boolean {
		return this.channel !== null;
	}

	setPresenterMode(isPresenter: boolean): void {
		if (this.isPresenter === isPresenter) return;
		this.leave();
		this.isPresenter = isPresenter;
		this.send('HELLO');
		this.announce();
	}

	destroy(): void {
		this.leave();
		if (this.heartbeat) clearInterval(this.heartbeat);
		if (typeof window !== 'undefined') {
			window.removeEventListener('pagehide', this.leave);
			window.removeEventListener('pageshow', this.announce);
		}
		this.channel?.removeEventListener('message', this.handleMessage);
		this.channel?.close();
		this.channel = null;
		this.heartbeat = null;
		this.peers.clear();
		this.publishPeers();
	}
}
