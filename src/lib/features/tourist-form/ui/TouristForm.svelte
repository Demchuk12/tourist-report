<script lang="ts">
	import { untrack } from 'svelte';
	import type { Tour } from '$lib/entities/tour/model/types';
	import type { Tourist, TouristDraft } from '$lib/entities/tourist/model/types';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatDateRange } from '$lib/shared/lib/date';

	let {
		tourist,
		tours,
		tourIds = [],
		onSubmit,
		onCancel,
		submitting = false
	}: {
		tourist: Tourist | null;
		tours: Tour[];
		/** Tours this tourist currently belongs to. */
		tourIds?: string[];
		onSubmit: (draft: TouristDraft, tourIds: string[]) => void;
		onCancel: () => void;
		/** The save request is in flight — the form stays open and locked until it settles. */
		submitting?: boolean;
	} = $props();

	const locale = getLocale();

	let form = $state<TouristDraft>(
		untrack(() => ({
			fullName: tourist?.fullName ?? '',
			phone: tourist?.phone ?? '',
			email: tourist?.email ?? '',
			documentNumber: tourist?.documentNumber ?? '',
			notes: tourist?.notes ?? ''
		}))
	);

	// Membership is not part of the tourist entity, so it is tracked separately.
	let selectedTourIds = $state<string[]>(untrack(() => [...tourIds]));

	function toggleTour(id: string): void {
		selectedTourIds = selectedTourIds.includes(id)
			? selectedTourIds.filter((item) => item !== id)
			: [...selectedTourIds, id];
	}

	function submit(event: SubmitEvent): void {
		event.preventDefault();
		if (submitting) return;

		onSubmit($state.snapshot(form), $state.snapshot(selectedTourIds));
	}
</script>

<form onsubmit={submit}>
	<div class="form-grid">
		<label class="span-2">
			<span>{m.field_full_name()}</span>
			<input
				required
				maxlength="120"
				bind:value={form.fullName}
				placeholder={m.placeholder_full_name()}
			/>
		</label>

		<label>
			<span>{m.field_phone()}</span>
			<input type="tel" maxlength="30" bind:value={form.phone} placeholder="+380 00 000 00 00" />
		</label>

		<label>
			<span>{m.field_email()}</span>
			<input type="email" maxlength="120" bind:value={form.email} placeholder="name@example.com" />
		</label>

		<label class="span-2">
			<span>{m.field_document()}</span>
			<input
				maxlength="60"
				bind:value={form.documentNumber}
				placeholder={m.placeholder_document()}
			/>
		</label>
	</div>

	<fieldset>
		<legend>{m.field_tours()}</legend>
		{#if tours.length}
			<div class="choice-grid">
				{#each tours as tour (tour.id)}
					<label class="choice">
						<input
							type="checkbox"
							checked={selectedTourIds.includes(tour.id)}
							onchange={() => toggleTour(tour.id)}
						/>
						<span>{tour.name} · {formatDateRange(tour.startDate, tour.endDate, locale)}</span>
					</label>
				{/each}
			</div>
		{:else}
			<p class="form-help">{m.no_tours_to_assign()}</p>
		{/if}
	</fieldset>

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
