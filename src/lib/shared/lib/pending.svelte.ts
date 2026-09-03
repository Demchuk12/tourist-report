/**
 * Reactive "is this operation in flight" bookkeeping, keyed by a caller-chosen
 * string. Counting rather than flagging matters because the same key can be
 * entered twice — uploading two receipts at once, say — and the first one to
 * finish must not clear the spinner for the second.
 */
export class PendingTracker {
	#counts = $state<Record<string, number>>({});

	/** True while at least one operation under `key` is running. */
	is(key: string): boolean {
		return (this.#counts[key] ?? 0) > 0;
	}

	/** True while any tracked operation whose key starts with `prefix` is running. */
	any(prefix = ''): boolean {
		return Object.entries(this.#counts).some(([key, count]) => count > 0 && key.startsWith(prefix));
	}

	async run<T>(key: string, task: () => Promise<T>): Promise<T> {
		this.#counts[key] = (this.#counts[key] ?? 0) + 1;

		try {
			return await task();
		} finally {
			const next = (this.#counts[key] ?? 1) - 1;
			if (next > 0) this.#counts[key] = next;
			else delete this.#counts[key];
		}
	}
}
