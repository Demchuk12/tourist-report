import { getContext, setContext } from 'svelte';
import type { TourReportStore } from './tour-report-store.svelte';

const STORE_KEY = Symbol('tour-report-store');

/** Called once in the root layout — the store must not be a module singleton. */
export function setTourReportStore(store: TourReportStore): void {
	setContext(STORE_KEY, store);
}

export function getTourReportStore(): TourReportStore {
	const store = getContext<TourReportStore | undefined>(STORE_KEY);
	if (!store)
		throw new Error('TourReportStore is missing: render this page inside the root layout.');
	return store;
}
