<script lang="ts">
	import type { Tourist, TouristDraft } from '$lib/entities/tourist/model/types';
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import TouristForm from '$lib/features/tourist-form/ui/TouristForm.svelte';
	import * as m from '$lib/paraglide/messages';
	import EmptyState from '$lib/shared/ui/EmptyState.svelte';
	import Modal from '$lib/shared/ui/Modal.svelte';

	let { store }: { store: TourReportStore } = $props();

	let query = $state('');
	let formOpen = $state(false);
	let editing = $state<Tourist | null>(null);

	const filteredTourists = $derived(
		store.data.tourists.filter((tourist) =>
			`${tourist.fullName} ${tourist.phone} ${tourist.email}`
				.toLocaleLowerCase()
				.includes(query.trim().toLocaleLowerCase())
		)
	);

	function usageCount(id: string): number {
		return store.data.tours.filter((tour) => tour.touristIds.includes(id)).length;
	}

	function openCreate(): void {
		editing = null;
		formOpen = true;
	}

	function openEdit(tourist: Tourist): void {
		editing = tourist;
		formOpen = true;
	}

	function save(draft: TouristDraft): void {
		if (editing) store.updateTourist(editing.id, draft);
		else store.createTourist(draft);
		formOpen = false;
	}

	function remove(tourist: Tourist): void {
		if (confirm(m.confirm_delete_tourist({ name: tourist.fullName })))
			store.deleteTourist(tourist.id);
	}
</script>

<section>
	<div class="section-heading">
		<div>
			<p class="section-eyebrow">{m.nav_tourists()}</p>
			<h1>{m.tourists_title()}</h1>
			<p>{m.tourists_subtitle()}</p>
		</div>
		<button class="button primary" type="button" onclick={openCreate}
			>＋ {m.action_add_tourist()}</button
		>
	</div>

	{#if store.data.tourists.length}
		<div class="toolbar">
			<label class="search">
				<span aria-hidden="true">⌕</span>
				<input
					bind:value={query}
					placeholder={m.search_tourists()}
					aria-label={m.search_tourists()}
				/>
			</label>
			<span class="result-count">{m.items_found({ count: filteredTourists.length })}</span>
		</div>

		{#if filteredTourists.length}
			<div class="card-grid people-grid">
				{#each filteredTourists as tourist (tourist.id)}
					<article class="entity-card person-card">
						<div class="card-topline">
							<span class="avatar">{tourist.fullName.slice(0, 1).toUpperCase()}</span>
							<div class="card-actions">
								<button type="button" aria-label={m.action_edit()} onclick={() => openEdit(tourist)}
									>✎</button
								>
								<button
									class="danger"
									type="button"
									aria-label={m.action_delete()}
									onclick={() => remove(tourist)}>×</button
								>
							</div>
						</div>
						<h2>{tourist.fullName}</h2>
						<div class="contact-list">
							{#if tourist.phone}<a href={`tel:${tourist.phone}`}>{tourist.phone}</a>{/if}
							{#if tourist.email}<a href={`mailto:${tourist.email}`}>{tourist.email}</a>{/if}
							{#if tourist.documentNumber}<span>{m.document_short()}: {tourist.documentNumber}</span
								>{/if}
						</div>
						<span class="usage">{m.used_in_tours({ count: usageCount(tourist.id) })}</span>
					</article>
				{/each}
			</div>
		{:else}
			<div class="no-results">{m.no_search_results()}</div>
		{/if}
	{:else}
		<EmptyState
			icon="👤"
			title={m.empty_tourists_title()}
			text={m.empty_tourists_text()}
			actionLabel={m.action_add_tourist()}
			onAction={openCreate}
		/>
	{/if}
</section>

{#if formOpen}
	<Modal
		title={editing ? m.edit_tourist_title() : m.create_tourist_title()}
		onClose={() => (formOpen = false)}
	>
		<TouristForm tourist={editing} onSubmit={save} onCancel={() => (formOpen = false)} />
	</Modal>
{/if}
