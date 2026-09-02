<script lang="ts">
	import { onDestroy, tick, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { excursionStatusLabels } from '$lib/entities/excursion/model/status';
	import type { TourStatus } from '$lib/entities/tour/model/types';
	import { buildTourReport, collectReceiptIds } from '$lib/features/tour-settlement/model/report';
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatDate, formatDateRange, formatDateTime } from '$lib/shared/lib/date';
	import { nowIso } from '$lib/shared/lib/date';
	import { formatAmount } from '$lib/shared/lib/number';
	import { entityRoute } from '$lib/shared/model/navigation';
	import EmptyState from '$lib/shared/ui/EmptyState.svelte';

	let { store, id }: { store: TourReportStore; id: string } = $props();

	const locale = getLocale();
	const generatedAt = nowIso();

	let documentElement = $state<HTMLElement | null>(null);
	let preparing = $state(false);

	const tour = $derived(store.data.tours.find((item) => item.id === id) ?? null);
	const report = $derived(tour ? buildTourReport(store.data, tour) : null);

	const tourStatusLabels: Record<TourStatus, () => string> = {
		planned: m.status_planned,
		active: m.status_active,
		completed: m.status_completed
	};

	// Object URLs for receipt photos, revoked when they leave the report.
	const previews = $state<Record<string, string>>({});

	$effect(() => {
		const ids = report ? collectReceiptIds(report) : [];
		let cancelled = false;

		untrack(() => {
			for (const receiptId of ids) {
				if (previews[receiptId]) continue;

				void store.readAttachment(receiptId).then((blob) => {
					if (cancelled || !blob) return;
					previews[receiptId] = URL.createObjectURL(blob);
				});
			}

			for (const key of Object.keys(previews)) {
				if (ids.includes(key)) continue;
				URL.revokeObjectURL(previews[key]);
				delete previews[key];
			}
		});

		return () => {
			cancelled = true;
		};
	});

	onDestroy(() => {
		for (const url of Object.values(previews)) URL.revokeObjectURL(url);
	});

	/**
	 * window.print() does not wait for images: printing before they decode leaves
	 * blank gaps where the receipts should be. A single broken photo must not
	 * block the report, so every decode failure is swallowed.
	 */
	async function print(): Promise<void> {
		preparing = true;

		try {
			await tick();
			const images = [...(documentElement?.querySelectorAll('img') ?? [])];
			await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
		} finally {
			preparing = false;
		}

		await tick();
		window.print();
	}
</script>

{#if tour && report}
	<section class="report" bind:this={documentElement}>
		<div class="report-actions">
			<a class="button ghost" href={entityRoute.tour.detail(tour.id)}>‹ {m.action_back()}</a>
			<button class="button primary" type="button" disabled={preparing} onclick={print}>
				{preparing ? m.report_preparing() : `⎙ ${m.action_print()}`}
			</button>
		</div>

		<header class="report-header">
			<p class="report-eyebrow">{m.report_title()}</p>
			<h1>{tour.name}</h1>
			<p class="report-subline">
				⌖ {tour.destination} · {formatDateRange(tour.startDate, tour.endDate, locale)} ·
				{tourStatusLabels[tour.status]()}
			</p>
			<p class="report-generated">
				{m.report_generated_at({ date: formatDateTime(generatedAt, locale) })}
			</p>
		</header>

		<section class="summary-grid">
			<div>
				<span>{m.metric_all_tourists()}</span>
				<strong>{report.tourists.length}</strong>
			</div>
			<div>
				<span>{m.settlement_billable()}</span>
				<strong>{report.billableCount}</strong>
			</div>
			<div>
				<span>{m.settlement_expected()}</span>
				<strong>{formatAmount(report.expectedTotal, locale)}</strong>
			</div>
			<div>
				<span>{m.settlement_collected()}</span>
				<strong>{formatAmount(report.collectedTotal, locale)}</strong>
			</div>
			<div class:outstanding={report.outstandingTotal > 0}>
				<span>{m.report_outstanding()}</span>
				<strong>{formatAmount(report.outstandingTotal, locale)}</strong>
			</div>
		</section>

		<section class="report-section">
			<h2>{m.settlement_title()}</h2>
			<p class="report-note">{m.settlement_hint()}</p>

			{#if report.lines.length}
				<table>
					<thead>
						<tr>
							<th>{m.nav_excursions()}</th>
							<th>{m.field_date()}</th>
							<th>{m.field_status()}</th>
							<th class="numeric">{m.field_price()}</th>
							<th class="numeric">{m.settlement_participants()}</th>
							<th class="numeric">{m.settlement_paid()}</th>
							<th class="numeric">{m.settlement_expected()}</th>
							<th class="numeric">{m.settlement_collected()}</th>
						</tr>
					</thead>
					<tbody>
						{#each report.lines as line (line.excursion.id)}
							<tr class:excluded={!line.billable}>
								<td>{line.excursion.title}</td>
								<td>{formatDate(line.excursion.date, locale)}</td>
								<td>{excursionStatusLabels[line.excursion.status]()}</td>
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
							<th colspan="6">{m.settlement_total()}</th>
							<td class="numeric">{formatAmount(report.expectedTotal, locale)}</td>
							<td class="numeric">{formatAmount(report.collectedTotal, locale)}</td>
						</tr>
					</tfoot>
				</table>

				{#if report.excludedCount}
					<p class="report-note">{m.settlement_excluded({ count: report.excludedCount })}</p>
				{/if}
			{:else}
				<p class="report-note">{m.detail_no_excursions()}</p>
			{/if}
		</section>

		<section class="report-section">
			<h2>{m.payments_title()}</h2>

			{#if report.lines.length}
				{#each report.lines as line (line.excursion.id)}
					<div class="payment-block">
						<h3>
							{line.excursion.title}
							<span class="chip">{excursionStatusLabels[line.excursion.status]()}</span>
							{#if line.excursion.price > 0}
								<span class="chip">{formatAmount(line.excursion.price, locale)}</span>
							{/if}
						</h3>

						<p>
							<strong>{m.report_paid_by()}:</strong>
							{line.paidTourists.map((tourist) => tourist.fullName).join(', ') || '—'}
						</p>
						<p>
							<strong>{m.report_unpaid_by()}:</strong>
							{line.unpaidTourists.map((tourist) => tourist.fullName).join(', ') || '—'}
						</p>
					</div>
				{/each}
			{:else}
				<p class="report-note">{m.detail_no_excursions()}</p>
			{/if}
		</section>

		<section class="report-section">
			<h2>{m.report_contacts_title()}</h2>

			{#if report.tourists.length}
				<table>
					<thead>
						<tr>
							<th>{m.field_full_name()}</th>
							<th>{m.field_phone()}</th>
							<th>{m.field_email()}</th>
							<th>{m.field_document()}</th>
						</tr>
					</thead>
					<tbody>
						{#each report.tourists as tourist (tourist.id)}
							<tr>
								<td>{tourist.fullName}</td>
								<td>{tourist.phone || '—'}</td>
								<td>{tourist.email || '—'}</td>
								<td>{tourist.documentNumber || '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p class="report-note">{m.detail_no_tourists()}</p>
			{/if}
		</section>

		<section class="report-section receipts-section">
			<h2>{m.report_receipts_title()} <span class="chip">{report.receiptCount}</span></h2>

			{#if report.receiptGroups.length}
				{#each report.receiptGroups as group (group.excursion.id)}
					<div class="receipt-group">
						<h3>{group.excursion.title} · {formatDate(group.excursion.date, locale)}</h3>

						<div class="receipt-grid">
							{#each group.receipts as receipt (receipt.id)}
								<figure>
									{#if previews[receipt.id]}
										<img src={previews[receipt.id]} alt={receipt.name} />
									{:else}
										<span class="receipt-placeholder" aria-hidden="true">🧾</span>
									{/if}
									<figcaption>{formatDateTime(receipt.createdAt, locale)}</figcaption>
								</figure>
							{/each}
						</div>
					</div>
				{/each}
			{:else}
				<p class="report-note">{m.report_no_receipts()}</p>
			{/if}
		</section>
	</section>
{:else}
	<section>
		<EmptyState
			icon="🧭"
			title={m.not_found_title()}
			text={m.not_found_text()}
			actionLabel={m.action_back_to_list()}
			onAction={() => goto(entityRoute.tour.list)}
		/>
	</section>
{/if}

<style>
	.report {
		width: min(100%, 62rem);
		margin: 0 auto;
		padding: 2rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: white;
	}

	.report-actions {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.report-header {
		padding-bottom: 1.25rem;
		border-bottom: 2px solid var(--text);
	}

	.report-eyebrow {
		margin: 0 0 0.4rem;
		color: var(--text-muted);
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.13em;
		text-transform: uppercase;
	}

	.report-header h1 {
		margin: 0;
		font-size: 1.9rem;
		line-height: 1.15;
		letter-spacing: -0.03em;
	}

	.report-subline {
		margin: 0.5rem 0 0;
		font-size: 0.9rem;
	}

	.report-generated {
		margin: 0.35rem 0 0;
		color: var(--text-muted);
		font-size: 0.76rem;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: 0.75rem;
		margin: 1.5rem 0;
	}

	.summary-grid div {
		display: grid;
		gap: 0.2rem;
		padding: 0.85rem;
		border: 1px solid var(--border);
		border-radius: 0.7rem;
	}

	.summary-grid span {
		color: var(--text-muted);
		font-size: 0.66rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.summary-grid strong {
		font-size: 1.2rem;
		letter-spacing: -0.02em;
	}

	.summary-grid .outstanding strong {
		color: var(--danger);
	}

	.report-section {
		margin-top: 2rem;
	}

	.report-section h2 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border);
		font-size: 1.05rem;
	}

	.report-section h3 {
		margin: 0 0 0.5rem;
		font-size: 0.9rem;
	}

	.report-note {
		margin: 0.5rem 0 0;
		color: var(--text-muted);
		font-size: 0.76rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8rem;
	}

	th,
	td {
		padding: 0.5rem 0.4rem;
		border-bottom: 1px solid var(--border);
		text-align: left;
	}

	thead th {
		color: var(--text-muted);
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.numeric {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.excluded {
		color: var(--text-muted);
	}

	.excluded .numeric {
		text-decoration: line-through;
	}

	tfoot th,
	tfoot td {
		font-size: 0.85rem;
		font-weight: 800;
	}

	.payment-block {
		margin-bottom: 1rem;
		padding: 0.85rem;
		border: 1px solid var(--border);
		border-radius: 0.7rem;
	}

	.payment-block h3 {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
	}

	.payment-block p {
		margin: 0.25rem 0 0;
		font-size: 0.8rem;
		line-height: 1.5;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		background: var(--surface-muted);
		color: var(--text-muted);
		font-size: 0.66rem;
		font-weight: 750;
	}

	.receipt-group {
		margin-bottom: 1.25rem;
	}

	.receipt-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: 0.75rem;
	}

	figure {
		margin: 0;
		padding: 0.4rem;
		border: 1px solid var(--border);
		border-radius: 0.6rem;
	}

	figure img {
		display: block;
		width: 100%;
		max-height: 15rem;
		/* contain, not cover: a cropped receipt is useless as evidence. */
		object-fit: contain;
	}

	.receipt-placeholder {
		display: grid;
		height: 8rem;
		place-items: center;
		background: var(--surface-muted);
		font-size: 1.6rem;
	}

	figcaption {
		margin-top: 0.3rem;
		color: var(--text-muted);
		font-size: 0.62rem;
		text-align: center;
	}

	@media print {
		.report {
			width: 100%;
			padding: 0;
			border: 0;
			border-radius: 0;
		}

		.report-actions {
			display: none;
		}

		.report-section {
			margin-top: 1.1rem;
		}

		.report-section h2 {
			margin-bottom: 0.5rem;
			padding-bottom: 0.35rem;
		}

		.summary-grid {
			margin: 1rem 0;
		}

		.payment-block {
			margin-bottom: 0.6rem;
			padding: 0.6rem 0.7rem;
		}

		.receipt-group {
			margin-bottom: 0.8rem;
		}

		/* Keep rows, blocks and photos from being split across pages. */
		tr,
		figure,
		.payment-block {
			break-inside: avoid;
		}

		/* A heading must never be left stranded at the foot of a page. */
		h2,
		h3 {
			break-after: avoid;
		}

		thead {
			display: table-header-group;
		}

		.receipt-grid {
			grid-template-columns: repeat(3, 1fr);
		}

		figure img {
			max-height: 11rem;
		}
	}
</style>
