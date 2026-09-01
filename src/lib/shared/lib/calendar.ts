import type { Locale } from '$lib/paraglide/runtime';
import type { TourReportData } from '$lib/shared/api/tour-report-repository';

export type CalendarEventType = 'tour' | 'excursion';
export type CalendarTemporal = 'past' | 'today' | 'future';

export type CalendarEvent = {
	id: string;
	entityId: string;
	type: CalendarEventType;
	title: string;
	dateKey: string;
	meta: string;
	time?: string;
	temporal: CalendarTemporal;
};

export type CalendarDay = {
	dateKey: string;
	dayNumber: number;
	isCurrentMonth: boolean;
	isToday: boolean;
	events: CalendarEvent[];
};

const localeMap: Record<Locale, string> = {
	uk: 'uk-UA',
	en: 'en-GB'
};

const pad = (value: number) => String(value).padStart(2, '0');

function toDateKey(year: number, monthIndex: number, day: number): string {
	return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

function parseDateKey(value: string): Date {
	return new Date(`${value}T12:00:00Z`);
}

function addDays(value: string, amount: number): string {
	const date = parseDateKey(value);
	date.setUTCDate(date.getUTCDate() + amount);
	return date.toISOString().slice(0, 10);
}

function getTemporal(dateKey: string, todayKey: string): CalendarTemporal {
	if (dateKey === todayKey) return 'today';
	return dateKey < todayKey ? 'past' : 'future';
}

export function getCurrentCalendarPoint(): { year: number; monthIndex: number; dateKey: string } {
	const now = new Date();
	return {
		year: now.getFullYear(),
		monthIndex: now.getMonth(),
		dateKey: toDateKey(now.getFullYear(), now.getMonth(), now.getDate())
	};
}

export function shiftMonth(year: number, monthIndex: number, amount: number): [number, number] {
	const absoluteMonth = year * 12 + monthIndex + amount;
	return [Math.floor(absoluteMonth / 12), ((absoluteMonth % 12) + 12) % 12];
}

export function buildCalendarEvents(data: TourReportData, todayKey: string): CalendarEvent[] {
	const events: CalendarEvent[] = [];

	for (const tour of data.tours) {
		if (!tour.startDate || !tour.endDate || tour.endDate < tour.startDate) continue;

		let dateKey = tour.startDate;
		let dayIndex = 0;
		while (dateKey <= tour.endDate && dayIndex < 730) {
			events.push({
				id: `tour:${tour.id}:${dateKey}`,
				entityId: tour.id,
				type: 'tour',
				title: tour.name,
				dateKey,
				meta: tour.destination,
				temporal: getTemporal(dateKey, todayKey)
			});
			dateKey = addDays(dateKey, 1);
			dayIndex += 1;
		}
	}

	for (const excursion of data.excursions) {
		if (!excursion.date) continue;

		events.push({
			id: `excursion:${excursion.id}:${excursion.date}`,
			entityId: excursion.id,
			type: 'excursion',
			title: excursion.title,
			dateKey: excursion.date,
			meta: excursion.location,
			time: excursion.time,
			temporal: getTemporal(excursion.date, todayKey)
		});
	}

	return events.sort((a, b) =>
		`${a.dateKey}${a.time ?? ''}`.localeCompare(`${b.dateKey}${b.time ?? ''}`)
	);
}

export function createMonthGrid(
	year: number,
	monthIndex: number,
	events: CalendarEvent[],
	todayKey: string
): CalendarDay[] {
	const firstDate = toDateKey(year, monthIndex, 1);
	const mondayOffset = (parseDateKey(firstDate).getUTCDay() + 6) % 7;
	const gridStart = addDays(firstDate, -mondayOffset);
	const eventMap = new Map<string, CalendarEvent[]>();

	for (const event of events) {
		eventMap.set(event.dateKey, [...(eventMap.get(event.dateKey) ?? []), event]);
	}

	return Array.from({ length: 42 }, (_, index) => {
		const dateKey = addDays(gridStart, index);
		const date = parseDateKey(dateKey);
		return {
			dateKey,
			dayNumber: date.getUTCDate(),
			isCurrentMonth: date.getUTCFullYear() === year && date.getUTCMonth() === monthIndex,
			isToday: dateKey === todayKey,
			events: eventMap.get(dateKey) ?? []
		};
	});
}

export function formatMonth(year: number, monthIndex: number, locale: Locale): string {
	return new Intl.DateTimeFormat(localeMap[locale], { month: 'long', year: 'numeric' }).format(
		new Date(Date.UTC(year, monthIndex, 1))
	);
}

export function formatCalendarDate(dateKey: string, locale: Locale): string {
	return new Intl.DateTimeFormat(localeMap[locale], {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(parseDateKey(dateKey));
}

export function getWeekdayLabels(locale: Locale): string[] {
	const formatter = new Intl.DateTimeFormat(localeMap[locale], { weekday: 'short' });
	return Array.from({ length: 7 }, (_, index) =>
		formatter.format(new Date(Date.UTC(2024, 0, 1 + index)))
	);
}
