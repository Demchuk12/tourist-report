<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ExcursionDraft } from '$lib/entities/excursion/model/types';
	import ExcursionForm from '$lib/features/excursion-form/ui/ExcursionForm.svelte';
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatDate, formatDateRange, formatDateTime } from '$lib/shared/lib/date';
	import { entityRoute } from '$lib/shared/model/navigation';
	import DetailHeader from '$lib/shared/ui/DetailHeader.svelte';
	import EmptyState from '$lib/shared/ui/EmptyState.svelte';
	import FieldList, { type DetailField } from '$lib/shared/ui/FieldList.svelte';
	import Modal from '$lib/shared/ui/Modal.svelte';
	import RelationList, { type RelationItem } from '$lib/shared/ui/RelationList.svelte';

	let { store, id }: { store: TourReportStore; id: string } = $props();

	const locale = getLocale();
	let formOpen = $state(false);

	const excursion = $derived(store.data.excursions.find((item) => item.id === id) ?? null);

	// Add a field to a detail page by adding one row here.
	const fields = $derived<DetailField[]>(
		excursion
			? [
					{ label: m.field_location(), value: excursion.location },
					{ label: m.field_date(), value: formatDate(excursion.date, locale) },
					{ label: m.field_time(), value: excursion.time },
					{ label: m.field_guide(), value: excursion.guide },
					{ label: m.field_notes(), value: excursion.notes, wide: true },
					{ label: m.field_created_at(), value: formatDateTime(excursion.createdAt, locale) },
					{ label: m.field_updated_at(), value: formatDateTime(excursion.updatedAt, locale) }
				]
			: []
	);

	const relatedTours = $derived<RelationItem[]>(
		store.data.tours
			.filter((tour) => tour.excursionIds.includes(id))
			.map((tour) => ({
				id: tour.id,
				href: entityRoute.tour.detail(tour.id),
				title: tour.name,
				subtitle: `⌖ ${tour.destination} · ${formatDateRange(tour.startDate, tour.endDate, locale)}`
			}))
	);

	function save(draft: ExcursionDraft): void {
		if (excursion) store.updateExcursion(excursion.id, draft);
		formOpen = false;
	}

	function remove(): void {
		if (!excursion || !confirm(m.confirm_delete_excursion({ name: excursion.title }))) return;
		store.deleteExcursion(excursion.id);
		void goto(entityRoute.excursion.list);
	}
</script>

<section>
	{#if excursion}
		<DetailHeader
			backHref={entityRoute.excursion.list}
			eyebrow={m.nav_excursions()}
			title={excursion.title}
			onEdit={() => (formOpen = true)}
			onDelete={remove}
		/>

		<div class="detail-grid">
			<article class="detail-panel">
				<h2>{m.detail_information()}</h2>
				<FieldList {fields} />
			</article>

			<article class="detail-panel">
				<h2>{m.detail_related_tours()} <span class="count">{relatedTours.length}</span></h2>
				<RelationList items={relatedTours} emptyText={m.detail_no_related_tours()} />
			</article>
		</div>
	{:else}
		<EmptyState
			icon="🏛"
			title={m.not_found_title()}
			text={m.not_found_text()}
			actionLabel={m.action_back_to_list()}
			onAction={() => goto(entityRoute.excursion.list)}
		/>
	{/if}
</section>

{#if formOpen && excursion}
	<Modal title={m.edit_excursion_title()} onClose={() => (formOpen = false)}>
		<ExcursionForm {excursion} onSubmit={save} onCancel={() => (formOpen = false)} />
	</Modal>
{/if}
