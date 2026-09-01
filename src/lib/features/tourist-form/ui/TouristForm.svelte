<script lang="ts">
	import { untrack } from 'svelte';
	import type { Tourist, TouristDraft } from '$lib/entities/tourist/model/types';
	import * as m from '$lib/paraglide/messages';

	let {
		tourist,
		onSubmit,
		onCancel
	}: {
		tourist: Tourist | null;
		onSubmit: (draft: TouristDraft) => void;
		onCancel: () => void;
	} = $props();

	let form = $state<TouristDraft>(
		untrack(() => ({
			fullName: tourist?.fullName ?? '',
			phone: tourist?.phone ?? '',
			email: tourist?.email ?? '',
			documentNumber: tourist?.documentNumber ?? '',
			notes: tourist?.notes ?? ''
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
