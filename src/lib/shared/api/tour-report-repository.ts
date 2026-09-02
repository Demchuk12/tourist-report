import type { Attachment } from '$lib/entities/attachment/model/types';
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

/**
 * Stored records are only as trustworthy as whatever wrote them — an older
 * build, a hand-seeded document, a partial write. Every field is therefore
 * optional on the way in and defaulted on the way out.
 */
type Loose<T> = { [K in keyof T]?: unknown };

const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const idList = (value: unknown): string[] =>
	Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const amount = (value: unknown): number =>
	typeof value === 'number' && !Number.isNaN(value) ? value : 0;

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
		tours: (data.tours as Loose<Tour>[]).map(normalizeTour),
		tourists: (data.tourists as Loose<Tourist>[]).map(normalizeTourist),
		excursions: (data.excursions as Loose<Excursion>[]).map(normalizeExcursion)
	};
}

function normalizeTour(tour: Loose<Tour>): Tour {
	return {
		id: text(tour.id),
		name: text(tour.name),
		destination: text(tour.destination),
		startDate: text(tour.startDate),
		endDate: text(tour.endDate),
		status: isTourStatus(tour.status) ? tour.status : 'planned',
		// Missing relation arrays were the cause of a blank tour page: every
		// consumer calls .includes() on these without checking.
		touristIds: idList(tour.touristIds),
		excursionIds: idList(tour.excursionIds),
		notes: text(tour.notes),
		createdAt: text(tour.createdAt),
		updatedAt: text(tour.updatedAt)
	};
}

function normalizeTourist(tourist: Loose<Tourist>): Tourist {
	return {
		id: text(tourist.id),
		fullName: text(tourist.fullName),
		phone: text(tourist.phone),
		email: text(tourist.email),
		documentNumber: text(tourist.documentNumber),
		notes: text(tourist.notes),
		createdAt: text(tourist.createdAt),
		updatedAt: text(tourist.updatedAt)
	};
}

function normalizeExcursion(excursion: Loose<Excursion>): Excursion {
	return {
		id: text(excursion.id),
		title: text(excursion.title),
		location: text(excursion.location),
		date: text(excursion.date),
		time: text(excursion.time),
		guide: text(excursion.guide),
		notes: text(excursion.notes),
		price: amount(excursion.price),
		// Literals rather than imported constants: `shared` must not depend on
		// `entities` at runtime. The types still check the values.
		status: isExcursionStatus(excursion.status) ? excursion.status : 'pending',
		paidTouristIds: idList(excursion.paidTouristIds),
		receipts: Array.isArray(excursion.receipts) ? (excursion.receipts as Attachment[]) : [],
		createdAt: text(excursion.createdAt),
		updatedAt: text(excursion.updatedAt)
	};
}

function isTourStatus(value: unknown): value is Tour['status'] {
	return value === 'planned' || value === 'active' || value === 'completed';
}

function isExcursionStatus(value: unknown): value is Excursion['status'] {
	return value === 'pending' || value === 'completed' || value === 'cancelled';
}

export function createEmptyData(): TourReportData {
	return { version: DATA_VERSION, tours: [], tourists: [], excursions: [] };
}
