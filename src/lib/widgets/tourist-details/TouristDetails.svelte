<script lang="ts">
	import { goto } from '$app/navigation';
	import type { TouristDraft } from '$lib/entities/tourist/model/types';
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import TouristForm from '$lib/features/tourist-form/ui/TouristForm.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatDateRange, formatDateTime } from '$lib/shared/lib/date';
	import { entityRoute } from '$lib/shared/model/navigation';
	import DetailHeader from '$lib/shared/ui/DetailHeader.svelte';
	import EmptyState from '$lib/shared/ui/EmptyState.svelte';
	import FieldList, { type DetailField } from '$lib/shared/ui/FieldList.svelte';
	import Modal from '$lib/shared/ui/Modal.svelte';
	import RelationList, { type RelationItem } from '$lib/shared/ui/RelationList.svelte';

	let { store, id }: { store: TourReportStore; id: string } = $props();

	const locale = getLocale();
	let formOpen = $state(false);

	const tourist = $derived(store.data.tourists.find((item) => item.id === id) ?? null);

	// Add a field to a detail page by adding one row here.
	const fields = $derived<DetailField[]>(
		tourist
			? [
					{
						label: m.field_phone(),
						value: tourist.phone,
						href: tourist.phone ? `tel:${tourist.phone}` : undefined
					},
					{
						label: m.field_email(),
						value: tourist.email,
						href: tourist.email ? `mailto:${tourist.email}` : undefined
					},
					{ label: m.field_document(), value: tourist.documentNumber },
					{ label: m.field_notes(), value: tourist.notes, wide: true },
					{ label: m.field_created_at(), value: formatDateTime(tourist.createdAt, locale) },
					{ label: m.field_updated_at(), value: formatDateTime(tourist.updatedAt, locale) }
				]
			: []
	);

	const relatedTours = $derived<RelationItem[]>(
		store.data.tours
			.filter((tour) => tour.touristIds.includes(id))
			.map((tour) => ({
				id: tour.id,
				href: entityRoute.tour.detail(tour.id),
				title: tour.name,
				subtitle: `⌖ ${tour.destination} · ${formatDateRange(tour.startDate, tour.endDate, locale)}`
			}))
	);

	function save(draft: TouristDraft, tourIds: string[]): void {
		if (tourist) store.updateTourist(tourist.id, draft, tourIds);
		formOpen = false;
	}

	function remove(): void {
		if (!tourist || !confirm(m.confirm_delete_tourist({ name: tourist.fullName }))) return;
		store.deleteTourist(tourist.id);
		void goto(entityRoute.tourist.list);
	}
</script>

<section>
	{#if tourist}
		<DetailHeader
			backHref={entityRoute.tourist.list}
			eyebrow={m.nav_tourists()}
			title={tourist.fullName}
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
			icon="👤"
			title={m.not_found_title()}
			text={m.not_found_text()}
			actionLabel={m.action_back_to_list()}
			onAction={() => goto(entityRoute.tourist.list)}
		/>
	{/if}
</section>

{#if formOpen && tourist}
	<Modal title={m.edit_tourist_title()} onClose={() => (formOpen = false)}>
		<TouristForm
			{tourist}
			tours={store.data.tours}
			tourIds={relatedTours.map((item) => item.id)}
			onSubmit={save}
			onCancel={() => (formOpen = false)}
		/>
	</Modal>
{/if}
