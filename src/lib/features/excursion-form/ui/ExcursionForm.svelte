<script lang="ts">
	import { untrack } from 'svelte';
	import {
		EXCURSION_STATUS_FALLBACK,
		EXCURSION_STATUSES,
		excursionStatusLabels
	} from '$lib/entities/excursion/model/status';
	import type { Excursion, ExcursionDraft } from '$lib/entities/excursion/model/types';
	import * as m from '$lib/paraglide/messages';

	let {
		excursion,
		onSubmit,
		onCancel,
		submitting = false
	}: {
		excursion: Excursion | null;
		onSubmit: (draft: ExcursionDraft) => void;
		onCancel: () => void;
		/** The save request is in flight — the form stays open and locked until it settles. */
		submitting?: boolean;
	} = $props();

	let form = $state<ExcursionDraft>(
		untrack(() => ({
			title: excursion?.title ?? '',
			location: excursion?.location ?? '',
			date: excursion?.date ?? '',
			time: excursion?.time ?? '',
			guide: excursion?.guide ?? '',
			notes: excursion?.notes ?? '',
			price: excursion?.price ?? 0,
			status: excursion?.status ?? EXCURSION_STATUS_FALLBACK
		}))
	);

	function submit(event: SubmitEvent): void {
		event.preventDefault();
		// An emptied number input binds as null, which must never reach the store.
		onSubmit({ ...$state.snapshot(form), price: Number(form.price) || 0 });
	}
</script>

<form onsubmit={submit}>
	<div class="form-grid">
		<label class="span-2">
			<span>{m.field_excursion_title()}</span>
			<input
				required
				maxlength="120"
				bind:value={form.title}
				placeholder={m.placeholder_excursion_title()}
			/>
		</label>

		<label class="span-2">
			<span>{m.field_location()}</span>
			<input
				required
				maxlength="120"
				bind:value={form.location}
				placeholder={m.placeholder_location()}
			/>
		</label>

		<label>
			<span>{m.field_date()}</span>
			<input required type="date" bind:value={form.date} />
		</label>

		<label>
			<span>{m.field_time()}</span>
			<input required type="time" bind:value={form.time} />
		</label>

		<label>
			<span>{m.field_price()}</span>
			<input type="number" min="0" step="0.01" bind:value={form.price} placeholder="0" />
		</label>

		<label>
			<span>{m.field_status()}</span>
			<select bind:value={form.status}>
				{#each EXCURSION_STATUSES as status (status)}
					<option value={status}>{excursionStatusLabels[status]()}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>{m.field_guide()}</span>
			<input maxlength="120" bind:value={form.guide} placeholder={m.placeholder_guide()} />
		</label>
	</div>

	<label>
		<span>{m.field_notes()}</span>
		<textarea rows="3" maxlength="500" bind:value={form.notes} placeholder={m.placeholder_notes()}
		></textarea>
	</label>

	<div class="form-actions">
		<button class="button ghost" type="button" disabled={submitting} onclick={onCancel}
			>{m.action_cancel()}</button
		>
		<button class="button primary" type="submit" disabled={submitting}>
			{#if submitting}
				<span class="button-spinner" aria-hidden="true"></span>
				{m.action_saving()}
			{:else}
				{m.action_save()}
			{/if}
		</button>
	</div>
</form>
