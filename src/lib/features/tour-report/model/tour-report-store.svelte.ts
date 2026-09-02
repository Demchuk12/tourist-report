import type { ExcursionDraft } from '$lib/entities/excursion/model/types';
import type { TourDraft } from '$lib/entities/tour/model/types';
import type { TouristDraft } from '$lib/entities/tourist/model/types';
import { createId } from '$lib/shared/lib/id';
import { nowIso } from '$lib/shared/lib/date';
import { compressImage } from '$lib/shared/lib/image';
import type { AttachmentRepository } from '$lib/shared/api/attachment-repository';
import {
	createEmptyData,
	type TourReportData,
	type TourReportRepository
} from '$lib/shared/api/tour-report-repository';

export class TourReportStore {
	data = $state<TourReportData>(createEmptyData());
	ready = $state(false);

	#saveQueue = Promise.resolve();

	constructor(
		private readonly repository: TourReportRepository,
		private readonly attachments: AttachmentRepository
	) {}

	async init(): Promise<void> {
		this.data = await this.repository.load();
		this.ready = true;
	}

	createTour(draft: TourDraft): void {
		const now = nowIso();
		this.data.tours.unshift({ ...draft, id: createId(), createdAt: now, updatedAt: now });
		this.persist();
	}

	updateTour(id: string, draft: TourDraft): void {
		const tour = this.data.tours.find((item) => item.id === id);
		if (!tour) return;

		Object.assign(tour, draft, { updatedAt: nowIso() });
		this.persist();
	}

	deleteTour(id: string): void {
		this.data.tours = this.data.tours.filter((item) => item.id !== id);
		this.persist();
	}

	createTourist(draft: TouristDraft): void {
		const now = nowIso();
		this.data.tourists.unshift({ ...draft, id: createId(), createdAt: now, updatedAt: now });
		this.persist();
	}

	updateTourist(id: string, draft: TouristDraft): void {
		const tourist = this.data.tourists.find((item) => item.id === id);
		if (!tourist) return;

		Object.assign(tourist, draft, { updatedAt: nowIso() });
		this.persist();
	}

	deleteTourist(id: string): void {
		this.data.tourists = this.data.tourists.filter((item) => item.id !== id);
		for (const tour of this.data.tours) {
			tour.touristIds = tour.touristIds.filter((touristId) => touristId !== id);
		}
		for (const excursion of this.data.excursions) {
			excursion.paidTouristIds = excursion.paidTouristIds.filter((touristId) => touristId !== id);
		}
		this.persist();
	}

	createExcursion(draft: ExcursionDraft): void {
		const now = nowIso();
		this.data.excursions.unshift({
			...draft,
			id: createId(),
			paidTouristIds: [],
			receipts: [],
			createdAt: now,
			updatedAt: now
		});
		this.persist();
	}

	updateExcursion(id: string, draft: ExcursionDraft): void {
		const excursion = this.data.excursions.find((item) => item.id === id);
		if (!excursion) return;

		Object.assign(excursion, draft, { updatedAt: nowIso() });
		this.persist();
	}

	deleteExcursion(id: string): void {
		const excursion = this.data.excursions.find((item) => item.id === id);

		this.data.excursions = this.data.excursions.filter((item) => item.id !== id);
		for (const tour of this.data.tours) {
			tour.excursionIds = tour.excursionIds.filter((excursionId) => excursionId !== id);
		}
		this.persist();

		// Fire-and-forget: an orphaned blob only wastes space, it never breaks the document.
		if (excursion?.receipts.length) {
			void this.attachments.remove(excursion.receipts.map((receipt) => receipt.id));
		}
	}

	/** Stores a downscaled copy of the photo and records its metadata on the excursion. */
	async addExcursionReceipt(excursionId: string, file: File): Promise<void> {
		const excursion = this.data.excursions.find((item) => item.id === excursionId);
		if (!excursion) return;

		const blob = await compressImage(file);
		const id = createId();

		// Write the blob first: metadata pointing at a missing blob is the worse failure.
		await this.attachments.save(id, blob);

		excursion.receipts.push({
			id,
			name: file.name,
			mimeType: blob.type || file.type,
			size: blob.size,
			createdAt: nowIso()
		});
		excursion.updatedAt = nowIso();
		this.persist();
	}

	setExcursionPayment(excursionId: string, touristId: string, paid: boolean): void {
		const excursion = this.data.excursions.find((item) => item.id === excursionId);
		if (!excursion) return;

		const alreadyPaid = excursion.paidTouristIds.includes(touristId);
		if (alreadyPaid === paid) return;

		excursion.paidTouristIds = paid
			? [...excursion.paidTouristIds, touristId]
			: excursion.paidTouristIds.filter((id) => id !== touristId);
		excursion.updatedAt = nowIso();
		this.persist();
	}

	/** UI reads binaries through the store, never through the repository directly. */
	readAttachment(id: string): Promise<Blob | null> {
		return this.attachments.load(id);
	}

	async deleteExcursionReceipt(excursionId: string, attachmentId: string): Promise<void> {
		const excursion = this.data.excursions.find((item) => item.id === excursionId);
		if (!excursion) return;

		excursion.receipts = excursion.receipts.filter((receipt) => receipt.id !== attachmentId);
		excursion.updatedAt = nowIso();
		this.persist();

		await this.attachments.remove([attachmentId]);
	}

	private persist(): void {
		const snapshot = $state.snapshot(this.data);
		this.#saveQueue = this.#saveQueue
			.catch(() => undefined)
			.then(() => this.repository.save(snapshot));
	}
}
