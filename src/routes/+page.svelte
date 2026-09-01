<script lang="ts">
	import { onMount } from 'svelte';
	import { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { IndexedDbTourReportRepository } from '$lib/shared/api/indexed-db-repository';
	import type { AppSection } from '$lib/shared/model/navigation';
	import AppSidebar from '$lib/widgets/app-sidebar/AppSidebar.svelte';
	import Calendar from '$lib/widgets/calendar/Calendar.svelte';
	import Dashboard from '$lib/widgets/dashboard/Dashboard.svelte';
	import ExcursionsManager from '$lib/widgets/excursions-manager/ExcursionsManager.svelte';
	import TouristsManager from '$lib/widgets/tourists-manager/TouristsManager.svelte';
	import ToursManager from '$lib/widgets/tours-manager/ToursManager.svelte';

	const store = new TourReportStore(new IndexedDbTourReportRepository());
	let activeSection = $state<AppSection>('overview');

	onMount(() => {
		void store.init();
	});
</script>

<svelte:head>
	<title>{m.meta_title()}</title>
	<meta name="description" content={m.meta_description()} />
</svelte:head>

{#if store.ready}
	<div class="app-shell">
		<AppSidebar active={activeSection} onNavigate={(section) => (activeSection = section)} />

		<main class="app-content">
			{#if activeSection === 'overview'}
				<Dashboard {store} onNavigate={(section) => (activeSection = section)} />
			{:else if activeSection === 'calendar'}
				<Calendar {store} />
			{:else if activeSection === 'tours'}
				<ToursManager {store} />
			{:else if activeSection === 'tourists'}
				<TouristsManager {store} />
			{:else}
				<ExcursionsManager {store} />
			{/if}
		</main>
	</div>
{:else}
	<div class="loading-screen">
		<div><span></span>{m.loading()}</div>
	</div>
{/if}
