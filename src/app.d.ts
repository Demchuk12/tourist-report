// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	/** Merges into Vite's own env type, so the API origin is checked rather than `any`. */
	interface ImportMetaEnv {
		readonly VITE_API_BASE_URL?: string;
	}
}

export {};
