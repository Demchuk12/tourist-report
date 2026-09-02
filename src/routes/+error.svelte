<script lang="ts">
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';
	import { sectionHref } from '$lib/shared/model/navigation';
	import EmptyState from '$lib/shared/ui/EmptyState.svelte';
</script>

<section>
	<EmptyState
		icon="🧭"
		title={m.not_found_title()}
		text={m.not_found_text()}
		actionLabel={m.action_back_to_overview()}
		onAction={() => goto(sectionHref.overview)}
	/>
</section>
