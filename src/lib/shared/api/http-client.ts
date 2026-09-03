/**
 * A failed request, in the one shape the UI has to handle. `status` is 0 when
 * the request never reached the server, which is the case worth wording
 * differently: the user is offline rather than doing something invalid.
 */
export class ApiError extends Error {
	readonly status: number;
	/** NestJS returns validation problems as an array; a single message becomes a one-item list. */
	readonly details: string[];

	constructor(status: number, details: string[]) {
		super(details[0] ?? `Request failed with status ${status}`);
		this.name = 'ApiError';
		this.status = status;
		this.details = details;
	}

	get isNetworkFailure(): boolean {
		return this.status === 0;
	}

	get isUnauthorized(): boolean {
		return this.status === 401;
	}

	get isNotFound(): boolean {
		return this.status === 404;
	}
}

export type RequestOptions = {
	method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
	/** Serialized as JSON. Use `form` for multipart uploads instead. */
	body?: unknown;
	form?: FormData;
	signal?: AbortSignal;
	/** Login and registration authenticate themselves — a 401 there is bad credentials, not an expired session. */
	anonymous?: boolean;
};

export type HttpClientOptions = {
	baseUrl: string;
	getToken: () => string | null;
	/** Called when an authenticated request comes back 401, i.e. the token died. */
	onUnauthorized?: () => void;
};

export class HttpClient {
	readonly #baseUrl: string;
	readonly #getToken: () => string | null;
	readonly #onUnauthorized?: () => void;

	constructor(options: HttpClientOptions) {
		this.#baseUrl = options.baseUrl;
		this.#getToken = options.getToken;
		this.#onUnauthorized = options.onUnauthorized;
	}

	/** Returns the parsed JSON body, or `null` for `204 No Content`. */
	async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
		const response = await this.#send(path, options);

		if (response.status === 204) return null as T;

		const payload: unknown = await response.json().catch(() => null);
		return payload as T;
	}

	/** Bytes rather than JSON — receipts are bearer-protected, so they cannot be linked directly. */
	async blob(path: string, options: RequestOptions = {}): Promise<Blob> {
		const response = await this.#send(path, options);
		return response.blob();
	}

	async #send(path: string, options: RequestOptions): Promise<Response> {
		const token = options.anonymous ? null : this.#getToken();
		const headers = new Headers();

		if (token) headers.set('Authorization', `Bearer ${token}`);
		// FormData must set its own multipart boundary, so only JSON is declared here.
		if (options.body !== undefined) headers.set('Content-Type', 'application/json');

		let response: Response;
		try {
			response = await fetch(`${this.#baseUrl}${path}`, {
				method: options.method ?? 'GET',
				headers,
				body:
					options.form ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
				signal: options.signal
			});
		} catch (error) {
			// AbortError is the caller's own doing — it must not look like an outage.
			if (error instanceof DOMException && error.name === 'AbortError') throw error;
			throw new ApiError(0, []);
		}

		if (response.ok) return response;

		if (response.status === 401 && token) this.#onUnauthorized?.();
		throw new ApiError(response.status, await readErrorDetails(response));
	}
}

async function readErrorDetails(response: Response): Promise<string[]> {
	const payload: unknown = await response.json().catch(() => null);
	if (!payload || typeof payload !== 'object') return [];

	const { message } = payload as { message?: unknown };
	if (typeof message === 'string') return [message];
	if (Array.isArray(message))
		return message.filter((item): item is string => typeof item === 'string');
	return [];
}
