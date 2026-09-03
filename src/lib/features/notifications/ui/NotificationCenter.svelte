<script lang="ts">
	import type { NotificationStore } from '$lib/features/notifications/model/notification-store.svelte';
	import * as m from '$lib/paraglide/messages';

	let { store }: { store: NotificationStore } = $props();

	const icons = { success: '✓', error: '!', info: 'i' } as const;
</script>

<!-- aria-live so a screen reader hears the result of an action it cannot see. -->
<div class="toast-layer" role="region" aria-live="polite" aria-label={m.notifications_title()}>
	{#each store.items as item (item.id)}
		<article class="toast {item.tone}" role={item.tone === 'error' ? 'alert' : 'status'}>
			<span class="toast-icon" aria-hidden="true">{icons[item.tone]}</span>
			<div class="toast-body">
				<strong>{item.title}</strong>
				{#if item.text}<small>{item.text}</small>{/if}
			</div>
			<button
				class="toast-close"
				type="button"
				aria-label={m.notification_dismiss()}
				onclick={() => store.dismiss(item.id)}>×</button
			>
		</article>
	{/each}
</div>

<style>
	.toast-layer {
		position: fixed;
		z-index: 80;
		right: calc(1rem + env(safe-area-inset-right));
		bottom: calc(1rem + env(safe-area-inset-bottom));
		display: grid;
		width: min(24rem, calc(100vw - 2rem));
		gap: 0.5rem;
		justify-items: stretch;
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: flex-start;
		gap: 0.65rem;
		padding: 0.7rem 0.75rem;
		border: 1px solid var(--border);
		border-left-width: 4px;
		border-radius: 0.8rem;
		background: white;
		box-shadow: var(--shadow);
		pointer-events: auto;
		animation: toast-in 180ms ease-out;
	}

	.toast.success {
		border-left-color: var(--success);
	}

	.toast.error {
		border-left-color: var(--danger);
	}

	.toast.info {
		border-left-color: var(--brand);
	}

	.toast-icon {
		display: grid;
		width: 1.4rem;
		height: 1.4rem;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 50%;
		font-size: 0.72rem;
		font-weight: 800;
	}

	.success .toast-icon {
		background: #d1fae5;
		color: #047857;
	}

	.error .toast-icon {
		background: #ffe4e6;
		color: var(--danger);
	}

	.info .toast-icon {
		background: var(--brand-soft);
		color: var(--brand-dark);
	}

	.toast-body {
		display: grid;
		min-width: 0;
		gap: 0.15rem;
		flex: 1;
	}

	.toast-body strong {
		font-size: 0.82rem;
		font-weight: 750;
		line-height: 1.35;
	}

	.toast-body small {
		color: var(--text-muted);
		font-size: 0.74rem;
		line-height: 1.45;
		overflow-wrap: anywhere;
	}

	.toast-close {
		flex: 0 0 auto;
		padding: 0 0.2rem;
		border: 0;
		background: none;
		color: var(--text-muted);
		font-size: 1.1rem;
		line-height: 1;
		cursor: pointer;
	}

	.toast-close:hover {
		color: var(--text);
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(0.4rem);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.toast {
			animation: none;
		}
	}

	/* On a phone the toasts clear the floating bottom navigation. */
	@media (max-width: 760px) {
		.toast-layer {
			right: 0.75rem;
			bottom: calc(5.5rem + env(safe-area-inset-bottom));
			left: 0.75rem;
			width: auto;
		}
	}

	/*
	 * A fixed element still prints, and the report page is saved as a PDF from
	 * the browser's print dialog — a toast must never land in that document.
	 */
	@media print {
		.toast-layer {
			display: none;
		}
	}
</style>
