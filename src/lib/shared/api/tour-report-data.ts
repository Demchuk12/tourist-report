import type { Attachment } from '$lib/entities/attachment/model/types';
import type { Excursion } from '$lib/entities/excursion/model/types';
import type { Tour } from '$lib/entities/tour/model/types';
import type { Tourist } from '$lib/entities/tourist/model/types';

/**
 * The three collections the API serves, held together as one document because
 * the dashboard, calendar, search and settlement all read across entity types.
 */
export type TourReportData = {
	tours: Tour[];
	tourists: Tourist[];
	excursions: Excursion[];
};

export function createEmptyData(): TourReportData {
	return { tours: [], tourists: [], excursions: [] };
}

/**
 * Responses are only as trustworthy as the deployment behind them — an older
 * API build, a partially migrated record, a proxy that mangles a field. Every
 * property is therefore optional on the way in and defaulted on the way out,
 * so a missing array can never crash a `.includes()` deep in a widget.
 */
type Loose<T> = { [K in keyof T]?: unknown };

const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const idList = (value: unknown): string[] =>
	Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const amount = (value: unknown): number => {
	const parsed = typeof value === 'string' ? Number(value) : value;
	return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
};

/** Maps an unknown payload through a normalizer, tolerating a non-array body. */
export function normalizeList<T>(value: unknown, normalize: (item: unknown) => T): T[] {
	return Array.isArray(value) ? value.map(normalize) : [];
}

export function normalizeTour(value: unknown): Tour {
	const tour = (value ?? {}) as Loose<Tour>;

	return {
		id: text(tour.id),
		name: text(tour.name),
		destination: text(tour.destination),
		startDate: text(tour.startDate),
		endDate: text(tour.endDate),
		status: isTourStatus(tour.status) ? tour.status : 'planned',
		touristIds: idList(tour.touristIds),
		excursionIds: idList(tour.excursionIds),
		notes: text(tour.notes),
		createdAt: text(tour.createdAt),
		updatedAt: text(tour.updatedAt)
	};
}

export function normalizeTourist(value: unknown): Tourist {
	const tourist = (value ?? {}) as Loose<Tourist>;

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

export function normalizeExcursion(value: unknown): Excursion {
	const excursion = (value ?? {}) as Loose<Excursion>;

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
		receipts: normalizeList(excursion.receipts, normalizeAttachment),
		createdAt: text(excursion.createdAt),
		updatedAt: text(excursion.updatedAt)
	};
}

export function normalizeAttachment(value: unknown): Attachment {
	const attachment = (value ?? {}) as Loose<Attachment>;

	return {
		id: text(attachment.id),
		name: text(attachment.name),
		mimeType: text(attachment.mimeType),
		size: amount(attachment.size),
		createdAt: text(attachment.createdAt),
		url: text(attachment.url)
	};
}

function isTourStatus(value: unknown): value is Tour['status'] {
	return value === 'planned' || value === 'active' || value === 'completed';
}

function isExcursionStatus(value: unknown): value is Excursion['status'] {
	return value === 'pending' || value === 'completed' || value === 'cancelled';
}
