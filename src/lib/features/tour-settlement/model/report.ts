import type { Attachment } from '$lib/entities/attachment/model/types';
import type { Excursion } from '$lib/entities/excursion/model/types';
import type { Tour } from '$lib/entities/tour/model/types';
import type { Tourist } from '$lib/entities/tourist/model/types';
import {
	calculateTourSettlement,
	type SettlementLine
} from '$lib/features/tour-settlement/model/settlement';
import type { TourReportData } from '$lib/shared/api/tour-report-data';

export type ReportPaymentLine = SettlementLine & {
	/** Tourists of this tour only, split by whether they have paid. */
	paidTourists: Tourist[];
	unpaidTourists: Tourist[];
};

export type ReceiptGroup = {
	excursion: Excursion;
	receipts: Attachment[];
};

export type TourReport = {
	tour: Tour;
	tourists: Tourist[];
	lines: ReportPaymentLine[];
	receiptGroups: ReceiptGroup[];
	billableCount: number;
	excludedCount: number;
	expectedTotal: number;
	collectedTotal: number;
	outstandingTotal: number;
	receiptCount: number;
};

/**
 * View model for the printable tour report. All money comes from
 * `calculateTourSettlement` — this only adds the by-name breakdown, the
 * participant list and the receipt grouping the printed document needs.
 */
export function buildTourReport(data: TourReportData, tour: Tour): TourReport {
	const settlement = calculateTourSettlement(data, tour);
	const tourists = data.tourists.filter((tourist) => tour.touristIds.includes(tourist.id));

	const lines: ReportPaymentLine[] = settlement.lines.map((line) => ({
		...line,
		paidTourists: tourists.filter((tourist) => line.excursion.paidTouristIds.includes(tourist.id)),
		unpaidTourists: tourists.filter(
			(tourist) => !line.excursion.paidTouristIds.includes(tourist.id)
		)
	}));

	const receiptGroups = settlement.lines
		.filter((line) => line.excursion.receipts.length > 0)
		.map((line) => ({ excursion: line.excursion, receipts: line.excursion.receipts }));

	return {
		tour,
		tourists,
		lines,
		receiptGroups,
		billableCount: settlement.billableCount,
		excludedCount: settlement.excludedCount,
		expectedTotal: settlement.expectedTotal,
		collectedTotal: settlement.collectedTotal,
		outstandingTotal: settlement.expectedTotal - settlement.collectedTotal,
		receiptCount: receiptGroups.reduce((total, group) => total + group.receipts.length, 0)
	};
}

/** Every receipt id in the report, in render order — used to preload images before printing. */
export function collectReceiptIds(report: TourReport): string[] {
	return report.receiptGroups.flatMap((group) => group.receipts.map((receipt) => receipt.id));
}
