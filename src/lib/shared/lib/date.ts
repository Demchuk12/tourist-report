import type { Locale } from '$lib/paraglide/runtime';

const localeMap: Record<Locale, string> = {
	uk: 'uk-UA',
	en: 'en-GB'
};

export function nowIso(): string {
	return new Date().toISOString();
}

export function formatDate(value: string, locale: Locale): string {
	if (!value) return '—';

	return new Intl.DateTimeFormat(localeMap[locale], {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	}).format(new Date(`${value}T00:00:00`));
}

export function formatDateRange(start: string, end: string, locale: Locale): string {
	return `${formatDate(start, locale)} — ${formatDate(end, locale)}`;
}
