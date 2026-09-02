import { resolve } from '$app/paths';

export type AppSection = 'overview' | 'calendar' | 'tours' | 'tourists' | 'excursions';

export type EntityKind = 'tour' | 'tourist' | 'excursion';

/**
 * Every URL in the app is built here through SvelteKit's `resolve()`, so route
 * ids are checked at compile time and the base path is always applied.
 */
export const sectionHref: Record<AppSection, string> = {
	overview: resolve('/'),
	calendar: resolve('/calendar'),
	tours: resolve('/tours'),
	tourists: resolve('/tourists'),
	excursions: resolve('/excursions')
};

/**
 * Where an entity lives in the URL. Adding an entity type means adding one row
 * here plus the matching `routes/<section>` folder.
 */
export const entityRoute: Record<
	EntityKind,
	{ section: AppSection; list: string; detail: (id: string) => string }
> & { tour: { report: (id: string) => string } } = {
	tour: {
		section: 'tours',
		list: sectionHref.tours,
		detail: (id) => resolve('/tours/[id]', { id }),
		report: (id) => resolve('/tours/[id]/report', { id })
	},
	tourist: {
		section: 'tourists',
		list: sectionHref.tourists,
		detail: (id) => resolve('/tourists/[id]', { id })
	},
	excursion: {
		section: 'excursions',
		list: sectionHref.excursions,
		detail: (id) => resolve('/excursions/[id]', { id })
	}
};

/** Detail routes keep their section highlighted in the navigation. */
export function isSectionActive(pathname: string, section: AppSection): boolean {
	const href = sectionHref[section];
	if (href === sectionHref.overview) return pathname === href;
	return pathname === href || pathname.startsWith(`${href}/`);
}
