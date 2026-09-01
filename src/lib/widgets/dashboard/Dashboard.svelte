<script lang="ts">
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatDateRange } from '$lib/shared/lib/date';
	import type { AppSection } from '$lib/shared/model/navigation';

	let { store, onNavigate }: { store: TourReportStore; onNavigate: (section: AppSection) => void } =
		$props();

	const activeTours = $derived(store.data.tours.filter((tour) => tour.status === 'active').length);
	const upcomingTours = $derived(
		[...store.data.tours]
			.filter((tour) => tour.status !== 'completed')
			.sort((a, b) => a.startDate.localeCompare(b.startDate))
			.slice(0, 4)
	);
</script>

<section>
	<div class="section-heading dashboard-heading">
		<div>
			<p class="section-eyebrow">{m.nav_overview()}</p>
			<h1>{m.dashboard_title()}</h1>
			<p>{m.dashboard_subtitle()}</p>
		</div>
		<div class="storage-badge"><span></span>{m.saved_locally()}</div>
	</div>

	<div class="stats-grid">
		<button type="button" onclick={() => onNavigate('tours')}>
			<span class="stat-icon blue">🧭</span>
			<span class="stat-value">{store.data.tours.length}</span>
			<span class="stat-label">{m.metric_all_tours()}</span>
		</button>
		<button type="button" onclick={() => onNavigate('tours')}>
			<span class="stat-icon green">↗</span>
			<span class="stat-value">{activeTours}</span>
			<span class="stat-label">{m.metric_active_tours()}</span>
		</button>
		<button type="button" onclick={() => onNavigate('tourists')}>
			<span class="stat-icon violet">👤</span>
			<span class="stat-value">{store.data.tourists.length}</span>
			<span class="stat-label">{m.metric_all_tourists()}</span>
		</button>
		<button type="button" onclick={() => onNavigate('excursions')}>
			<span class="stat-icon amber">🏛</span>
			<span class="stat-value">{store.data.excursions.length}</span>
			<span class="stat-label">{m.metric_all_excursions()}</span>
		</button>
	</div>

	<div class="dashboard-grid">
		<div class="panel upcoming-panel">
			<div class="panel-heading">
				<div>
					<h2>{m.upcoming_tours_title()}</h2>
					<p>{m.upcoming_tours_subtitle()}</p>
				</div>
				<button class="text-button" type="button" onclick={() => onNavigate('tours')}
					>{m.action_view_all()} →</button
				>
			</div>

			{#if upcomingTours.length}
				<div class="upcoming-list">
					{#each upcomingTours as tour (tour.id)}
						<button type="button" onclick={() => onNavigate('tours')}>
							<span class="tour-mark">{tour.destination.slice(0, 1).toUpperCase()}</span>
							<span class="tour-summary">
								<strong>{tour.name}</strong>
								<small
									>{tour.destination} · {formatDateRange(
										tour.startDate,
										tour.endDate,
										getLocale()
									)}</small
								>
							</span>
							<span class="tour-count">{tour.touristIds.length} 👤</span>
						</button>
					{/each}
				</div>
			{:else}
				<div class="panel-empty">
					<span>🗓</span>
					<p>{m.no_upcoming_tours()}</p>
					<button class="button secondary" type="button" onclick={() => onNavigate('tours')}
						>{m.action_create_first_tour()}</button
					>
				</div>
			{/if}
		</div>

		<aside class="panel workflow-panel">
			<p class="section-eyebrow">{m.reporting_help_eyebrow()}</p>
			<h2>{m.reporting_help_title()}</h2>
			<p>{m.reporting_help_text()}</p>
			<ol>
				<li><span>1</span>{m.workflow_step_tourists()}</li>
				<li><span>2</span>{m.workflow_step_excursions()}</li>
				<li><span>3</span>{m.workflow_step_tour()}</li>
			</ol>
		</aside>
	</div>
</section>

<style>
	.storage-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.65rem 0.85rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: white;
		color: var(--text-muted);
		font-size: 0.78rem;
		font-weight: 700;
	}

	.storage-badge span {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--success);
		box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.stats-grid button {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.15rem 0.9rem;
		align-items: center;
		padding: 1.2rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: white;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			transform 150ms ease,
			box-shadow 150ms ease;
	}

	.stats-grid button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow);
	}

	.stat-icon {
		grid-row: 1 / 3;
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		border-radius: 0.85rem;
	}

	.stat-icon.blue {
		background: #e0f2fe;
	}

	.stat-icon.green {
		background: #d1fae5;
		color: #047857;
	}

	.stat-icon.violet {
		background: #ede9fe;
	}

	.stat-icon.amber {
		background: #fef3c7;
	}

	.stat-value {
		font-size: 1.55rem;
		font-weight: 800;
		letter-spacing: -0.04em;
	}

	.stat-label {
		color: var(--text-muted);
		font-size: 0.78rem;
		font-weight: 650;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.5fr) minmax(18rem, 0.7fr);
		gap: 1rem;
	}

	.panel {
		padding: 1.35rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: white;
	}

	.panel-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.panel-heading h2,
	.workflow-panel h2 {
		margin: 0;
		font-size: 1.05rem;
		letter-spacing: -0.02em;
	}

	.panel-heading p,
	.workflow-panel > p:not(.section-eyebrow) {
		margin: 0.3rem 0 0;
		color: var(--text-muted);
		font-size: 0.84rem;
		line-height: 1.55;
	}

	.text-button {
		border: 0;
		background: transparent;
		color: var(--brand);
		font: inherit;
		font-size: 0.78rem;
		font-weight: 750;
		white-space: nowrap;
		cursor: pointer;
	}

	.upcoming-list {
		display: grid;
	}

	.upcoming-list > button {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.9rem 0;
		border: 0;
		border-top: 1px solid var(--border);
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.tour-mark {
		display: grid;
		width: 2.5rem;
		height: 2.5rem;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 0.75rem;
		background: var(--brand-soft);
		color: var(--brand-dark);
		font-weight: 800;
	}

	.tour-summary {
		display: grid;
		gap: 0.25rem;
		min-width: 0;
		flex: 1;
	}

	.tour-summary strong,
	.tour-summary small {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tour-summary small,
	.tour-count {
		color: var(--text-muted);
		font-size: 0.75rem;
	}

	.panel-empty {
		display: grid;
		min-height: 15rem;
		place-items: center;
		align-content: center;
		text-align: center;
	}

	.panel-empty > span {
		font-size: 2rem;
	}

	.panel-empty p {
		margin: 0.75rem 0 1rem;
		color: var(--text-muted);
	}

	.workflow-panel {
		background: #10233f;
		color: white;
	}

	.workflow-panel .section-eyebrow {
		color: #7dd3fc;
	}

	.workflow-panel > p:not(.section-eyebrow) {
		color: #a9bad0;
	}

	.workflow-panel ol {
		display: grid;
		gap: 0.85rem;
		margin: 1.5rem 0 0;
		padding: 0;
		list-style: none;
	}

	.workflow-panel li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: #dbeafe;
		font-size: 0.82rem;
	}

	.workflow-panel li span {
		display: grid;
		width: 1.65rem;
		height: 1.65rem;
		flex: 0 0 auto;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 50%;
		color: #7dd3fc;
		font-weight: 800;
	}

	@media (max-width: 1000px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.dashboard-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 560px) {
		.stats-grid {
			gap: 0.65rem;
		}

		.stats-grid button {
			grid-template-columns: 1fr;
			padding: 1rem;
		}

		.stat-icon {
			grid-row: auto;
			margin-bottom: 0.5rem;
		}

		.stat-value {
			font-size: 1.35rem;
		}

		.tour-count {
			display: none;
		}
	}
</style>
