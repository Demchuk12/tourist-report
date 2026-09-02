import * as m from '$lib/paraglide/messages';

export const EXCURSION_STATUSES = ['pending', 'completed', 'cancelled'] as const;

export type ExcursionStatus = (typeof EXCURSION_STATUSES)[number];

export const EXCURSION_STATUS_FALLBACK: ExcursionStatus = 'pending';

/** Single source of truth for status labels — form, list card and detail share it. */
export const excursionStatusLabels: Record<ExcursionStatus, () => string> = {
	pending: m.excursion_status_pending,
	completed: m.excursion_status_completed,
	cancelled: m.excursion_status_cancelled
};

/** Only excursions that actually took place are billable. */
export function isBillable(status: ExcursionStatus): boolean {
	return status === 'completed';
}
