/**
 * Metadata only — the binary lives in its own IndexedDB store, keyed by `id`.
 * Keeping blobs out of the document means saving a text field does not rewrite
 * megabytes of photos.
 */
export type Attachment = {
	id: string;
	name: string;
	mimeType: string;
	size: number;
	createdAt: string;
};
