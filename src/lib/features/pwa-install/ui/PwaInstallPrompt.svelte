<script lang="ts">
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';

	type InstallPromptEvent = Event & {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	};

	let installPrompt = $state<InstallPromptEvent | null>(null);
	let registration = $state<ServiceWorkerRegistration | null>(null);
	let updateAvailable = $state(false);
	let showIosHint = $state(false);

	onMount(() => {
		const standalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
		showIosHint = /iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone;

		const onInstallPrompt = (event: Event) => {
			event.preventDefault();
			installPrompt = event as InstallPromptEvent;
		};
		const onInstalled = () => {
			installPrompt = null;
			showIosHint = false;
		};
		const onControllerChange = () => window.location.reload();

		window.addEventListener('beforeinstallprompt', onInstallPrompt);
		window.addEventListener('appinstalled', onInstalled);
		navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange);

		if ('serviceWorker' in navigator) {
			void navigator.serviceWorker.getRegistration().then((value) => {
				if (!value) return;
				registration = value;
				updateAvailable = Boolean(value.waiting);
				value.addEventListener('updatefound', () => {
					value.installing?.addEventListener('statechange', () => {
						if (value.waiting && navigator.serviceWorker.controller) updateAvailable = true;
					});
				});
				void value.update();
			});
		}

		return () => {
			window.removeEventListener('beforeinstallprompt', onInstallPrompt);
			window.removeEventListener('appinstalled', onInstalled);
			navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
		};
	});

	async function install(): Promise<void> {
		if (!installPrompt) return;
		await installPrompt.prompt();
		await installPrompt.userChoice;
		installPrompt = null;
	}

	function update(): void {
		registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
	}
</script>

{#if installPrompt || showIosHint || updateAvailable}
	<aside class="pwa-prompt" aria-live="polite">
		<button
			class="close"
			type="button"
			aria-label={m.pwa_dismiss()}
			onclick={() => {
				installPrompt = null;
				showIosHint = false;
				updateAvailable = false;
			}}>×</button
		>

		<span class="app-icon" aria-hidden="true">TR</span>
		<div>
			<strong>{updateAvailable ? m.pwa_update_title() : m.pwa_install_title()}</strong>
			<p>
				{updateAvailable
					? m.pwa_update_text()
					: showIosHint
						? m.pwa_ios_hint()
						: m.pwa_install_text()}
			</p>
			{#if updateAvailable}
				<button class="action" type="button" onclick={update}>{m.pwa_update_action()}</button>
			{:else if installPrompt}
				<button class="action" type="button" onclick={install}>{m.pwa_install_action()}</button>
			{/if}
		</div>
	</aside>
{/if}

<style>
	.pwa-prompt {
		position: fixed;
		z-index: 60;
		right: 1rem;
		bottom: 1rem;
		display: grid;
		width: min(24rem, calc(100vw - 2rem));
		grid-template-columns: auto 1fr;
		gap: 0.85rem;
		padding: 1rem 2.5rem 1rem 1rem;
		border: 1px solid var(--border);
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.97);
		box-shadow: 0 18px 50px rgba(15, 23, 42, 0.2);
		backdrop-filter: blur(18px);
	}

	.app-icon {
		display: grid;
		width: 2.8rem;
		height: 2.8rem;
		place-items: center;
		border-radius: 0.85rem;
		background: #10233f;
		color: white;
		font-weight: 900;
		letter-spacing: -0.06em;
	}

	strong {
		display: block;
		padding-right: 0.4rem;
		font-size: 0.9rem;
	}

	p {
		margin: 0.3rem 0 0;
		color: var(--text-muted);
		font-size: 0.75rem;
		line-height: 1.45;
	}

	.close {
		position: absolute;
		top: 0.55rem;
		right: 0.6rem;
		border: 0;
		background: transparent;
		color: var(--text-muted);
		font-size: 1.15rem;
		cursor: pointer;
	}

	.action {
		margin-top: 0.7rem;
		padding: 0.5rem 0.75rem;
		border: 0;
		border-radius: 0.6rem;
		background: #10233f;
		color: white;
		font-size: 0.75rem;
		font-weight: 750;
		cursor: pointer;
	}

	@media (max-width: 760px) {
		.pwa-prompt {
			right: 0.7rem;
			bottom: 5.9rem;
			width: calc(100vw - 1.4rem);
		}
	}
</style>
