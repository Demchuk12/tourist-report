import type { User, UserRole } from '$lib/entities/user/model/types';
import type { HttpClient } from '$lib/shared/api/http-client';

export type Credentials = {
	email: string;
	password: string;
};

export type RegistrationPayload = Credentials & {
	fullName?: string;
	role?: UserRole;
};

export type AuthSession = {
	accessToken: string;
	user: User;
};

export class AuthApi {
	constructor(private readonly http: HttpClient) {}

	/** Anonymous: a 401 here means the credentials are wrong, not that a session expired. */
	login(credentials: Credentials): Promise<AuthSession> {
		return this.http.request<AuthSession>('/auth/login', {
			method: 'POST',
			body: credentials,
			anonymous: true
		});
	}

	register(payload: RegistrationPayload): Promise<AuthSession> {
		return this.http.request<AuthSession>('/auth/register', {
			method: 'POST',
			body: payload,
			anonymous: true
		});
	}

	/** Validates a restored token and returns the account behind it. */
	me(): Promise<User> {
		return this.http.request<User>('/auth/me');
	}
}
