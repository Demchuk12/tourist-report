<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { getLocale, locales, setLocale, type Locale } from '$lib/paraglide/runtime';

	const localeNames: Record<Locale, string> = {
		uk: 'Українська',
		en: 'English'
	};

	let switching = $state(false);
	const currentLocale = $derived(getLocale());

	async function switchLocale(locale: Locale) {
		if (locale === currentLocale) return;

		switching = true;
		await setLocale(locale);
	}
</script>

<div class="language-switcher" aria-label={m.language_label()}>
	{#each locales as locale (locale)}
		<button
			type="button"
			class:active={locale === currentLocale}
			aria-pressed={locale === currentLocale}
			disabled={switching}
			onclick={() => switchLocale(locale)}
		>
			{localeNames[locale]}
		</button>
	{/each}
</div>

<style>
	.language-switcher {
		display: inline-flex;
		gap: 0.25rem;
		padding: 0.25rem;
		border: 1px solid rgba(15, 23, 42, 0.12);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.82);
		box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
		backdrop-filter: blur(12px);
	}

	button {
		border: 0;
		border-radius: 999px;
		padding: 0.6rem 0.9rem;
		background: transparent;
		color: #475569;
		font: inherit;
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			background 150ms ease,
			color 150ms ease;
	}

	button:hover:not(:disabled),
	button:focus-visible {
		color: #0f172a;
		outline: none;
	}

	button:focus-visible {
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.25);
	}

	button.active {
		background: #0f172a;
		color: white;
	}

	button:disabled {
		cursor: wait;
		opacity: 0.65;
	}
</style>
