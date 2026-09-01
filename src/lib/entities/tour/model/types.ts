export type TourStatus = 'planned' | 'active' | 'completed';

export type Tour = {
	id: string;
	name: string;
	destination: string;
	startDate: string;
	endDate: string;
	status: TourStatus;
	touristIds: string[];
	excursionIds: string[];
	notes: string;
	createdAt: string;
	updatedAt: string;
};

export type TourDraft = Pick<
	Tour,
	| 'name'
	| 'destination'
	| 'startDate'
	| 'endDate'
	| 'status'
	| 'touristIds'
	| 'excursionIds'
	| 'notes'
>;
