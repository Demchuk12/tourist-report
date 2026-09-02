import {
	ATTACHMENT_STORE,
	openDatabase,
	requestResult,
	transactionDone
} from '$lib/shared/api/database';

export interface AttachmentRepository {
	save(id: string, blob: Blob): Promise<void>;
	load(id: string): Promise<Blob | null>;
	remove(ids: string[]): Promise<void>;
}

export class AttachmentStorageUnavailableError extends Error {
	constructor() {
		super('Attachment storage is unavailable in this browser.');
		this.name = 'AttachmentStorageUnavailableError';
	}
}

export class IndexedDbAttachmentRepository implements AttachmentRepository {
	async save(id: string, blob: Blob): Promise<void> {
		const database = await openDatabase();
		// Unlike the document repository there is no localStorage fallback:
		// blobs would not fit, so failing loudly beats silently losing a photo.
		if (!database) throw new AttachmentStorageUnavailableError();

		const transaction = database.transaction(ATTACHMENT_STORE, 'readwrite');
		transaction.objectStore(ATTACHMENT_STORE).put(blob, id);
		await transactionDone(transaction);
	}

	async load(id: string): Promise<Blob | null> {
		const database = await openDatabase();
		if (!database) return null;

		const transaction = database.transaction(ATTACHMENT_STORE, 'readonly');
		const value: unknown = await requestResult(transaction.objectStore(ATTACHMENT_STORE).get(id));
		return value instanceof Blob ? value : null;
	}

	async remove(ids: string[]): Promise<void> {
		if (!ids.length) return;

		const database = await openDatabase();
		if (!database) return;

		const transaction = database.transaction(ATTACHMENT_STORE, 'readwrite');
		const store = transaction.objectStore(ATTACHMENT_STORE);
		for (const id of ids) store.delete(id);
		await transactionDone(transaction);
	}
}
