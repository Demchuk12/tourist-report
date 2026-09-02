import { isBillable } from '$lib/entities/excursion/model/status';
import type { Excursion } from '$lib/entities/excursion/model/types';
import type { Tour } from '$lib/entities/tour/model/types';
import type { TourReportData } from '$lib/shared/api/tour-report-repository';

export type SettlementLine = {
	excursion: Excursion;
	/** Tourists of *this* tour — an excursion shared with another tour is billed per tour. */
	participants: number;
	paidCount: number;
	expectedAmount: number;
	collectedAmount: number;
	/** False for pending and cancelled excursions: shown, but not summed. */
	billable: boolean;
};

export type TourSettlement = {
	lines: SettlementLine[];
	billableCount: number;
	excludedCount: number;
	expectedTotal: number;
	collectedTotal: number;
};

/**
 * Money owed for a tour. Only excursions marked as having taken place count
 * toward the totals; the rest stay visible so the leader can see what is still
 * open, but contribute nothing.
 */
export function calculateTourSettlement(data: TourReportData, tour: Tour): TourSettlement {
	const lines: SettlementLine[] = data.excursions
		.filter((excursion) => tour.excursionIds.includes(excursion.id))
		.map((excursion) => {
			const participants = tour.touristIds.length;
			const paidCount = tour.touristIds.filter((touristId) =>
				excursion.paidTouristIds.includes(touristId)
			).length;

			return {
				excursion,
				participants,
				paidCount,
				expectedAmount: excursion.price * participants,
				collectedAmount: excursion.price * paidCount,
				billable: isBillable(excursion.status)
			};
		});

	const billableLines = lines.filter((line) => line.billable);

	return {
		lines,
		billableCount: billableLines.length,
		excludedCount: lines.length - billableLines.length,
		expectedTotal: billableLines.reduce((total, line) => total + line.expectedAmount, 0),
		collectedTotal: billableLines.reduce((total, line) => total + line.collectedAmount, 0)
	};
}
