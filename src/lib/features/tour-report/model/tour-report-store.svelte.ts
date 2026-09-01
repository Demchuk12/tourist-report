import type { ExcursionDraft } from '$lib/entities/excursion/model/types';
import type { TourDraft } from '$lib/entities/tour/model/types';
import type { TouristDraft } from '$lib/entities/tourist/model/types';
import { createId } from '$lib/shared/lib/id';
import { nowIso } from '$lib/shared/lib/date';
import {
	createEmptyData,
	type TourReportData,
	type TourReportRepository
} from '$lib/shared/api/tour-report-repository';

export class TourReportStore {
	data = $state<TourReportData>(createEmptyData());
	ready = $state(false);

	#saveQueue = Promise.resolve();

	constructor(private readonly repository: TourReportRepository) {}

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
		this.persist();
	}

	createExcursion(draft: ExcursionDraft): void {
		const now = nowIso();
		this.data.excursions.unshift({ ...draft, id: createId(), createdAt: now, updatedAt: now });
		this.persist();
	}

	updateExcursion(id: string, draft: ExcursionDraft): void {
		const excursion = this.data.excursions.find((item) => item.id === id);
		if (!excursion) return;

		Object.assign(excursion, draft, { updatedAt: nowIso() });
		this.persist();
	}

	deleteExcursion(id: string): void {
		this.data.excursions = this.data.excursions.filter((item) => item.id !== id);
		for (const tour of this.data.tours) {
			tour.excursionIds = tour.excursionIds.filter((excursionId) => excursionId !== id);
		}
		this.persist();
	}

	private persist(): void {
		const snapshot = $state.snapshot(this.data);
		this.#saveQueue = this.#saveQueue
			.catch(() => undefined)
			.then(() => this.repository.save(snapshot));
	}
}
