const TOKEN_KEY = 'tourist-report:access-token';

/**
 * Holds the bearer token and mirrors it into `localStorage` so a reload does not
 * log the leader out mid-tour. It is deliberately separate from `SessionStore`:
 * the HTTP client needs the token, and `SessionStore` needs the HTTP client, so
 * a shared holder is what breaks that cycle.
 */
export class TokenStore {
	#value = $state<string | null>(null);

	/** Reads the persisted token. Safe to call before the browser is ready. */
	restore(): string | null {
		if (typeof localStorage === 'undefined') return null;

		try {
			this.#value = localStorage.getItem(TOKEN_KEY);
		} catch {
			// A browser with site data blocked still works, just without persistence.
			this.#value = null;
		}

		return this.#value;
	}

	get value(): string | null {
		return this.#value;
	}

	set(token: string): void {
		this.#value = token;
		try {
			localStorage?.setItem(TOKEN_KEY, token);
		} catch {
			// Non-fatal: the session simply will not survive a reload.
		}
	}

	clear(): void {
		this.#value = null;
		try {
			localStorage?.removeItem(TOKEN_KEY);
		} catch {
			// Nothing to undo.
		}
	}
}
