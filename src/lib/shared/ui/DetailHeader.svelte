<script lang="ts">
	import * as m from '$lib/paraglide/messages';

	let {
		backHref,
		eyebrow,
		title,
		action,
		onEdit,
		onDelete,
		busy = false
	}: {
		backHref: string;
		eyebrow: string;
		title: string;
		/** Optional primary link action, e.g. the printable report. */
		action?: { href: string; label: string };
		onEdit?: () => void;
		onDelete?: () => void;
		/** A request touching this entity is in flight — its actions are locked meanwhile. */
		busy?: boolean;
	} = $props();
</script>

<div class="detail-header">
	<a class="back-link" href={backHref}>‹ {m.action_back()}</a>

	<div class="detail-title">
		<div>
			<p class="section-eyebrow">{eyebrow}</p>
			<h1>{title}</h1>
		</div>

		{#if action || onEdit || onDelete}
			<div class="detail-actions">
				{#if action}
					<a class="button secondary" href={action.href}>{action.label}</a>
				{/if}
				{#if onEdit}
					<button class="button ghost" type="button" disabled={busy} onclick={onEdit}
						>✎ {m.action_edit()}</button
					>
				{/if}
				{#if onDelete}
					<button class="button ghost danger" type="button" disabled={busy} onclick={onDelete}>
						{#if busy}
							<span class="button-spinner" aria-hidden="true"></span>
							{m.action_saving()}
						{:else}
							× {m.action_delete()}
						{/if}
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.detail-header {
		margin-bottom: 1.5rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		min-height: 2.25rem;
		color: var(--text-muted);
		font-size: 0.8rem;
		font-weight: 700;
		text-decoration: none;
	}

	.back-link:hover {
		color: var(--brand-dark);
	}

	.detail-title {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5rem;
		margin-top: 0.35rem;
	}

	.detail-title h1 {
		margin: 0;
		font-size: clamp(1.6rem, 3vw, 2.3rem);
		line-height: 1.1;
		letter-spacing: -0.04em;
	}

	.detail-actions {
		display: flex;
		flex: 0 0 auto;
		gap: 0.5rem;
	}

	.button.danger:hover {
		border-color: #fecdd3;
		background: #fff1f2;
		color: var(--danger);
	}

	@media (max-width: 560px) {
		.detail-title {
			align-items: stretch;
			flex-direction: column;
			gap: 1rem;
		}

		.detail-actions button {
			flex: 1;
		}
	}
</style>
