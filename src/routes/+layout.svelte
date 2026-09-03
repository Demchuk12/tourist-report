<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { setSessionStore } from '$lib/features/auth/model/context';
	import { SessionStore } from '$lib/features/auth/model/session-store.svelte';
	import { TokenStore } from '$lib/features/auth/model/token-store.svelte';
	import AuthScreen from '$lib/features/auth/ui/AuthScreen.svelte';
	import type { SearchResult } from '$lib/features/global-search/model/search';
	import GlobalSearch from '$lib/features/global-search/ui/GlobalSearch.svelte';
	import { setNotificationStore } from '$lib/features/notifications/model/context';
	import { NotificationStore } from '$lib/features/notifications/model/notification-store.svelte';
	import NotificationCenter from '$lib/features/notifications/ui/NotificationCenter.svelte';
	import PwaInstallPrompt from '$lib/features/pwa-install/ui/PwaInstallPrompt.svelte';
	import { setTourReportStore } from '$lib/features/tour-report/model/context';
	import { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { AuthApi } from '$lib/shared/api/auth-api';
	import { HttpClient } from '$lib/shared/api/http-client';
	import { TourReportApi } from '$lib/shared/api/tour-report-api';
	import { API_BASE_URL } from '$lib/shared/config/api';
	import { entityRoute } from '$lib/shared/model/navigation';
	import AppSidebar from '$lib/widgets/app-sidebar/AppSidebar.svelte';
	import '../app.css';

	let { children } = $props();

	// The object graph is built per layout instance rather than at module scope,
	// so nothing leaks between SSR requests. `onUnauthorized` closes over
	// `session` and only ever runs after it is assigned.
	const notifications = new NotificationStore();
	const tokens = new TokenStore();
	const http = new HttpClient({
		baseUrl: API_BASE_URL,
		getToken: () => tokens.value,
		onUnauthorized: () => session.expire()
	});
	const session = new SessionStore(new AuthApi(http), tokens, notifications);
	const store = new TourReportStore(new TourReportApi(http), notifications);

	setNotificationStore(notifications);
	setSessionStore(session);
	setTourReportStore(store);

	let searchOpen = $state(false);
	/** Whose document is currently loaded — null while signed out. */
	let loadedFor: string | null = null;

	onMount(() => {
		void session.init();
	});

	onDestroy(() => notifications.clear());

	// One load per account: signing in fetches the document, signing out drops it.
	$effect(() => {
		const userId = session.user?.id ?? null;

		untrack(() => {
			if (userId === loadedFor) return;

			loadedFor = userId;
			searchOpen = false;
			store.reset();
			if (userId) void store.init();
		});
	});

	function openResult(result: SearchResult): void {
		searchOpen = false;
		void goto(entityRoute[result.kind].detail(result.id));
	}

	function handleShortcut(event: KeyboardEvent): void {
		if (!session.signedIn || !store.ready) return;

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

{#if !session.ready}
	<div class="loading-screen">
		<div><span></span>{m.loading()}</div>
	</div>
{:else if !session.signedIn}
	<!-- The URL is left untouched, so a deep link resumes once the user signs in. -->
	<AuthScreen {session} />
{:else if store.ready}
	<div class="app-shell">
		<AppSidebar
			pathname={page.url.pathname}
			user={session.user}
			onOpenSearch={() => (searchOpen = true)}
			onSignOut={() => session.logout()}
		/>

		<main class="app-content">
			{@render children()}
		</main>
	</div>

	{#if searchOpen}
		<GlobalSearch {store} onSelect={openResult} onClose={() => (searchOpen = false)} />
	{/if}
{:else if store.loadError}
	<div class="loading-screen">
		<div class="load-error" role="alert">
			<strong>{m.error_load_failed()}</strong>
			<p>{store.loadError}</p>
			<div class="load-error-actions">
				<button
					class="button primary"
					type="button"
					disabled={store.loading}
					onclick={() => store.init()}
				>
					{store.loading ? m.loading() : m.action_retry()}
				</button>
				<button class="button ghost" type="button" onclick={() => session.logout()}>
					{m.auth_sign_out()}
				</button>
			</div>
		</div>
	</div>
{:else}
	<div class="loading-screen">
		<div><span></span>{m.loading()}</div>
	</div>
{/if}

<NotificationCenter store={notifications} />
<PwaInstallPrompt />

<style>
	.load-error {
		width: min(100%, 26rem);
		padding: 1.5rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: white;
		box-shadow: var(--shadow);
		text-align: center;
	}

	.load-error strong {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--text);
		font-size: 0.95rem;
	}

	.load-error p {
		margin: 0 0 1.25rem;
		color: var(--text-muted);
		font-size: 0.82rem;
		line-height: 1.5;
	}

	.load-error-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
	}
</style>
