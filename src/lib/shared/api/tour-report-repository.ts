import type { Excursion } from '$lib/entities/excursion/model/types';
import type { Tour } from '$lib/entities/tour/model/types';
import type { Tourist } from '$lib/entities/tourist/model/types';

/** Bump when the stored shape changes, and extend `parseTourReportData` to migrate. */
export const DATA_VERSION = 2;

export type TourReportData = {
	version: typeof DATA_VERSION;
	tours: Tour[];
	tourists: Tourist[];
	excursions: Excursion[];
};

export interface TourReportRepository {
	load(): Promise<TourReportData>;
	save(data: TourReportData): Promise<void>;
}

type StoredShape = {
	version?: unknown;
	tours?: unknown;
	tourists?: unknown;
	excursions?: unknown;
};

/** Fields added after v1: older documents simply lack them. */
type AddedExcursionFields = 'receipts' | 'price' | 'paidTouristIds';
type LegacyExcursion = Omit<Excursion, AddedExcursionFields> &
	Partial<Pick<Excursion, AddedExcursionFields>>;

/**
 * Validates and upgrades whatever is on disk. Returns null when the value is
 * not recognisable data at all, so callers can fall back to an empty document.
 */
export function parseTourReportData(value: unknown): TourReportData | null {
	if (!value || typeof value !== 'object') return null;

	const data = value as StoredShape;
	if (data.version !== 1 && data.version !== DATA_VERSION) return null;
	if (!Array.isArray(data.tours) || !Array.isArray(data.tourists)) return null;
	if (!Array.isArray(data.excursions)) return null;

	return {
		version: DATA_VERSION,
		tours: data.tours as Tour[],
		tourists: data.tourists as Tourist[],
		// Purely additive fields are defaulted rather than version-branched, so a
		// document written by any earlier build loads without a dedicated step.
		excursions: (data.excursions as LegacyExcursion[]).map((excursion) => ({
			...excursion,
			receipts: excursion.receipts ?? [],
			price: excursion.price ?? 0,
			paidTouristIds: excursion.paidTouristIds ?? []
		}))
	};
}

export function createEmptyData(): TourReportData {
	return { version: DATA_VERSION, tours: [], tourists: [], excursions: [] };
}
