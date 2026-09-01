export type Excursion = {
	id: string;
	title: string;
	location: string;
	date: string;
	time: string;
	guide: string;
	notes: string;
	createdAt: string;
	updatedAt: string;
};

export type ExcursionDraft = Pick<
	Excursion,
	'title' | 'location' | 'date' | 'time' | 'guide' | 'notes'
>;
