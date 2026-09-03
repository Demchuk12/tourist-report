/**
 * Metadata only — the bytes stay on the server and are fetched separately,
 * so loading an excursion never drags its receipt photos along with it.
 */
export type Attachment = {
	id: string;
	name: string;
	mimeType: string;
	size: number;
	createdAt: string;
	/**
	 * API path to the bytes. It is bearer-protected, so it cannot be used as a
	 * plain `<img src>` — read it through the store, which attaches the token.
	 */
	url: string;
};
