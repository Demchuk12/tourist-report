<script lang="ts">
	import type { Excursion, ExcursionDraft } from '$lib/entities/excursion/model/types';
	import ExcursionForm from '$lib/features/excursion-form/ui/ExcursionForm.svelte';
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatDate } from '$lib/shared/lib/date';
	import EmptyState from '$lib/shared/ui/EmptyState.svelte';
	import Modal from '$lib/shared/ui/Modal.svelte';

	let { store }: { store: TourReportStore } = $props();

	let query = $state('');
	let formOpen = $state(false);
	let editing = $state<Excursion | null>(null);

	const filteredExcursions = $derived(
		store.data.excursions.filter((excursion) =>
			`${excursion.title} ${excursion.location} ${excursion.guide}`
				.toLocaleLowerCase()
				.includes(query.trim().toLocaleLowerCase())
		)
	);

	function usageCount(id: string): number {
		return store.data.tours.filter((tour) => tour.excursionIds.includes(id)).length;
	}

	function openCreate(): void {
		editing = null;
		formOpen = true;
	}

	function openEdit(excursion: Excursion): void {
		editing = excursion;
		formOpen = true;
	}

	function save(draft: ExcursionDraft): void {
		if (editing) store.updateExcursion(editing.id, draft);
		else store.createExcursion(draft);
		formOpen = false;
	}

	function remove(excursion: Excursion): void {
		if (confirm(m.confirm_delete_excursion({ name: excursion.title })))
			store.deleteExcursion(excursion.id);
	}
</script>

<section>
	<div class="section-heading">
		<div>
			<p class="section-eyebrow">{m.nav_excursions()}</p>
			<h1>{m.excursions_title()}</h1>
			<p>{m.excursions_subtitle()}</p>
		</div>
		<button class="button primary" type="button" onclick={openCreate}
			>＋ {m.action_add_excursion()}</button
		>
	</div>

	{#if store.data.excursions.length}
		<div class="toolbar">
			<label class="search">
				<span aria-hidden="true">⌕</span>
				<input
					bind:value={query}
					placeholder={m.search_excursions()}
					aria-label={m.search_excursions()}
				/>
			</label>
			<span class="result-count">{m.items_found({ count: filteredExcursions.length })}</span>
		</div>

		{#if filteredExcursions.length}
			<div class="card-grid excursions-grid">
				{#each filteredExcursions as excursion (excursion.id)}
					<article class="entity-card excursion-card">
						<div class="card-topline">
							<span class="date-chip">{formatDate(excursion.date, getLocale())}</span>
							<div class="card-actions">
								<button
									type="button"
									aria-label={m.action_edit()}
									onclick={() => openEdit(excursion)}>✎</button
								>
								<button
									class="danger"
									type="button"
									aria-label={m.action_delete()}
									onclick={() => remove(excursion)}>×</button
								>
							</div>
						</div>
						<h2>{excursion.title}</h2>
						<p class="destination">⌖ {excursion.location}</p>
						<div class="excursion-meta">
							<span>◷ {excursion.time}</span>
							{#if excursion.guide}<span>◎ {excursion.guide}</span>{/if}
						</div>
						<span class="usage">{m.used_in_tours({ count: usageCount(excursion.id) })}</span>
					</article>
				{/each}
			</div>
		{:else}
			<div class="no-results">{m.no_search_results()}</div>
		{/if}
	{:else}
		<EmptyState
			icon="🏛"
			title={m.empty_excursions_title()}
			text={m.empty_excursions_text()}
			actionLabel={m.action_add_excursion()}
			onAction={openCreate}
		/>
	{/if}
</section>

{#if formOpen}
	<Modal
		title={editing ? m.edit_excursion_title() : m.create_excursion_title()}
		onClose={() => (formOpen = false)}
	>
		<ExcursionForm excursion={editing} onSubmit={save} onCancel={() => (formOpen = false)} />
	</Modal>
{/if}
