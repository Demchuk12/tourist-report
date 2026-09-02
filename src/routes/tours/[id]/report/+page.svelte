<script lang="ts">
	import { getTourReportStore } from '$lib/features/tour-report/model/context';
	import TourReportDocument from '$lib/widgets/tour-report-document/TourReportDocument.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const store = getTourReportStore();
</script>

<TourReportDocument {store} id={params.id} />
