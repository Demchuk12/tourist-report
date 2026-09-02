import type { Locale } from '$lib/paraglide/runtime';

const localeMap: Record<Locale, string> = {
	uk: 'uk-UA',
	en: 'en-GB'
};

/** Plain decimal amount — the app has no currency concept yet. */
export function formatAmount(value: number, locale: Locale): string {
	return new Intl.NumberFormat(localeMap[locale], {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	}).format(value);
}
