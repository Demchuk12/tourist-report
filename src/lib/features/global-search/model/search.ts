import type { Excursion } from '$lib/entities/excursion/model/types';
import type { Tour } from '$lib/entities/tour/model/types';
import type { Tourist } from '$lib/entities/tourist/model/types';
import type { TourReportData } from '$lib/shared/api/tour-report-data';
import { scoreEntity, toQueryTokens } from '$lib/shared/lib/search';
import type { EntityKind } from '$lib/shared/model/navigation';

export type SearchResultKind = EntityKind;

export type SearchResult =
	| { kind: 'tour'; id: string; score: number; entity: Tour }
	| { kind: 'tourist'; id: string; score: number; entity: Tourist }
	| { kind: 'excursion'; id: string; score: number; entity: Excursion };

export type SearchGroup = {
	kind: SearchResultKind;
	results: SearchResult[];
};

/** Keeps the palette scannable — deeper matches stay reachable by refining the query. */
const RESULTS_PER_GROUP = 6;

function rank<T extends { id: string }>(
	items: T[],
	tokens: string[],
	fields: (item: T) => { primary: string; secondary: string[] }
): { id: string; score: number; entity: T }[] {
	return items
		.map((entity) => {
			const { primary, secondary } = fields(entity);
			return { id: entity.id, score: scoreEntity(primary, secondary, tokens), entity };
		})
		.filter((result) => result.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, RESULTS_PER_GROUP);
}

/**
 * Searches every entity type at once and returns only the non-empty groups,
 * ordered tours → tourists → excursions to match the navigation.
 */
export function searchEntities(data: TourReportData, query: string): SearchGroup[] {
	const tokens = toQueryTokens(query);
	if (!tokens.length) return [];

	const groups: SearchGroup[] = [
		{
			kind: 'tour',
			results: rank(data.tours, tokens, (tour) => ({
				primary: tour.name,
				secondary: [tour.destination, tour.notes]
			})).map((result) => ({ kind: 'tour', ...result }))
		},
		{
			kind: 'tourist',
			results: rank(data.tourists, tokens, (tourist) => ({
				primary: tourist.fullName,
				secondary: [tourist.phone, tourist.email, tourist.documentNumber, tourist.notes]
			})).map((result) => ({ kind: 'tourist', ...result }))
		},
		{
			kind: 'excursion',
			results: rank(data.excursions, tokens, (excursion) => ({
				primary: excursion.title,
				secondary: [excursion.location, excursion.guide, excursion.notes]
			})).map((result) => ({ kind: 'excursion', ...result }))
		}
	];

	return groups.filter((group) => group.results.length > 0);
}

export function countResults(groups: SearchGroup[]): number {
	return groups.reduce((total, group) => total + group.results.length, 0);
}
