<script lang="ts">
	import { goto } from '$app/navigation';
	import type { TourDraft, TourStatus } from '$lib/entities/tour/model/types';
	import TourForm from '$lib/features/tour-form/ui/TourForm.svelte';
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatDate, formatDateTime } from '$lib/shared/lib/date';
	import { entityRoute } from '$lib/shared/model/navigation';
	import DetailHeader from '$lib/shared/ui/DetailHeader.svelte';
	import EmptyState from '$lib/shared/ui/EmptyState.svelte';
	import FieldList, { type DetailField } from '$lib/shared/ui/FieldList.svelte';
	import Modal from '$lib/shared/ui/Modal.svelte';
	import RelationList, { type RelationItem } from '$lib/shared/ui/RelationList.svelte';

	let { store, id }: { store: TourReportStore; id: string } = $props();

	const locale = getLocale();
	let formOpen = $state(false);

	const tour = $derived(store.data.tours.find((item) => item.id === id) ?? null);

	const statusLabels: Record<TourStatus, () => string> = {
		planned: m.status_planned,
		active: m.status_active,
		completed: m.status_completed
	};

	// Add a field to a detail page by adding one row here.
	const fields = $derived<DetailField[]>(
		tour
			? [
					{ label: m.field_destination(), value: tour.destination },
					{ label: m.field_status(), value: statusLabels[tour.status]() },
					{ label: m.field_start_date(), value: formatDate(tour.startDate, locale) },
					{ label: m.field_end_date(), value: formatDate(tour.endDate, locale) },
					{ label: m.field_notes(), value: tour.notes, wide: true },
					{ label: m.field_created_at(), value: formatDateTime(tour.createdAt, locale) },
					{ label: m.field_updated_at(), value: formatDateTime(tour.updatedAt, locale) }
				]
			: []
	);

	const tourists = $derived<RelationItem[]>(
		store.data.tourists
			.filter((tourist) => tour?.touristIds.includes(tourist.id))
			.map((tourist) => ({
				id: tourist.id,
				href: entityRoute.tourist.detail(tourist.id),
				title: tourist.fullName,
				subtitle:
					[tourist.phone, tourist.email].filter(Boolean).join(' · ') || m.search_no_contacts()
			}))
	);

	const excursions = $derived<RelationItem[]>(
		store.data.excursions
			.filter((excursion) => tour?.excursionIds.includes(excursion.id))
			.map((excursion) => ({
				id: excursion.id,
				href: entityRoute.excursion.detail(excursion.id),
				title: excursion.title,
				subtitle: `⌖ ${excursion.location}`,
				badge: `${formatDate(excursion.date, locale)}${excursion.time ? ` · ${excursion.time}` : ''}`
			}))
	);

	function save(draft: TourDraft): void {
		if (tour) store.updateTour(tour.id, draft);
		formOpen = false;
	}

	function remove(): void {
		if (!tour || !confirm(m.confirm_delete_tour({ name: tour.name }))) return;
		store.deleteTour(tour.id);
		void goto(entityRoute.tour.list);
	}
</script>

<section>
	{#if tour}
		<DetailHeader
			backHref={entityRoute.tour.list}
			eyebrow={m.nav_tours()}
			title={tour.name}
			onEdit={() => (formOpen = true)}
			onDelete={remove}
		/>

		<div class="detail-grid">
			<article class="detail-panel">
				<h2>{m.detail_information()}</h2>
				<FieldList {fields} />
			</article>

			<article class="detail-panel">
				<h2>{m.field_tourists()} <span class="count">{tourists.length}</span></h2>
				<RelationList items={tourists} emptyText={m.detail_no_tourists()} />
			</article>

			<article class="detail-panel">
				<h2>{m.field_excursions()} <span class="count">{excursions.length}</span></h2>
				<RelationList items={excursions} emptyText={m.detail_no_excursions()} />
			</article>
		</div>
	{:else}
		<EmptyState
			icon="🧭"
			title={m.not_found_title()}
			text={m.not_found_text()}
			actionLabel={m.action_back_to_list()}
			onAction={() => goto(entityRoute.tour.list)}
		/>
	{/if}
</section>

{#if formOpen && tour}
	<Modal title={m.edit_tour_title()} onClose={() => (formOpen = false)} wide>
		<TourForm
			{tour}
			tourists={store.data.tourists}
			excursions={store.data.excursions}
			onSubmit={save}
			onCancel={() => (formOpen = false)}
		/>
	</Modal>
{/if}
