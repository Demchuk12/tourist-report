import { getContext, setContext } from 'svelte';
import type { SessionStore } from './session-store.svelte';

const SESSION_KEY = Symbol('session-store');

/** Called once in the root layout — never a module singleton. */
export function setSessionStore(store: SessionStore): void {
	setContext(SESSION_KEY, store);
}

export function getSessionStore(): SessionStore {
	const store = getContext<SessionStore | undefined>(SESSION_KEY);
	if (!store) throw new Error('SessionStore is missing: render this page inside the root layout.');
	return store;
}
