<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import type { Excursion } from '$lib/entities/excursion/model/types';
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatDateTime } from '$lib/shared/lib/date';
	import { formatBytes, isImageFile, MAX_SOURCE_BYTES } from '$lib/shared/lib/image';
	import Modal from '$lib/shared/ui/Modal.svelte';

	let {
		store,
		excursion
	}: {
		store: TourReportStore;
		excursion: Excursion;
	} = $props();

	const locale = getLocale();

	let fileInput = $state<HTMLInputElement | null>(null);
	let busy = $state(false);
	let error = $state('');
	let opened = $state<string | null>(null);

	// Object URLs per receipt id; created lazily, revoked when the receipt goes away.
	const previews = $state<Record<string, string>>({});

	$effect(() => {
		const receipts = excursion.receipts;
		let cancelled = false;

		untrack(() => {
			for (const receipt of receipts) {
				if (previews[receipt.id]) continue;

				void store.readAttachment(receipt.id).then((blob) => {
					if (cancelled || !blob) return;
					previews[receipt.id] = URL.createObjectURL(blob);
				});
			}

			for (const id of Object.keys(previews)) {
				if (receipts.some((receipt) => receipt.id === id)) continue;
				URL.revokeObjectURL(previews[id]);
				delete previews[id];
			}
		});

		return () => {
			cancelled = true;
		};
	});

	onDestroy(() => {
		for (const url of Object.values(previews)) URL.revokeObjectURL(url);
	});

	const openedReceipt = $derived(
		excursion.receipts.find((receipt) => receipt.id === opened) ?? null
	);

	async function handleFiles(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const files = [...(input.files ?? [])];
		input.value = '';
		if (!files.length) return;

		error = '';
		busy = true;

		try {
			for (const file of files) {
				if (!isImageFile(file)) {
					error = m.receipts_error_type();
					continue;
				}
				if (file.size > MAX_SOURCE_BYTES) {
					error = m.receipts_error_size({ size: formatBytes(MAX_SOURCE_BYTES) });
					continue;
				}

				await store.addExcursionReceipt(excursion.id, file);
			}
		} catch {
			error = m.receipts_error_save();
		} finally {
			busy = false;
		}
	}

	async function remove(id: string): Promise<void> {
		if (!confirm(m.receipts_delete_confirm())) return;
		await store.deleteExcursionReceipt(excursion.id, id);
	}
</script>

<div class="receipts">
	<div class="receipts-toolbar">
		<p class="receipts-hint">{m.receipts_hint()}</p>
		<button
			class="button secondary"
			type="button"
			disabled={busy}
			onclick={() => fileInput?.click()}
		>
			{busy ? m.receipts_uploading() : `＋ ${m.action_add_receipt()}`}
		</button>
	</div>

	<input
		bind:this={fileInput}
		class="file-input"
		type="file"
		accept="image/*"
		multiple
		aria-label={m.action_add_receipt()}
		onchange={handleFiles}
	/>

	{#if error}
		<p class="receipts-error" role="alert">{error}</p>
	{/if}

	{#if excursion.receipts.length}
		<ul class="receipt-grid">
			{#each excursion.receipts as receipt (receipt.id)}
				<li class="receipt">
					<button
						class="receipt-preview"
						type="button"
						aria-label={m.receipt_open()}
						onclick={() => (opened = receipt.id)}
					>
						{#if previews[receipt.id]}
							<img src={previews[receipt.id]} alt={receipt.name} loading="lazy" />
						{:else}
							<span class="receipt-placeholder" aria-hidden="true">🧾</span>
						{/if}
					</button>

					<div class="receipt-meta">
						<small>{formatDateTime(receipt.createdAt, locale)}</small>
						<small>{formatBytes(receipt.size)}</small>
					</div>

					<button
						class="receipt-delete"
						type="button"
						aria-label={m.action_delete()}
						onclick={() => remove(receipt.id)}>×</button
					>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="receipts-empty">{m.receipts_empty()}</p>
	{/if}
</div>

{#if openedReceipt && previews[openedReceipt.id]}
	<Modal title={openedReceipt.name} onClose={() => (opened = null)} wide>
		<div class="receipt-full">
			<img src={previews[openedReceipt.id]} alt={openedReceipt.name} />
		</div>
	</Modal>
{/if}

<style>
	.receipts-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.receipts-hint {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.76rem;
		line-height: 1.5;
	}

	/* Kept in the DOM for the label/click relationship, but never shown. */
	.file-input {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		opacity: 0;
		pointer-events: none;
	}

	.receipts-error {
		margin: 0 0 1rem;
		padding: 0.65rem 0.8rem;
		border: 1px solid #fecdd3;
		border-radius: 0.7rem;
		background: #fff1f2;
		color: var(--danger);
		font-size: 0.78rem;
	}

	.receipts-empty {
		margin: 0;
		padding: 1.5rem 0.25rem;
		color: var(--text-muted);
		font-size: 0.84rem;
	}

	.receipt-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.receipt {
		position: relative;
	}

	.receipt-preview {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 4;
		overflow: hidden;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: 0.8rem;
		background: var(--surface-muted);
		cursor: pointer;
	}

	.receipt-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.receipt-placeholder {
		display: grid;
		height: 100%;
		place-items: center;
		font-size: 1.6rem;
	}

	.receipt-meta {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.35rem;
		color: var(--text-muted);
		font-size: 0.66rem;
	}

	.receipt-delete {
		position: absolute;
		top: 0.35rem;
		right: 0.35rem;
		display: grid;
		width: 1.9rem;
		height: 1.9rem;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: rgba(15, 23, 42, 0.62);
		color: white;
		font: inherit;
		font-size: 1.2rem;
		cursor: pointer;
	}

	.receipt-delete:hover {
		background: var(--danger);
	}

	.receipt-full {
		padding: 1rem;
	}

	.receipt-full img {
		display: block;
		width: 100%;
		border-radius: 0.8rem;
	}

	@media (max-width: 560px) {
		.receipts-toolbar {
			align-items: stretch;
			flex-direction: column;
		}
	}
</style>
