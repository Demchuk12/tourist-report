export const USER_ROLES = ['admin', 'leader'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type User = {
	id: string;
	email: string;
	fullName: string;
	role: UserRole;
	createdAt: string;
	updatedAt: string;
};
