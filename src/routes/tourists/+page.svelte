<script lang="ts">
	import { getTourReportStore } from '$lib/features/tour-report/model/context';
	import TouristsManager from '$lib/widgets/tourists-manager/TouristsManager.svelte';

	const store = getTourReportStore();
</script>

<TouristsManager {store} />
