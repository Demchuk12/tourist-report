<script lang="ts">
	import type { Excursion } from '$lib/entities/excursion/model/types';
	import {
		collectParticipants,
		summarisePayments
	} from '$lib/features/excursion-payments/model/participants';
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatAmount } from '$lib/shared/lib/number';
	import { entityRoute } from '$lib/shared/model/navigation';

	let { store, excursion }: { store: TourReportStore; excursion: Excursion } = $props();

	const locale = getLocale();

	const participants = $derived(collectParticipants(store.data, excursion));
	const summary = $derived(summarisePayments(participants, excursion.price));
</script>

{#if participants.length}
	<div class="payment-summary">
		<span class="summary-chip">
			{m.payments_summary({ paid: summary.paid, total: summary.total })}
		</span>
		{#if excursion.price > 0}
			<span class="summary-chip">
				{m.payments_collected({
					collected: formatAmount(summary.collectedAmount, locale),
					expected: formatAmount(summary.expectedAmount, locale)
				})}
			</span>
		{/if}
	</div>

	<ul class="payment-list">
		{#each participants as participant (participant.tourist.id)}
			<li>
				<a class="participant" href={entityRoute.tourist.detail(participant.tourist.id)}>
					<span class="participant-body">
						<strong>{participant.tourist.fullName}</strong>
						<small>{participant.viaTours.join(' · ')}</small>
					</span>
				</a>

				<button
					class="payment-toggle"
					class:paid={participant.paid}
					type="button"
					aria-pressed={participant.paid}
					onclick={() =>
						store.setExcursionPayment(excursion.id, participant.tourist.id, !participant.paid)}
				>
					{participant.paid ? `✓ ${m.payment_paid()}` : m.payment_unpaid()}
				</button>
			</li>
		{/each}
	</ul>
{:else}
	<p class="payments-empty">{m.payments_empty()}</p>
{/if}

<style>
	.payment-summary {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 0.75rem;
	}

	.summary-chip {
		display: inline-flex;
		align-items: center;
		min-height: 1.9rem;
		padding: 0.3rem 0.65rem;
		border-radius: 999px;
		background: var(--surface-muted);
		color: var(--text-muted);
		font-size: 0.7rem;
		font-weight: 750;
	}

	.payment-list {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.25rem;
	}

	li + li {
		border-top: 1px solid var(--border);
	}

	.participant {
		min-width: 0;
		flex: 1;
		color: inherit;
		text-decoration: none;
	}

	.participant-body {
		display: grid;
		gap: 0.15rem;
		min-width: 0;
	}

	.participant-body strong {
		overflow: hidden;
		font-size: 0.88rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.participant-body small {
		overflow: hidden;
		color: var(--text-muted);
		font-size: 0.72rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.participant:hover strong {
		text-decoration: underline;
	}

	.payment-toggle {
		flex: 0 0 auto;
		min-height: 2.2rem;
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		background: white;
		color: var(--text-muted);
		font: inherit;
		font-size: 0.72rem;
		font-weight: 750;
		cursor: pointer;
		transition:
			background 150ms ease,
			border-color 150ms ease,
			color 150ms ease;
	}

	.payment-toggle:hover {
		border-color: var(--brand);
		color: var(--brand-dark);
	}

	.payment-toggle.paid {
		border-color: #a7f3d0;
		background: #d1fae5;
		color: #047857;
	}

	.payments-empty {
		margin: 0;
		padding: 1.5rem 0.25rem;
		color: var(--text-muted);
		font-size: 0.84rem;
		line-height: 1.5;
	}

	@media (max-width: 560px) {
		li {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.5rem;
		}

		.payment-toggle {
			width: 100%;
		}
	}
</style>
