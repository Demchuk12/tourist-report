<script lang="ts">
	import { untrack } from 'svelte';
	import type { Excursion } from '$lib/entities/excursion/model/types';
	import type { Tour, TourDraft, TourStatus } from '$lib/entities/tour/model/types';
	import type { Tourist } from '$lib/entities/tourist/model/types';
	import * as m from '$lib/paraglide/messages';

	let {
		tour,
		tourists,
		excursions,
		onSubmit,
		onCancel,
		submitting = false
	}: {
		tour: Tour | null;
		tourists: Tourist[];
		excursions: Excursion[];
		onSubmit: (draft: TourDraft) => void;
		onCancel: () => void;
		/** The save request is in flight — the form stays open and locked until it settles. */
		submitting?: boolean;
	} = $props();

	let form = $state<TourDraft>(
		untrack(() => ({
			name: tour?.name ?? '',
			destination: tour?.destination ?? '',
			startDate: tour?.startDate ?? '',
			endDate: tour?.endDate ?? '',
			status: tour?.status ?? 'planned',
			touristIds: [...(tour?.touristIds ?? [])],
			excursionIds: [...(tour?.excursionIds ?? [])],
			notes: tour?.notes ?? ''
		}))
	);

	const statuses: TourStatus[] = ['planned', 'active', 'completed'];
	const statusLabels: Record<TourStatus, () => string> = {
		planned: m.status_planned,
		active: m.status_active,
		completed: m.status_completed
	};

	function toggle(list: 'touristIds' | 'excursionIds', id: string): void {
		form[list] = form[list].includes(id)
			? form[list].filter((item) => item !== id)
			: [...form[list], id];
	}

	function submit(event: SubmitEvent): void {
		event.preventDefault();
		if (submitting) return;

		onSubmit($state.snapshot(form));
	}
</script>

<form onsubmit={submit}>
	<div class="form-grid">
		<label class="span-2">
			<span>{m.field_tour_name()}</span>
			<input
				required
				maxlength="100"
				bind:value={form.name}
				placeholder={m.placeholder_tour_name()}
			/>
		</label>

		<label class="span-2">
			<span>{m.field_destination()}</span>
			<input
				required
				maxlength="100"
				bind:value={form.destination}
				placeholder={m.placeholder_destination()}
			/>
		</label>

		<label>
			<span>{m.field_start_date()}</span>
			<input required type="date" bind:value={form.startDate} />
		</label>

		<label>
			<span>{m.field_end_date()}</span>
			<input required type="date" min={form.startDate} bind:value={form.endDate} />
		</label>

		<label class="span-2">
			<span>{m.field_status()}</span>
			<select bind:value={form.status}>
				{#each statuses as status (status)}
					<option value={status}>{statusLabels[status]()}</option>
				{/each}
			</select>
		</label>
	</div>

	<fieldset>
		<legend>{m.field_tourists()}</legend>
		{#if tourists.length}
			<div class="choice-grid">
				{#each tourists as tourist (tourist.id)}
					<label class="choice">
						<input
							type="checkbox"
							checked={form.touristIds.includes(tourist.id)}
							onchange={() => toggle('touristIds', tourist.id)}
						/>
						<span>{tourist.fullName}</span>
					</label>
				{/each}
			</div>
		{:else}
			<p class="form-help">{m.no_tourists_to_assign()}</p>
		{/if}
	</fieldset>

	<fieldset>
		<legend>{m.field_excursions()}</legend>
		{#if excursions.length}
			<div class="choice-grid">
				{#each excursions as excursion (excursion.id)}
					<label class="choice">
						<input
							type="checkbox"
							checked={form.excursionIds.includes(excursion.id)}
							onchange={() => toggle('excursionIds', excursion.id)}
						/>
						<span>{excursion.title}</span>
					</label>
				{/each}
			</div>
		{:else}
			<p class="form-help">{m.no_excursions_to_assign()}</p>
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
