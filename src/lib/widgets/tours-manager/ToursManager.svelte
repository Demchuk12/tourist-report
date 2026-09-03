<script lang="ts">
	import type { Tour, TourDraft, TourStatus } from '$lib/entities/tour/model/types';
	import TourForm from '$lib/features/tour-form/ui/TourForm.svelte';
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatDateRange } from '$lib/shared/lib/date';
	import { entityRoute } from '$lib/shared/model/navigation';
	import EmptyState from '$lib/shared/ui/EmptyState.svelte';
	import Modal from '$lib/shared/ui/Modal.svelte';

	let { store }: { store: TourReportStore } = $props();

	let query = $state('');
	let formOpen = $state(false);
	let editing = $state<Tour | null>(null);

	const filteredTours = $derived(
		store.data.tours.filter((tour) =>
			`${tour.name} ${tour.destination}`
				.toLocaleLowerCase()
				.includes(query.trim().toLocaleLowerCase())
		)
	);

	const statusLabels: Record<TourStatus, () => string> = {
		planned: m.status_planned,
		active: m.status_active,
		completed: m.status_completed
	};

	function openCreate(): void {
		editing = null;
		formOpen = true;
	}

	function openEdit(tour: Tour): void {
		editing = tour;
		formOpen = true;
	}

	// The modal stays open when the request fails, so the typed values are not lost.
	async function save(draft: TourDraft): Promise<void> {
		const saved = editing
			? await store.updateTour(editing.id, draft)
			: await store.createTour(draft);
		if (saved) formOpen = false;
	}

	async function remove(tour: Tour): Promise<void> {
		if (!confirm(m.confirm_delete_tour({ name: tour.name }))) return;
		await store.deleteTour(tour.id);
	}
</script>

<section>
	<div class="section-heading">
		<div>
			<p class="section-eyebrow">{m.nav_tours()}</p>
			<h1>{m.tours_title()}</h1>
			<p>{m.tours_subtitle()}</p>
		</div>
		<button class="button primary" type="button" onclick={openCreate}
			>＋ {m.action_add_tour()}</button
		>
	</div>

	{#if store.data.tours.length}
		<div class="toolbar">
			<label class="search">
				<span aria-hidden="true">⌕</span>
				<input bind:value={query} placeholder={m.search_tours()} aria-label={m.search_tours()} />
			</label>
			<span class="result-count">{m.items_found({ count: filteredTours.length })}</span>
		</div>

		{#if filteredTours.length}
			<div class="card-grid tours-grid">
				{#each filteredTours as tour (tour.id)}
					<article class="entity-card tour-card">
						<div class="card-topline">
							<span class="status {tour.status}">{statusLabels[tour.status]()}</span>
							<div class="card-actions">
								<button
									type="button"
									aria-label={m.action_edit()}
									disabled={store.isSavingTour(tour.id)}
									onclick={() => openEdit(tour)}>✎</button
								>
								<button
									class="danger"
									type="button"
									aria-label={m.action_delete()}
									disabled={store.isSavingTour(tour.id)}
									onclick={() => remove(tour)}>×</button
								>
							</div>
						</div>

						<h2>
							<a class="card-link" href={entityRoute.tour.detail(tour.id)}>{tour.name}</a>
						</h2>
						<p class="destination">⌖ {tour.destination}</p>
						<p class="date-range">{formatDateRange(tour.startDate, tour.endDate, getLocale())}</p>

						<div class="card-metrics">
							<span><strong>{tour.touristIds.length}</strong> {m.metric_tourists()}</span>
							<span><strong>{tour.excursionIds.length}</strong> {m.metric_excursions()}</span>
						</div>
						{#if tour.notes}<p class="card-notes">{tour.notes}</p>{/if}
					</article>
				{/each}
			</div>
		{:else}
			<div class="no-results">{m.no_search_results()}</div>
		{/if}
	{:else}
		<EmptyState
			icon="🧭"
			title={m.empty_tours_title()}
			text={m.empty_tours_text()}
			actionLabel={m.action_add_tour()}
			onAction={openCreate}
		/>
	{/if}
</section>

{#if formOpen}
	<Modal
		title={editing ? m.edit_tour_title() : m.create_tour_title()}
		onClose={() => (formOpen = false)}
		wide
	>
		<TourForm
			tour={editing}
			tourists={store.data.tourists}
			excursions={store.data.excursions}
			onSubmit={save}
			onCancel={() => (formOpen = false)}
			submitting={store.isSavingTour(editing?.id)}
		/>
	</Modal>
{/if}
