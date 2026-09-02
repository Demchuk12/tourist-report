/** Guard against a user picking a huge file before we even decode it. */
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const MAX_EDGE = 1600;
const QUALITY = 0.82;

export function isImageFile(file: File): boolean {
	return file.type.startsWith('image/');
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error('The image could not be decoded.'));
		image.src = url;
	});
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('The image could not be encoded.'))),
			type,
			quality
		);
	});
}

/**
 * Downscales a camera photo to something a phone-sized quota can hold. Returns
 * the original blob when it is already small enough or cannot be re-encoded,
 * so a failed optimisation never costs the user their receipt.
 */
export async function compressImage(file: File): Promise<Blob> {
	const url = URL.createObjectURL(file);

	try {
		const image = await loadImage(url);
		const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));

		// Already small and reasonably compressed — keep the bytes we were given.
		if (scale === 1 && file.size <= 600 * 1024) return file;

		const canvas = document.createElement('canvas');
		canvas.width = Math.round(image.naturalWidth * scale);
		canvas.height = Math.round(image.naturalHeight * scale);

		const context = canvas.getContext('2d');
		if (!context) return file;

		context.drawImage(image, 0, 0, canvas.width, canvas.height);
		const compressed = await canvasToBlob(canvas, 'image/jpeg', QUALITY);

		return compressed.size < file.size ? compressed : file;
	} catch {
		return file;
	} finally {
		URL.revokeObjectURL(url);
	}
}
