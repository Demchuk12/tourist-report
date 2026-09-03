import type { Excursion } from '$lib/entities/excursion/model/types';
import type { Tourist } from '$lib/entities/tourist/model/types';
import type { TourReportData } from '$lib/shared/api/tour-report-data';

export type ExcursionParticipant = {
	tourist: Tourist;
	/** Names of the tours through which this tourist joined the excursion. */
	viaTours: string[];
	paid: boolean;
};

export type PaymentSummary = {
	total: number;
	paid: number;
	expectedAmount: number;
	collectedAmount: number;
};

/**
 * There is no direct excursion → tourist relation: participation is derived
 * from the tours that include the excursion. A tourist booked through two tours
 * still appears once.
 */
export function collectParticipants(
	data: TourReportData,
	excursion: Excursion
): ExcursionParticipant[] {
	const toursByTourist = new Map<string, string[]>();

	for (const tour of data.tours) {
		if (!tour.excursionIds.includes(excursion.id)) continue;

		for (const touristId of tour.touristIds) {
			const tours = toursByTourist.get(touristId);
			if (tours) tours.push(tour.name);
			else toursByTourist.set(touristId, [tour.name]);
		}
	}

	return data.tourists
		.filter((tourist) => toursByTourist.has(tourist.id))
		.map((tourist) => ({
			tourist,
			viaTours: toursByTourist.get(tourist.id) ?? [],
			paid: excursion.paidTouristIds.includes(tourist.id)
		}));
}

export function summarisePayments(
	participants: ExcursionParticipant[],
	price: number
): PaymentSummary {
	const paid = participants.filter((participant) => participant.paid).length;

	return {
		total: participants.length,
		paid,
		expectedAmount: participants.length * price,
		collectedAmount: paid * price
	};
}
