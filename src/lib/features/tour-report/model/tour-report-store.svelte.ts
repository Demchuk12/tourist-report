import type { ExcursionStatus } from '$lib/entities/excursion/model/status';
import type { Excursion, ExcursionDraft } from '$lib/entities/excursion/model/types';
import type { Tour, TourDraft } from '$lib/entities/tour/model/types';
import type { TouristDraft } from '$lib/entities/tourist/model/types';
import {
	describeError,
	type NotificationStore
} from '$lib/features/notifications/model/notification-store.svelte';
import * as m from '$lib/paraglide/messages';
import { ApiError } from '$lib/shared/api/http-client';
import { createEmptyData, type TourReportData } from '$lib/shared/api/tour-report-data';
import type { TourReportApi } from '$lib/shared/api/tour-report-api';
import { compressImage } from '$lib/shared/lib/image';
import { PendingTracker } from '$lib/shared/lib/pending.svelte';

/** Pending keys are built here so no component has to know their shape. */
const key = {
	data: 'data',
	tour: (id = 'create') => `tour:${id}`,
	tourist: (id = 'create') => `tourist:${id}`,
	excursion: (id = 'create') => `excursion:${id}`,
	payment: (excursionId: string, touristId: string) => `payment:${excursionId}:${touristId}`,
	receiptUpload: (excursionId: string) => `receipt-upload:${excursionId}`,
	receiptDelete: (attachmentId: string) => `receipt-delete:${attachmentId}`
};

/**
 * The only place domain data is read from or written to the API. Components
 * call these methods and read `data`; they never touch `TourReportApi`.
 *
 * Every mutation is write-through: the request goes out first, and local state
 * is replaced with the entity the server returned. That keeps `createdAt` /
 * `updatedAt` and any server-side normalisation honest, at the cost of the
 * button being busy for a moment — which is what the pending flags are for.
 */
export class TourReportStore {
	data = $state<TourReportData>(createEmptyData());
	/** False until the first load resolves — the shell gates rendering on it. */
	ready = $state(false);
	/** Set when the initial load failed, so the shell can offer a retry instead of an empty app. */
	loadError = $state('');

	readonly pending = new PendingTracker();

	/**
	 * Receipt bytes, kept per session so revisiting an excursion does not refetch
	 * photos. A plain Map on purpose: components read it through `readAttachment`
	 * and hold the result themselves, so nothing renders off the cache directly.
	 */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	readonly #attachmentCache = new Map<string, Blob>();

	constructor(
		private readonly api: TourReportApi,
		private readonly notifications: NotificationStore
	) {}

	get loading(): boolean {
		return this.pending.is(key.data);
	}

	/** Fetches the whole document. Safe to call again — the shell retries through it. */
	async init(): Promise<void> {
		this.loadError = '';

		try {
			this.data = await this.pending.run(key.data, () => this.api.loadAll());
			this.ready = true;
		} catch (error) {
			// A 401 is already being handled by the session, which swaps in the auth screen.
			if (error instanceof ApiError && error.isUnauthorized) return;

			this.loadError = describeError(error);
			this.notifications.fromError(error, m.error_load_failed());
		}
	}

	/** Drops everything held for the previous account. */
	reset(): void {
		this.data = createEmptyData();
		this.ready = false;
		this.loadError = '';
		this.#attachmentCache.clear();
	}

	// ---------------------------------------------------------------- tours

	createTour(draft: TourDraft): Promise<boolean> {
		return this.#mutate(key.tour(), m.notify_tour_created(), async () => {
			const tour = await this.api.createTour(draft);
			this.data.tours = [tour, ...this.data.tours];
		});
	}

	updateTour(id: string, draft: TourDraft): Promise<boolean> {
		return this.#mutate(key.tour(id), m.notify_tour_updated(), async () => {
			this.#replaceTour(await this.api.updateTour(id, draft));
		});
	}

	deleteTour(id: string): Promise<boolean> {
		return this.#mutate(key.tour(id), m.notify_tour_deleted(), async () => {
			await this.api.deleteTour(id);
			this.data.tours = this.data.tours.filter((item) => item.id !== id);
		});
	}

	// ------------------------------------------------------------- tourists

	createTourist(draft: TouristDraft, tourIds: string[] = []): Promise<boolean> {
		return this.#mutate(key.tourist(), m.notify_tourist_created(), async () => {
			const tourist = await this.api.createTourist(draft);
			this.data.tourists = [tourist, ...this.data.tourists];
			await this.#syncTourMembership(tourist.id, tourIds);
		});
	}

	updateTourist(id: string, draft: TouristDraft, tourIds?: string[]): Promise<boolean> {
		return this.#mutate(key.tourist(id), m.notify_tourist_updated(), async () => {
			const tourist = await this.api.updateTourist(id, draft);
			this.data.tourists = this.data.tourists.map((item) => (item.id === id ? tourist : item));
			if (tourIds) await this.#syncTourMembership(id, tourIds);
		});
	}

	deleteTourist(id: string): Promise<boolean> {
		return this.#mutate(key.tourist(id), m.notify_tourist_deleted(), async () => {
			await this.api.deleteTourist(id);

			this.data.tourists = this.data.tourists.filter((item) => item.id !== id);
			// The API cascades the same cleanup; mirroring it locally saves a full reload.
			this.data.tours = this.data.tours.map((tour) =>
				tour.touristIds.includes(id)
					? { ...tour, touristIds: tour.touristIds.filter((touristId) => touristId !== id) }
					: tour
			);
			this.data.excursions = this.data.excursions.map((excursion) =>
				excursion.paidTouristIds.includes(id)
					? {
							...excursion,
							paidTouristIds: excursion.paidTouristIds.filter((touristId) => touristId !== id)
						}
					: excursion
			);
		});
	}

	/**
	 * Tour membership lives on `Tour.touristIds`, so the tourist form edits it
	 * from the other side — one PATCH per tour whose membership actually
	 * changed, rather than rewriting every tour on every save.
	 */
	async #syncTourMembership(touristId: string, tourIds: string[]): Promise<void> {
		const changed = this.data.tours.filter(
			(tour) => tourIds.includes(tour.id) !== tour.touristIds.includes(touristId)
		);

		for (const tour of changed) {
			const touristIds = tourIds.includes(tour.id)
				? [...tour.touristIds, touristId]
				: tour.touristIds.filter((id) => id !== touristId);

			this.#replaceTour(await this.api.updateTour(tour.id, { touristIds }));
		}
	}

	// ----------------------------------------------------------- excursions

	createExcursion(draft: ExcursionDraft): Promise<boolean> {
		return this.#mutate(key.excursion(), m.notify_excursion_created(), async () => {
			const excursion = await this.api.createExcursion(draft);
			this.data.excursions = [excursion, ...this.data.excursions];
		});
	}

	updateExcursion(id: string, draft: ExcursionDraft): Promise<boolean> {
		return this.#mutate(key.excursion(id), m.notify_excursion_updated(), async () => {
			this.#replaceExcursion(await this.api.updateExcursion(id, draft));
		});
	}

	deleteExcursion(id: string): Promise<boolean> {
		return this.#mutate(key.excursion(id), m.notify_excursion_deleted(), async () => {
			const removed = this.data.excursions.find((item) => item.id === id);

			await this.api.deleteExcursion(id);

			this.data.excursions = this.data.excursions.filter((item) => item.id !== id);
			this.data.tours = this.data.tours.map((tour) =>
				tour.excursionIds.includes(id)
					? { ...tour, excursionIds: tour.excursionIds.filter((item) => item !== id) }
					: tour
			);

			for (const receipt of removed?.receipts ?? []) this.#attachmentCache.delete(receipt.id);
		});
	}

	/** One tap to record what happened, so it stays quiet on success. */
	setExcursionStatus(id: string, status: ExcursionStatus): Promise<boolean> {
		const excursion = this.data.excursions.find((item) => item.id === id);
		if (!excursion || excursion.status === status) return Promise.resolve(true);

		return this.#mutate(key.excursion(id), '', async () => {
			this.#replaceExcursion(await this.api.updateExcursion(id, { status }));
		});
	}

	setExcursionPayment(excursionId: string, touristId: string, paid: boolean): Promise<boolean> {
		const excursion = this.data.excursions.find((item) => item.id === excursionId);
		if (!excursion || excursion.paidTouristIds.includes(touristId) === paid) {
			return Promise.resolve(true);
		}

		return this.#mutate(key.payment(excursionId, touristId), '', async () => {
			this.#replaceExcursion(await this.api.setPayment(excursionId, touristId, paid));
		});
	}

	// ------------------------------------------------------------- receipts

	/** Uploads a downscaled copy of the photo; the API returns the stored metadata. */
	addExcursionReceipt(excursionId: string, file: File): Promise<boolean> {
		return this.#mutate(
			key.receiptUpload(excursionId),
			m.notify_receipt_added(),
			async () => {
				const blob = await compressImage(file);
				const attachment = await this.api.uploadReceipt(excursionId, blob, file.name);

				// Seed the cache from the bytes already in memory — no round trip to show it.
				this.#attachmentCache.set(attachment.id, blob);

				const excursion = this.#requireExcursion(excursionId);
				this.#replaceExcursion({ ...excursion, receipts: [...excursion.receipts, attachment] });
			},
			m.error_receipt_upload()
		);
	}

	deleteExcursionReceipt(excursionId: string, attachmentId: string): Promise<boolean> {
		return this.#mutate(key.receiptDelete(attachmentId), m.notify_receipt_deleted(), async () => {
			await this.api.deleteAttachment(attachmentId);

			const excursion = this.#requireExcursion(excursionId);
			this.#replaceExcursion({
				...excursion,
				receipts: excursion.receipts.filter((receipt) => receipt.id !== attachmentId)
			});
			this.#attachmentCache.delete(attachmentId);
		});
	}

	/**
	 * Receipt bytes. The content route is bearer-protected, so a photo cannot be
	 * an `<img src>` — callers turn this blob into an object URL. Returns null on
	 * failure rather than throwing: one unreachable photo must not blank a page.
	 */
	async readAttachment(id: string): Promise<Blob | null> {
		const cached = this.#attachmentCache.get(id);
		if (cached) return cached;

		try {
			const blob = await this.api.loadAttachmentContent(id);
			this.#attachmentCache.set(id, blob);
			return blob;
		} catch (error) {
			this.notifications.fromError(error, m.error_receipt_load());
			return null;
		}
	}

	// ------------------------------------------------------- pending flags

	isSavingTour(id?: string): boolean {
		return this.pending.is(key.tour(id));
	}

	isSavingTourist(id?: string): boolean {
		return this.pending.is(key.tourist(id));
	}

	isSavingExcursion(id?: string): boolean {
		return this.pending.is(key.excursion(id));
	}

	isSavingPayment(excursionId: string, touristId: string): boolean {
		return this.pending.is(key.payment(excursionId, touristId));
	}

	isUploadingReceipt(excursionId: string): boolean {
		return this.pending.is(key.receiptUpload(excursionId));
	}

	isDeletingReceipt(attachmentId: string): boolean {
		return this.pending.is(key.receiptDelete(attachmentId));
	}

	// ------------------------------------------------------------ internals

	/**
	 * The shape every mutation shares: track it as pending, report the outcome
	 * once, and tell the caller whether it may close its form. An empty
	 * `successTitle` keeps a high-frequency toggle from spamming the toast stack.
	 */
	async #mutate(
		pendingKey: string,
		successTitle: string,
		task: () => Promise<void>,
		errorTitle = m.error_save_failed()
	): Promise<boolean> {
		try {
			await this.pending.run(pendingKey, task);
			if (successTitle) this.notifications.success(successTitle);
			return true;
		} catch (error) {
			this.notifications.fromError(error, errorTitle);
			return false;
		}
	}

	#replaceTour(tour: Tour): void {
		this.data.tours = this.data.tours.map((item) => (item.id === tour.id ? tour : item));
	}

	#replaceExcursion(excursion: Excursion): void {
		this.data.excursions = this.data.excursions.map((item) =>
			item.id === excursion.id ? excursion : item
		);
	}

	#requireExcursion(id: string): Excursion {
		const excursion = this.data.excursions.find((item) => item.id === id);
		if (!excursion) throw new Error(`Excursion ${id} is not loaded.`);
		return excursion;
	}
}
