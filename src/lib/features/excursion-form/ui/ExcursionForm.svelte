<script lang="ts">
	import { untrack } from 'svelte';
	import type { Excursion, ExcursionDraft } from '$lib/entities/excursion/model/types';
	import * as m from '$lib/paraglide/messages';

	let {
		excursion,
		onSubmit,
		onCancel
	}: {
		excursion: Excursion | null;
		onSubmit: (draft: ExcursionDraft) => void;
		onCancel: () => void;
	} = $props();

	let form = $state<ExcursionDraft>(
		untrack(() => ({
			title: excursion?.title ?? '',
			location: excursion?.location ?? '',
			date: excursion?.date ?? '',
			time: excursion?.time ?? '',
			guide: excursion?.guide ?? '',
			notes: excursion?.notes ?? ''
		}))
	);

	function submit(event: SubmitEvent): void {
		event.preventDefault();
		onSubmit($state.snapshot(form));
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

		<label class="span-2">
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
		<button class="button ghost" type="button" onclick={onCancel}>{m.action_cancel()}</button>
		<button class="button primary" type="submit">{m.action_save()}</button>
	</div>
</form>
