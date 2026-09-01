import { LEGACY_STORAGE_KEY, LocalStorageTourReportRepository } from './local-storage-repository';
import {
	createEmptyData,
	isTourReportData,
	type TourReportData,
	type TourReportRepository
} from './tour-report-repository';

const DATABASE_NAME = 'tourist-report';
const DATABASE_VERSION = 1;
const STORE_NAME = 'app-data';
const DATA_KEY = 'current';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error);
		transaction.onabort = () => reject(transaction.error);
	});
}

async function openDatabase(): Promise<IDBDatabase | null> {
	if (typeof indexedDB === 'undefined') return null;

	const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
	request.onupgradeneeded = () => {
		if (!request.result.objectStoreNames.contains(STORE_NAME)) {
			request.result.createObjectStore(STORE_NAME);
		}
	};

	return requestResult(request);
}

async function readData(database: IDBDatabase): Promise<TourReportData | null> {
	const transaction = database.transaction(STORE_NAME, 'readonly');
	const value: unknown = await requestResult(transaction.objectStore(STORE_NAME).get(DATA_KEY));
	return isTourReportData(value) ? value : null;
}

async function writeData(database: IDBDatabase, data: TourReportData): Promise<void> {
	const transaction = database.transaction(STORE_NAME, 'readwrite');
	transaction.objectStore(STORE_NAME).put(data, DATA_KEY);
	await transactionDone(transaction);
}

export class IndexedDbTourReportRepository implements TourReportRepository {
	readonly #legacyRepository = new LocalStorageTourReportRepository();
	#database: Promise<IDBDatabase | null> | null = null;

	async load(): Promise<TourReportData> {
		try {
			const database = await this.getDatabase();
			if (!database) return this.#legacyRepository.load();

			const stored = await readData(database);
			if (stored) return stored;

			const legacy = await this.#legacyRepository.load();
			if (legacy.tours.length || legacy.tourists.length || legacy.excursions.length) {
				await writeData(database, legacy);
				localStorage.removeItem(LEGACY_STORAGE_KEY);
				return legacy;
			}

			return createEmptyData();
		} catch {
			return this.#legacyRepository.load();
		}
	}

	async save(data: TourReportData): Promise<void> {
		const database = await this.getDatabase();
		if (!database) return this.#legacyRepository.save(data);
		await writeData(database, data);
	}

	private getDatabase(): Promise<IDBDatabase | null> {
		this.#database ??= openDatabase();
		return this.#database;
	}
}
