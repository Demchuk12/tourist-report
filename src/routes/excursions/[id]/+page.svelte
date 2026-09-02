<script lang="ts">
	import { getTourReportStore } from '$lib/features/tour-report/model/context';
	import ExcursionDetails from '$lib/widgets/excursion-details/ExcursionDetails.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const store = getTourReportStore();
</script>

<ExcursionDetails {store} id={params.id} />
