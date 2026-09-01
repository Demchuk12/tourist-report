<script lang="ts">
	let {
		icon,
		title,
		text,
		actionLabel,
		onAction
	}: { icon: string; title: string; text: string; actionLabel: string; onAction: () => void } =
		$props();
</script>

<div class="empty-state">
	<span class="icon" aria-hidden="true">{icon}</span>
	<h3>{title}</h3>
	<p>{text}</p>
	<button class="button primary" type="button" onclick={onAction}>{actionLabel}</button>
</div>

<style>
	.empty-state {
		display: grid;
		min-height: 22rem;
		place-items: center;
		align-content: center;
		padding: 3rem 1.5rem;
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		background: rgba(255, 255, 255, 0.56);
		text-align: center;
	}

	.icon {
		display: grid;
		width: 4rem;
		height: 4rem;
		place-items: center;
		margin-bottom: 1.25rem;
		border-radius: 1.2rem;
		background: var(--brand-soft);
		font-size: 1.6rem;
	}

	h3 {
		margin: 0;
		font-size: 1.25rem;
	}

	p {
		max-width: 28rem;
		margin: 0.6rem 0 1.35rem;
		color: var(--text-muted);
		line-height: 1.6;
	}
</style>
