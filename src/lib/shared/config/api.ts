/**
 * The single place the backend origin is decided. Everything else in the app
 * builds paths relative to this, so pointing the PWA at a deployed API is one
 * environment variable and no code change.
 */
const FALLBACK_BASE_URL = 'http://localhost:3000/api';

/** Trailing slashes are stripped so `${API_BASE_URL}/tours` is always well formed. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? FALLBACK_BASE_URL).replace(
	/\/+$/,
	''
);
