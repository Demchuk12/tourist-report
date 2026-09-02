import { DATA_STORE, openDatabase, requestResult, transactionDone } from './database';
import { LEGACY_STORAGE_KEY, LocalStorageTourReportRepository } from './local-storage-repository';
import {
	createEmptyData,
	parseTourReportData,
	type TourReportData,
	type TourReportRepository
} from './tour-report-repository';

const DATA_KEY = 'current';

async function readData(database: IDBDatabase): Promise<TourReportData | null> {
	const transaction = database.transaction(DATA_STORE, 'readonly');
	const value: unknown = await requestResult(transaction.objectStore(DATA_STORE).get(DATA_KEY));
	return parseTourReportData(value);
}

async function writeData(database: IDBDatabase, data: TourReportData): Promise<void> {
	const transaction = database.transaction(DATA_STORE, 'readwrite');
	transaction.objectStore(DATA_STORE).put(data, DATA_KEY);
	await transactionDone(transaction);
}

export class IndexedDbTourReportRepository implements TourReportRepository {
	readonly #legacyRepository = new LocalStorageTourReportRepository();

	async load(): Promise<TourReportData> {
		try {
			const database = await openDatabase();
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
		const database = await openDatabase();
		if (!database) return this.#legacyRepository.save(data);
		await writeData(database, data);
	}
}
