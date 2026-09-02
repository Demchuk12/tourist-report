<script lang="ts">
	import { getTourReportStore } from '$lib/features/tour-report/model/context';
	import ToursManager from '$lib/widgets/tours-manager/ToursManager.svelte';

	const store = getTourReportStore();
</script>

<ToursManager {store} />
