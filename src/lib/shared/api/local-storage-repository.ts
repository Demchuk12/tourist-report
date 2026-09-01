import {
	createEmptyData,
	isTourReportData,
	type TourReportData,
	type TourReportRepository
} from './tour-report-repository';

export const LEGACY_STORAGE_KEY = 'tourist-report:data:v1:app';

export class LocalStorageTourReportRepository implements TourReportRepository {
	async load(): Promise<TourReportData> {
		if (typeof localStorage === 'undefined') return createEmptyData();

		try {
			const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
			if (!stored) return createEmptyData();

			const data: unknown = JSON.parse(stored);
			return isTourReportData(data) ? data : createEmptyData();
		} catch {
			return createEmptyData();
		}
	}

	async save(data: TourReportData): Promise<void> {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));
	}
}
