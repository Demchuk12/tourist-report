import { getContext, setContext } from 'svelte';
import type { NotificationStore } from './notification-store.svelte';

const NOTIFICATION_KEY = Symbol('notification-store');

/** Called once in the root layout — never a module singleton. */
export function setNotificationStore(store: NotificationStore): void {
	setContext(NOTIFICATION_KEY, store);
}

export function getNotificationStore(): NotificationStore {
	const store = getContext<NotificationStore | undefined>(NOTIFICATION_KEY);
	if (!store)
		throw new Error('NotificationStore is missing: render this page inside the root layout.');
	return store;
}
