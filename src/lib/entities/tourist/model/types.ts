export type Tourist = {
	id: string;
	fullName: string;
	phone: string;
	email: string;
	documentNumber: string;
	notes: string;
	createdAt: string;
	updatedAt: string;
};

export type TouristDraft = Pick<
	Tourist,
	'fullName' | 'phone' | 'email' | 'documentNumber' | 'notes'
>;
