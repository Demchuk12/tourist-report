<script lang="ts">
	import { excursionStatusLabels } from '$lib/entities/excursion/model/status';
	import type { Tour } from '$lib/entities/tour/model/types';
	import { calculateTourSettlement } from '$lib/features/tour-settlement/model/settlement';
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatAmount } from '$lib/shared/lib/number';
	import { entityRoute } from '$lib/shared/model/navigation';

	let { store, tour }: { store: TourReportStore; tour: Tour } = $props();

	const locale = getLocale();
	const settlement = $derived(calculateTourSettlement(store.data, tour));
</script>

{#if settlement.lines.length}
	<p class="settlement-hint">{m.settlement_hint()}</p>

	<div class="table-scroll">
		<table>
			<thead>
				<tr>
					<th>{m.nav_excursions()}</th>
					<th class="numeric">{m.field_price()}</th>
					<th class="numeric">{m.settlement_participants()}</th>
					<th class="numeric">{m.settlement_paid()}</th>
					<th class="numeric">{m.settlement_expected()}</th>
					<th class="numeric">{m.settlement_collected()}</th>
				</tr>
			</thead>

			<tbody>
				{#each settlement.lines as line (line.excursion.id)}
					<tr class:excluded={!line.billable}>
						<td>
							<a href={entityRoute.excursion.detail(line.excursion.id)}>{line.excursion.title}</a>
							<span class="status-chip {line.excursion.status}"
								>{excursionStatusLabels[line.excursion.status]()}</span
							>
						</td>
						<td class="numeric">{formatAmount(line.excursion.price, locale)}</td>
						<td class="numeric">{line.participants}</td>
						<td class="numeric">{line.paidCount}</td>
						<td class="numeric">{formatAmount(line.expectedAmount, locale)}</td>
						<td class="numeric">{formatAmount(line.collectedAmount, locale)}</td>
					</tr>
				{/each}
			</tbody>

			<tfoot>
				<tr>
					<th colspan="4">{m.settlement_total()}</th>
					<td class="numeric">{formatAmount(settlement.expectedTotal, locale)}</td>
					<td class="numeric">{formatAmount(settlement.collectedTotal, locale)}</td>
				</tr>
			</tfoot>
		</table>
	</div>

	{#if settlement.excludedCount}
		<p class="settlement-note">{m.settlement_excluded({ count: settlement.excludedCount })}</p>
	{/if}
{:else}
	<p class="settlement-empty">{m.detail_no_excursions()}</p>
{/if}

<style>
	.settlement-hint,
	.settlement-note,
	.settlement-empty {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.76rem;
		line-height: 1.5;
	}

	.settlement-hint {
		margin-bottom: 0.9rem;
	}

	.settlement-note {
		margin-top: 0.75rem;
	}

	.settlement-empty {
		padding: 1.5rem 0.25rem;
		font-size: 0.84rem;
	}

	/* Wide content scrolls inside its own container, never the page. */
	.table-scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8rem;
	}

	th,
	td {
		padding: 0.6rem 0.5rem;
		text-align: left;
		white-space: nowrap;
	}

	thead th {
		border-bottom: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.66rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	tbody td {
		border-bottom: 1px solid var(--border);
	}

	tbody td:first-child {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		white-space: normal;
	}

	td a {
		color: inherit;
		font-weight: 650;
		text-decoration: none;
	}

	td a:hover {
		text-decoration: underline;
	}

	.numeric {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	/* Pending and cancelled rows stay visible but read as "not counted". */
	.excluded {
		color: var(--text-muted);
	}

	.excluded .numeric {
		text-decoration: line-through;
	}

	.status-chip {
		display: inline-flex;
		flex: 0 0 auto;
		align-items: center;
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		font-size: 0.62rem;
		font-weight: 750;
	}

	.status-chip.completed {
		background: #d1fae5;
		color: #047857;
	}

	.status-chip.pending {
		background: #e0f2fe;
		color: #0369a1;
	}

	.status-chip.cancelled {
		background: #ffe4e6;
		color: #9f1239;
	}

	tfoot th,
	tfoot td {
		padding-top: 0.85rem;
		font-size: 0.86rem;
		font-weight: 800;
	}
</style>
