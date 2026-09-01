<script lang="ts">
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import {
		buildCalendarEvents,
		createMonthGrid,
		formatCalendarDate,
		formatMonth,
		getCurrentCalendarPoint,
		getWeekdayLabels,
		shiftMonth,
		type CalendarEventType
	} from '$lib/shared/lib/calendar';

	let { store }: { store: TourReportStore } = $props();

	const current = getCurrentCalendarPoint();
	const locale = getLocale();
	let year = $state(current.year);
	let monthIndex = $state(current.monthIndex);
	let selectedDate = $state(current.dateKey);

	const events = $derived(buildCalendarEvents(store.data, current.dateKey));
	const days = $derived(createMonthGrid(year, monthIndex, events, current.dateKey));
	const monthPrefix = $derived(`${year}-${String(monthIndex + 1).padStart(2, '0')}`);
	const monthEvents = $derived(events.filter((event) => event.dateKey.startsWith(monthPrefix)));
	const selectedEvents = $derived(events.filter((event) => event.dateKey === selectedDate));

	const eventTypeLabels: Record<CalendarEventType, () => string> = {
		tour: m.calendar_tour,
		excursion: m.calendar_excursion
	};

	function uniqueEntityCount(type: CalendarEventType): number {
		return new Set(
			monthEvents.filter((event) => event.type === type).map((event) => event.entityId)
		).size;
	}

	function moveMonth(amount: number): void {
		[year, monthIndex] = shiftMonth(year, monthIndex, amount);
		selectedDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
	}

	function goToday(): void {
		year = current.year;
		monthIndex = current.monthIndex;
		selectedDate = current.dateKey;
	}
</script>

<section>
	<div class="section-heading calendar-heading">
		<div>
			<p class="section-eyebrow">{m.nav_calendar()}</p>
			<h1>{m.calendar_title()}</h1>
			<p>{m.calendar_subtitle()}</p>
		</div>
		<div class="calendar-stats">
			<span
				><i class="tour-dot"></i>{m.calendar_tours_count({
					count: uniqueEntityCount('tour')
				})}</span
			>
			<span
				><i class="excursion-dot"></i>{m.calendar_excursions_count({
					count: uniqueEntityCount('excursion')
				})}</span
			>
		</div>
	</div>

	<div class="calendar-layout">
		<div class="calendar-panel">
			<header class="calendar-toolbar">
				<div class="month-navigation">
					<button
						type="button"
						aria-label={m.calendar_previous_month()}
						onclick={() => moveMonth(-1)}>‹</button
					>
					<h2>{formatMonth(year, monthIndex, locale)}</h2>
					<button type="button" aria-label={m.calendar_next_month()} onclick={() => moveMonth(1)}
						>›</button
					>
				</div>
				<button class="today-button" type="button" onclick={goToday}>{m.calendar_today()}</button>
			</header>

			<div class="legend">
				<span><i class="tour-dot"></i>{m.calendar_tour()}</span>
				<span><i class="excursion-dot"></i>{m.calendar_excursion()}</span>
				<span class="past-legend">{m.calendar_past()}</span>
				<span>{m.calendar_future()}</span>
			</div>

			<div class="calendar-grid">
				{#each getWeekdayLabels(locale) as weekday (weekday)}
					<div class="weekday">{weekday}</div>
				{/each}

				{#each days as day (day.dateKey)}
					<button
						type="button"
						class="day"
						class:outside={!day.isCurrentMonth}
						class:today={day.isToday}
						class:selected={day.dateKey === selectedDate}
						aria-label={formatCalendarDate(day.dateKey, locale)}
						onclick={() => (selectedDate = day.dateKey)}
					>
						<span class="day-number">{day.dayNumber}</span>
						<span class="day-events">
							{#each day.events.slice(0, 3) as event (event.id)}
								<span class="event-pill {event.type} {event.temporal}">
									<span>{event.time ? `${event.time} ` : ''}{event.title}</span>
								</span>
							{/each}
							{#if day.events.length > 3}
								<small>{m.calendar_more({ count: day.events.length - 3 })}</small>
							{/if}
						</span>
					</button>
				{/each}
			</div>
		</div>

		<aside class="day-panel">
			<p class="section-eyebrow">{m.calendar_selected_day()}</p>
			<h2>{formatCalendarDate(selectedDate, locale)}</h2>

			{#if selectedEvents.length}
				<div class="agenda-list">
					{#each selectedEvents as event (event.id)}
						<article class="agenda-event {event.type} {event.temporal}">
							<div class="agenda-topline">
								<span>{eventTypeLabels[event.type]()}</span>
								{#if event.time}<time>{event.time}</time>{/if}
							</div>
							<h3>{event.title}</h3>
							<p>⌖ {event.meta}</p>
						</article>
					{/each}
				</div>
			{:else}
				<div class="day-empty">
					<span>○</span>
					<p>{m.calendar_no_events()}</p>
				</div>
			{/if}
		</aside>
	</div>
</section>

<style>
	.calendar-heading {
		align-items: flex-end;
	}

	.calendar-stats {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.calendar-stats span,
	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--text-muted);
		font-size: 0.72rem;
		font-weight: 700;
	}

	.calendar-stats span {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: white;
	}

	.tour-dot,
	.excursion-dot {
		display: inline-block;
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
	}

	.tour-dot {
		background: #0ea5e9;
	}

	.excursion-dot {
		background: #f59e0b;
	}

	.calendar-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 19rem;
		gap: 1rem;
		align-items: start;
	}

	.calendar-panel,
	.day-panel {
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: white;
		box-shadow: 0 12px 35px rgba(15, 23, 42, 0.04);
	}

	.calendar-panel {
		overflow: hidden;
	}

	.calendar-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.15rem 1.25rem;
		border-bottom: 1px solid var(--border);
	}

	.month-navigation {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.month-navigation h2 {
		min-width: 13rem;
		margin: 0;
		font-size: 1.15rem;
		letter-spacing: -0.025em;
		text-align: center;
		text-transform: capitalize;
	}

	.month-navigation button,
	.today-button {
		border: 1px solid var(--border);
		background: white;
		color: var(--text);
		font: inherit;
		font-weight: 750;
		cursor: pointer;
	}

	.month-navigation button {
		display: grid;
		width: 2.3rem;
		height: 2.3rem;
		place-items: center;
		border-radius: 0.65rem;
		font-size: 1.35rem;
	}

	.today-button {
		min-height: 2.3rem;
		padding: 0 0.85rem;
		border-radius: 0.65rem;
		color: var(--brand-dark);
		font-size: 0.75rem;
	}

	.legend {
		display: flex;
		gap: 1rem;
		padding: 0.7rem 1.25rem;
		border-bottom: 1px solid var(--border);
		background: #fbfdff;
	}

	.legend .past-legend {
		opacity: 0.45;
	}

	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
	}

	.weekday {
		padding: 0.7rem 0.4rem;
		border-right: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.65rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-align: center;
		text-transform: uppercase;
	}

	.weekday:nth-child(7) {
		border-right: 0;
	}

	.day {
		position: relative;
		display: flex;
		min-width: 0;
		min-height: 7.4rem;
		flex-direction: column;
		gap: 0.55rem;
		padding: 0.55rem;
		border: 0;
		border-top: 1px solid var(--border);
		border-right: 1px solid var(--border);
		outline: 0;
		background: white;
		color: var(--text);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.day:nth-child(7n) {
		border-right: 0;
	}

	.day:hover,
	.day.selected {
		background: #f0f9ff;
	}

	.day.selected {
		box-shadow: inset 0 0 0 2px #7dd3fc;
	}

	.day.outside {
		background: #fafbfc;
		color: #a5b1bf;
	}

	.day-number {
		display: grid;
		width: 1.6rem;
		height: 1.6rem;
		place-items: center;
		border-radius: 50%;
		font-size: 0.75rem;
		font-weight: 750;
	}

	.day.today .day-number {
		background: #10233f;
		color: white;
	}

	.day-events {
		display: grid;
		gap: 0.25rem;
		width: 100%;
		min-width: 0;
	}

	.event-pill {
		display: block;
		overflow: hidden;
		padding: 0.3rem 0.4rem;
		border-left: 3px solid;
		border-radius: 0.35rem;
		font-size: 0.62rem;
		font-weight: 700;
		line-height: 1.25;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.event-pill.tour {
		border-color: #0ea5e9;
		background: #e0f2fe;
		color: #075985;
	}

	.event-pill.excursion {
		border-color: #f59e0b;
		background: #fef3c7;
		color: #92400e;
	}

	.event-pill.past,
	.agenda-event.past {
		opacity: 0.48;
	}

	.event-pill.today {
		box-shadow: inset 0 0 0 1px currentColor;
	}

	.day-events small {
		color: var(--text-muted);
		font-size: 0.58rem;
		font-weight: 700;
	}

	.day-panel {
		position: sticky;
		top: 2rem;
		padding: 1.25rem;
	}

	.day-panel h2 {
		margin: 0;
		font-size: 1.2rem;
		line-height: 1.25;
		letter-spacing: -0.03em;
		text-transform: capitalize;
	}

	.agenda-list {
		display: grid;
		gap: 0.65rem;
		margin-top: 1.25rem;
	}

	.agenda-event {
		padding: 0.85rem;
		border: 1px solid var(--border);
		border-left: 3px solid;
		border-radius: 0.75rem;
		background: #fbfdff;
	}

	.agenda-event.tour {
		border-left-color: #0ea5e9;
	}

	.agenda-event.excursion {
		border-left-color: #f59e0b;
	}

	.agenda-topline {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		color: var(--text-muted);
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.agenda-event h3 {
		margin: 0.45rem 0 0.25rem;
		font-size: 0.88rem;
	}

	.agenda-event p {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.72rem;
		line-height: 1.45;
	}

	.day-empty {
		display: grid;
		min-height: 15rem;
		place-items: center;
		align-content: center;
		color: var(--text-muted);
		text-align: center;
	}

	.day-empty span {
		font-size: 2rem;
	}

	.day-empty p {
		margin: 0.5rem 0 0;
		font-size: 0.78rem;
	}

	@media (max-width: 1120px) {
		.calendar-layout {
			grid-template-columns: 1fr;
		}

		.day-panel {
			position: static;
		}

		.day-empty {
			min-height: 8rem;
		}
	}

	@media (max-width: 700px) {
		.calendar-heading {
			align-items: flex-start;
		}

		.calendar-stats {
			justify-content: flex-start;
		}

		.calendar-toolbar {
			padding: 0.85rem;
		}

		.month-navigation {
			gap: 0.3rem;
		}

		.month-navigation h2 {
			min-width: 0;
			font-size: 0.95rem;
		}

		.legend {
			gap: 0.7rem;
			overflow-x: auto;
			padding: 0.65rem 0.85rem;
		}

		.legend span {
			white-space: nowrap;
		}

		.weekday {
			padding-inline: 0.1rem;
			font-size: 0.55rem;
		}

		.day {
			min-height: 4.8rem;
			gap: 0.25rem;
			padding: 0.3rem;
		}

		.day-number {
			width: 1.4rem;
			height: 1.4rem;
			font-size: 0.66rem;
		}

		.event-pill {
			height: 0.32rem;
			padding: 0;
			border: 0;
			border-radius: 999px;
		}

		.event-pill.tour {
			background: #0ea5e9;
		}

		.event-pill.excursion {
			background: #f59e0b;
		}

		.event-pill span {
			display: none;
		}

		.day-events small {
			display: none;
		}
	}

	@media (max-width: 430px) {
		.calendar-toolbar {
			align-items: stretch;
			flex-direction: column;
		}

		.month-navigation {
			justify-content: space-between;
		}

		.today-button {
			width: 100%;
		}
	}
</style>
