<script lang="ts">
	import { getTourReportStore } from '$lib/features/tour-report/model/context';
	import ExcursionsManager from '$lib/widgets/excursions-manager/ExcursionsManager.svelte';

	const store = getTourReportStore();
</script>

<ExcursionsManager {store} />
