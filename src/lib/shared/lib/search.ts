const WORD_SEPARATOR = /[^\p{L}\p{N}]+/u;

export function normalizeText(value: string): string {
	return value
		.toLocaleLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();
}

export function toQueryTokens(query: string): string[] {
	const normalized = normalizeText(query);
	return normalized ? normalized.split(WORD_SEPARATOR).filter(Boolean) : [];
}

function startsWithWord(text: string, token: string): boolean {
	return text.split(WORD_SEPARATOR).some((word) => word.startsWith(token));
}

/**
 * Ranks a record against every query token. Returns 0 when at least one token
 * has no match, so multi-word queries narrow results instead of widening them.
 * Matches in the primary field outrank matches in the secondary ones.
 */
export function scoreEntity(primary: string, secondary: string[], tokens: string[]): number {
	if (!tokens.length) return 0;

	const primaryText = normalizeText(primary);
	const secondaryText = normalizeText(secondary.filter(Boolean).join(' '));
	let score = 0;

	for (const token of tokens) {
		if (primaryText.startsWith(token)) score += 8;
		else if (startsWithWord(primaryText, token)) score += 5;
		else if (primaryText.includes(token)) score += 3;
		else if (startsWithWord(secondaryText, token)) score += 2;
		else if (secondaryText.includes(token)) score += 1;
		else return 0;
	}

	return score;
}
