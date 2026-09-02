<script lang="ts">
	import { getTourReportStore } from '$lib/features/tour-report/model/context';
	import TourDetails from '$lib/widgets/tour-details/TourDetails.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const store = getTourReportStore();
</script>

<TourDetails {store} id={params.id} />
