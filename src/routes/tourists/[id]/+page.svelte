<script lang="ts">
	import { getTourReportStore } from '$lib/features/tour-report/model/context';
	import TouristDetails from '$lib/widgets/tourist-details/TouristDetails.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const store = getTourReportStore();
</script>

<TouristDetails {store} id={params.id} />
