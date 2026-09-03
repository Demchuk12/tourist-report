import * as m from '$lib/paraglide/messages';
import { ApiError } from '$lib/shared/api/http-client';
import { createId } from '$lib/shared/lib/id';

export type NotificationTone = 'success' | 'error' | 'info';

export type AppNotification = {
	id: string;
	tone: NotificationTone;
	title: string;
	/** Optional second line: the server's reason, or the failed validation rules. */
	text: string;
};

/** Errors stay long enough to read the reason; confirmations get out of the way. */
const DISMISS_AFTER: Record<NotificationTone, number> = {
	success: 4000,
	info: 5000,
	error: 9000
};

/** Older toasts are dropped rather than stacking off-screen on a phone. */
const MAX_VISIBLE = 4;

/**
 * The single channel for telling the user how a request went. Every store
 * method reports through it, so no component has to invent its own error banner.
 */
export class NotificationStore {
	items = $state<AppNotification[]>([]);

	// A plain Map on purpose: these are timer handles for `dismiss`, never rendered,
	// so making them reactive would only cost invalidations.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	readonly #timers = new Map<string, ReturnType<typeof setTimeout>>();

	success(title: string, text = ''): string {
		return this.#push('success', title, text);
	}

	info(title: string, text = ''): string {
		return this.#push('info', title, text);
	}

	error(title: string, text = ''): string {
		return this.#push('error', title, text);
	}

	/**
	 * Turns a thrown value into a toast. A dead connection is worth its own
	 * wording — nothing the user typed is wrong, the server simply is not there.
	 */
	fromError(error: unknown, title: string): string {
		return this.error(title, describeError(error));
	}

	dismiss(id: string): void {
		const timer = this.#timers.get(id);
		if (timer !== undefined) {
			clearTimeout(timer);
			this.#timers.delete(id);
		}

		this.items = this.items.filter((item) => item.id !== id);
	}

	/** Called when the shell unmounts, so pending timers cannot fire into a dead store. */
	clear(): void {
		for (const timer of this.#timers.values()) clearTimeout(timer);
		this.#timers.clear();
		this.items = [];
	}

	#push(tone: NotificationTone, title: string, text: string): string {
		const id = createId();

		this.items = [...this.items, { id, tone, title, text }].slice(-MAX_VISIBLE);
		this.#timers.set(
			id,
			setTimeout(() => this.dismiss(id), DISMISS_AFTER[tone])
		);

		return id;
	}
}

/** Reads the human part out of whatever the API layer threw. */
export function describeError(error: unknown): string {
	if (error instanceof ApiError) {
		if (error.isNetworkFailure) return m.error_network();
		// The server's own wording wins whenever it gave one: a 401 from the login
		// form means "wrong password", not "your session expired".
		if (error.details.length) return error.details.join(' · ');
		if (error.isUnauthorized) return m.error_session_expired();
		if (error.isNotFound) return m.error_not_found();
		return m.error_server({ status: error.status });
	}

	return error instanceof Error && error.message ? error.message : m.error_unknown();
}
