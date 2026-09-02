import type { Attachment } from '$lib/entities/attachment/model/types';

export type Excursion = {
	id: string;
	title: string;
	location: string;
	date: string;
	time: string;
	guide: string;
	notes: string;
	/** Price per participant. */
	price: number;
	/**
	 * Participants are derived from the tours this excursion belongs to, so only
	 * the paid ones are stored here — anyone absent from the list is unpaid.
	 */
	paidTouristIds: string[];
	/** Receipt photos for the group leader's reporting; managed outside the form. */
	receipts: Attachment[];
	createdAt: string;
	updatedAt: string;
};

export type ExcursionDraft = Pick<
	Excursion,
	'title' | 'location' | 'date' | 'time' | 'guide' | 'notes' | 'price'
>;
