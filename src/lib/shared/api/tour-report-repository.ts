import type { Excursion } from '$lib/entities/excursion/model/types';
import type { Tour } from '$lib/entities/tour/model/types';
import type { Tourist } from '$lib/entities/tourist/model/types';

export type TourReportData = {
	version: 1;
	tours: Tour[];
	tourists: Tourist[];
	excursions: Excursion[];
};

export interface TourReportRepository {
	load(): Promise<TourReportData>;
	save(data: TourReportData): Promise<void>;
}

export function isTourReportData(value: unknown): value is TourReportData {
	if (!value || typeof value !== 'object') return false;

	const data = value as Partial<TourReportData>;
	return (
		data.version === 1 &&
		Array.isArray(data.tours) &&
		Array.isArray(data.tourists) &&
		Array.isArray(data.excursions)
	);
}

export function createEmptyData(): TourReportData {
	return { version: 1, tours: [], tourists: [], excursions: [] };
}
