<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { SearchResult } from '$lib/features/global-search/model/search';
	import GlobalSearch from '$lib/features/global-search/ui/GlobalSearch.svelte';
	import PwaInstallPrompt from '$lib/features/pwa-install/ui/PwaInstallPrompt.svelte';
	import { setTourReportStore } from '$lib/features/tour-report/model/context';
	import { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { IndexedDbTourReportRepository } from '$lib/shared/api/indexed-db-repository';
	import { entityRoute } from '$lib/shared/model/navigation';
	import AppSidebar from '$lib/widgets/app-sidebar/AppSidebar.svelte';
	import '../app.css';

	let { children } = $props();

	const store = new TourReportStore(new IndexedDbTourReportRepository());
	setTourReportStore(store);

	let searchOpen = $state(false);

	onMount(() => {
		void store.init();
	});

	function openResult(result: SearchResult): void {
		searchOpen = false;
		void goto(entityRoute[result.kind].detail(result.id));
	}

	function handleShortcut(event: KeyboardEvent): void {
		// event.code stays 'KeyK' on non-latin keyboard layouts.
		if ((event.metaKey || event.ctrlKey) && event.code === 'KeyK') {
			event.preventDefault();
			searchOpen = true;
		}
	}
</script>

<svelte:head>
	<title>{m.meta_title()}</title>
	<meta name="description" content={m.meta_description()} />
	<link rel="icon" href="/icons/icon.svg" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
	<meta name="theme-color" content="#10233f" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content="Tourist Report" />
</svelte:head>

<svelte:window onkeydown={handleShortcut} />

{#if store.ready}
	<div class="app-shell">
		<AppSidebar pathname={page.url.pathname} onOpenSearch={() => (searchOpen = true)} />

		<main class="app-content">
			{@render children()}
		</main>
	</div>

	{#if searchOpen}
		<GlobalSearch {store} onSelect={openResult} onClose={() => (searchOpen = false)} />
	{/if}
{:else}
	<div class="loading-screen">
		<div><span></span>{m.loading()}</div>
	</div>
{/if}

<PwaInstallPrompt />
