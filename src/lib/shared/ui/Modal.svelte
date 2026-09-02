<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		onClose,
		children,
		wide = false
	}: { title: string; onClose: () => void; children: Snippet; wide?: boolean } = $props();

	// Without this the page behind the sheet keeps scrolling under the finger on iOS.
	$effect(() => {
		document.body.classList.add('is-locked');
		return () => document.body.classList.remove('is-locked');
	});
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && onClose()} />

<div class="modal-layer">
	<button class="backdrop" type="button" aria-label={title} onclick={onClose}></button>
	<dialog open class:wide class="modal" aria-labelledby="modal-title">
		<header>
			<h2 id="modal-title">{title}</h2>
			<button class="close" type="button" aria-label={title} onclick={onClose}>×</button>
		</header>
		{@render children()}
	</dialog>
</div>

<style>
	.modal-layer {
		position: fixed;
		z-index: 50;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 1rem;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
		background: rgba(15, 23, 42, 0.58);
		backdrop-filter: blur(5px);
		cursor: default;
	}

	.modal {
		position: relative;
		width: min(100%, 36rem);
		max-height: min(90vh, 52rem);
		max-height: min(90dvh, 52rem);
		margin: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		-webkit-overflow-scrolling: touch;
		padding: 0;
		border: 0;
		border-radius: 1.25rem;
		background: white;
		box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
	}

	.modal.wide {
		width: min(100%, 52rem);
	}

	header {
		position: sticky;
		z-index: 2;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border);
		background: rgba(255, 255, 255, 0.94);
		backdrop-filter: blur(12px);
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
		letter-spacing: -0.02em;
	}

	.close {
		display: grid;
		width: 2.25rem;
		height: 2.25rem;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: var(--surface-muted);
		color: var(--text-muted);
		font: inherit;
		font-size: 1.5rem;
		cursor: pointer;
	}

	@media (max-width: 640px) {
		.modal-layer {
			align-items: end;
			padding: 0;
		}

		.modal,
		.modal.wide {
			width: 100%;
			max-height: 94vh;
			max-height: 94dvh;
			border-radius: 1.25rem 1.25rem 0 0;
			padding-bottom: env(safe-area-inset-bottom);
		}

		header {
			padding: 1rem 1.15rem;
		}

		/* Grab handle so the sheet reads as draggable-style mobile UI. */
		header::before {
			position: absolute;
			top: 0.4rem;
			left: 50%;
			width: 2.5rem;
			height: 0.25rem;
			border-radius: 999px;
			background: var(--border-strong);
			content: '';
			transform: translateX(-50%);
		}
	}
</style>
