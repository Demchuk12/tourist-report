import type { Attachment } from '$lib/entities/attachment/model/types';
import type { Excursion, ExcursionDraft } from '$lib/entities/excursion/model/types';
import type { Tour, TourDraft } from '$lib/entities/tour/model/types';
import type { Tourist, TouristDraft } from '$lib/entities/tourist/model/types';
import type { HttpClient } from '$lib/shared/api/http-client';
import {
	normalizeAttachment,
	normalizeExcursion,
	normalizeList,
	normalizeTour,
	normalizeTourist,
	type TourReportData
} from '$lib/shared/api/tour-report-data';

/** A tour's relations are edited on the tour itself — the API replaces them wholesale. */
export type TourPatch = Partial<TourDraft>;

/**
 * The transport for the whole domain. It owns the URL shapes and the response
 * normalisation, and nothing above it constructs a request by hand.
 */
export class TourReportApi {
	constructor(private readonly http: HttpClient) {}

	/**
	 * One round trip per collection, in parallel: the dashboard, calendar,
	 * settlement and search all read across entity types, so a partial document
	 * would only render half a screen.
	 */
	async loadAll(signal?: AbortSignal): Promise<TourReportData> {
		const [tours, tourists, excursions] = await Promise.all([
			this.http.request<unknown>('/tours', { signal }),
			this.http.request<unknown>('/tourists', { signal }),
			this.http.request<unknown>('/excursions', { signal })
		]);

		return {
			tours: normalizeList(tours, normalizeTour),
			tourists: normalizeList(tourists, normalizeTourist),
			excursions: normalizeList(excursions, normalizeExcursion)
		};
	}

	async createTour(draft: TourDraft): Promise<Tour> {
		return normalizeTour(await this.http.request('/tours', { method: 'POST', body: draft }));
	}

	async updateTour(id: string, patch: TourPatch): Promise<Tour> {
		return normalizeTour(
			await this.http.request(`/tours/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch })
		);
	}

	async deleteTour(id: string): Promise<void> {
		await this.http.request(`/tours/${encodeURIComponent(id)}`, { method: 'DELETE' });
	}

	async createTourist(draft: TouristDraft): Promise<Tourist> {
		return normalizeTourist(await this.http.request('/tourists', { method: 'POST', body: draft }));
	}

	async updateTourist(id: string, draft: TouristDraft): Promise<Tourist> {
		return normalizeTourist(
			await this.http.request(`/tourists/${encodeURIComponent(id)}`, {
				method: 'PATCH',
				body: draft
			})
		);
	}

	async deleteTourist(id: string): Promise<void> {
		await this.http.request(`/tourists/${encodeURIComponent(id)}`, { method: 'DELETE' });
	}

	async createExcursion(draft: ExcursionDraft): Promise<Excursion> {
		return normalizeExcursion(
			await this.http.request('/excursions', { method: 'POST', body: draft })
		);
	}

	async updateExcursion(id: string, patch: Partial<ExcursionDraft>): Promise<Excursion> {
		return normalizeExcursion(
			await this.http.request(`/excursions/${encodeURIComponent(id)}`, {
				method: 'PATCH',
				body: patch
			})
		);
	}

	async deleteExcursion(id: string): Promise<void> {
		await this.http.request(`/excursions/${encodeURIComponent(id)}`, { method: 'DELETE' });
	}

	/** Payment is its own endpoint pair rather than a patch, so two leaders never clobber each other's list. */
	async setPayment(excursionId: string, touristId: string, paid: boolean): Promise<Excursion> {
		const path = `/excursions/${encodeURIComponent(excursionId)}/payments/${encodeURIComponent(touristId)}`;
		return normalizeExcursion(await this.http.request(path, { method: paid ? 'PUT' : 'DELETE' }));
	}

	async uploadReceipt(excursionId: string, blob: Blob, fileName: string): Promise<Attachment> {
		const form = new FormData();
		form.append('file', blob, fileName);

		return normalizeAttachment(
			await this.http.request(`/excursions/${encodeURIComponent(excursionId)}/receipts`, {
				method: 'POST',
				form
			})
		);
	}

	async deleteAttachment(id: string): Promise<void> {
		await this.http.request(`/attachments/${encodeURIComponent(id)}`, { method: 'DELETE' });
	}

	/** The content route is bearer-protected, so photos are fetched as bytes and shown from an object URL. */
	loadAttachmentContent(id: string): Promise<Blob> {
		return this.http.blob(`/attachments/${encodeURIComponent(id)}/content`);
	}
}
