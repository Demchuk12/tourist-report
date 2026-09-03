<script lang="ts">
	import { goto } from '$app/navigation';
	import { EXCURSION_STATUSES, excursionStatusLabels } from '$lib/entities/excursion/model/status';
	import type { ExcursionDraft } from '$lib/entities/excursion/model/types';
	import ExcursionForm from '$lib/features/excursion-form/ui/ExcursionForm.svelte';
	import ExcursionPayments from '$lib/features/excursion-payments/ui/ExcursionPayments.svelte';
	import ExcursionReceipts from '$lib/features/excursion-receipts/ui/ExcursionReceipts.svelte';
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatDate, formatDateRange, formatDateTime } from '$lib/shared/lib/date';
	import { formatAmount } from '$lib/shared/lib/number';
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
					{ label: m.field_price(), value: formatAmount(excursion.price, locale) },
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

	async function save(draft: ExcursionDraft): Promise<void> {
		if (!excursion) return;
		if (await store.updateExcursion(excursion.id, draft)) formOpen = false;
	}

	// Navigating away is the confirmation, so it waits for the request to succeed.
	async function remove(): Promise<void> {
		if (!excursion || !confirm(m.confirm_delete_excursion({ name: excursion.title }))) return;
		if (await store.deleteExcursion(excursion.id)) void goto(entityRoute.excursion.list);
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
			busy={store.isSavingExcursion(excursion.id)}
		/>

		<div class="detail-grid">
			<article class="detail-panel">
				<h2>{m.detail_information()}</h2>

				<div class="status-switch" role="group" aria-label={m.field_status()}>
					{#each EXCURSION_STATUSES as status (status)}
						<button
							class="status-option {status}"
							class:selected={excursion.status === status}
							type="button"
							aria-pressed={excursion.status === status}
							disabled={store.isSavingExcursion(excursion.id)}
							onclick={() => store.setExcursionStatus(excursion.id, status)}
						>
							{excursionStatusLabels[status]()}
						</button>
					{/each}
				</div>

				<FieldList {fields} />
			</article>

			<article class="detail-panel">
				<h2>{m.payments_title()}</h2>
				<ExcursionPayments {store} {excursion} />
			</article>

			<article class="detail-panel">
				<h2>{m.receipts_title()} <span class="count">{excursion.receipts.length}</span></h2>
				<ExcursionReceipts {store} {excursion} />
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
		<ExcursionForm
			{excursion}
			onSubmit={save}
			onCancel={() => (formOpen = false)}
			submitting={store.isSavingExcursion(excursion.id)}
		/>
	</Modal>
{/if}

<style>
	/* One tap to record what happened, without opening the edit form. */
	.status-switch {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 1.35rem;
	}

	.status-option {
		min-height: 2.3rem;
		padding: 0.4rem 0.8rem;
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		background: white;
		color: var(--text-muted);
		font: inherit;
		font-size: 0.74rem;
		font-weight: 750;
		cursor: pointer;
		transition:
			background 150ms ease,
			border-color 150ms ease,
			color 150ms ease;
	}

	.status-option:hover {
		border-color: var(--brand);
		color: var(--brand-dark);
	}

	.status-option.selected.completed {
		border-color: #a7f3d0;
		background: #d1fae5;
		color: #047857;
	}

	.status-option.selected.pending {
		border-color: #bae6fd;
		background: #e0f2fe;
		color: #0369a1;
	}

	.status-option.selected.cancelled {
		border-color: #fecdd3;
		background: #ffe4e6;
		color: #9f1239;
	}

	@media (max-width: 560px) {
		.status-option {
			flex: 1;
		}
	}
</style>
