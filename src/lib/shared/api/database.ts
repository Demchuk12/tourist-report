const DATABASE_NAME = 'tourist-report';
const DATABASE_VERSION = 2;

export const DATA_STORE = 'app-data';
export const ATTACHMENT_STORE = 'attachments';

let connection: Promise<IDBDatabase | null> | null = null;

export function requestResult<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export function transactionDone(transaction: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error);
		transaction.onabort = () => reject(transaction.error);
	});
}

/**
 * One connection shared by every repository — two repositories opening the same
 * database at different versions would block each other.
 */
export function openDatabase(): Promise<IDBDatabase | null> {
	connection ??= open();
	return connection;
}

function open(): Promise<IDBDatabase | null> {
	if (typeof indexedDB === 'undefined') return Promise.resolve(null);

	const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

	// Runs for a fresh database and for the v1 → v2 upgrade alike.
	request.onupgradeneeded = () => {
		const database = request.result;
		if (!database.objectStoreNames.contains(DATA_STORE)) database.createObjectStore(DATA_STORE);
		if (!database.objectStoreNames.contains(ATTACHMENT_STORE)) {
			database.createObjectStore(ATTACHMENT_STORE);
		}
	};

	return requestResult(request);
}
