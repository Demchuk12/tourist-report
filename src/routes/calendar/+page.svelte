<script lang="ts">
	import { getTourReportStore } from '$lib/features/tour-report/model/context';
	import Calendar from '$lib/widgets/calendar/Calendar.svelte';

	const store = getTourReportStore();
</script>

<Calendar {store} />
