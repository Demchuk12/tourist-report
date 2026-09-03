import type { User } from '$lib/entities/user/model/types';
import { TokenStore } from '$lib/features/auth/model/token-store.svelte';
import {
	describeError,
	type NotificationStore
} from '$lib/features/notifications/model/notification-store.svelte';
import * as m from '$lib/paraglide/messages';
import type { AuthApi, Credentials, RegistrationPayload } from '$lib/shared/api/auth-api';
import { ApiError } from '$lib/shared/api/http-client';

/**
 * Who is signed in, and the three transitions that change it. Nothing else
 * writes the token: `HttpClient` only reads it, and an expired one comes back
 * here through `expire()`.
 */
export class SessionStore {
	user = $state<User | null>(null);
	/** False until the persisted token has been checked — the shell waits on this. */
	ready = $state(false);
	/** A login or registration request is in flight. */
	pending = $state(false);
	/** Shown inside the auth form; unlike a toast it survives until the next attempt. */
	error = $state('');

	constructor(
		private readonly api: AuthApi,
		private readonly tokens: TokenStore,
		private readonly notifications: NotificationStore
	) {}

	get signedIn(): boolean {
		return this.user !== null;
	}

	/** Revalidates a restored token, so a revoked account never sees a stale shell. */
	async init(): Promise<void> {
		const token = this.tokens.restore();

		if (token) {
			try {
				this.user = await this.api.me();
			} catch (error) {
				// A dead network must not discard a token that may still be good.
				if (error instanceof ApiError && !error.isNetworkFailure) this.tokens.clear();
				else this.notifications.fromError(error, m.error_session_check());
			}
		}

		this.ready = true;
	}

	login(credentials: Credentials): Promise<boolean> {
		return this.#authenticate(() => this.api.login(credentials), m.auth_welcome_back());
	}

	register(payload: RegistrationPayload): Promise<boolean> {
		return this.#authenticate(() => this.api.register(payload), m.auth_account_created());
	}

	logout(): void {
		this.tokens.clear();
		this.user = null;
		this.error = '';
		this.notifications.info(m.auth_signed_out());
	}

	/**
	 * Called by the HTTP client when an authenticated request is rejected. The
	 * shell falls back to the auth screen on the next render, keeping the URL so
	 * signing back in returns the user to the page they were on.
	 */
	expire(): void {
		if (!this.user && !this.tokens.value) return;

		this.tokens.clear();
		this.user = null;
		this.notifications.error(m.error_session_expired_title(), m.error_session_expired());
	}

	async #authenticate(
		request: () => Promise<{ accessToken: string; user: User }>,
		successTitle: string
	): Promise<boolean> {
		this.pending = true;
		this.error = '';

		try {
			const session = await request();
			this.tokens.set(session.accessToken);
			this.user = session.user;
			this.notifications.success(successTitle, session.user.email);
			return true;
		} catch (error) {
			this.error = describeError(error);
			return false;
		} finally {
			this.pending = false;
		}
	}
}
