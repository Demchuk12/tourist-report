<script lang="ts">
	import type { TourStatus } from '$lib/entities/tour/model/types';
	import {
		countResults,
		searchEntities,
		type SearchResult,
		type SearchResultKind
	} from '$lib/features/global-search/model/search';
	import type { TourReportStore } from '$lib/features/tour-report/model/tour-report-store.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatDate, formatDateRange } from '$lib/shared/lib/date';

	let {
		store,
		onSelect,
		onClose
	}: {
		store: TourReportStore;
		onSelect: (result: SearchResult) => void;
		onClose: () => void;
	} = $props();

	const locale = getLocale();
	let query = $state('');
	let activeIndex = $state(0);
	let inputElement = $state<HTMLInputElement | null>(null);
	let listElement = $state<HTMLDivElement | null>(null);

	const groups = $derived(searchEntities(store.data, query));
	const flatResults = $derived(groups.flatMap((group) => group.results));
	const activeResult = $derived(flatResults[activeIndex]);

	const groupLabels: Record<SearchResultKind, () => string> = {
		tour: m.nav_tours,
		tourist: m.nav_tourists,
		excursion: m.nav_excursions
	};

	const groupIcons: Record<SearchResultKind, string> = {
		tour: '🧭',
		tourist: '👤',
		excursion: '🏛'
	};

	const statusLabels: Record<TourStatus, () => string> = {
		planned: m.status_planned,
		active: m.status_active,
		completed: m.status_completed
	};

	$effect(() => {
		inputElement?.focus();
	});

	$effect(() => {
		document.body.classList.add('is-locked');
		return () => document.body.classList.remove('is-locked');
	});

	$effect(() => {
		if (!activeResult) return;
		listElement
			?.querySelector(`[data-result-id="${activeResult.id}"]`)
			?.scrollIntoView({ block: 'nearest' });
	});

	function resultDomId(result: SearchResult): string {
		return `global-search-${result.kind}-${result.id}`;
	}

	function tourUsage(id: string, key: 'touristIds' | 'excursionIds'): number {
		return store.data.tours.filter((tour) => tour[key].includes(id)).length;
	}

	function move(step: number): void {
		if (!flatResults.length) return;
		activeIndex = (activeIndex + step + flatResults.length) % flatResults.length;
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			move(1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			move(-1);
		} else if (event.key === 'Enter' && activeResult) {
			event.preventDefault();
			onSelect(activeResult);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
		}
	}
</script>

<div class="search-layer">
	<button class="search-backdrop" type="button" aria-label={m.search_close()} onclick={onClose}
	></button>

	<div class="palette" role="dialog" aria-modal="true" aria-label={m.search_global_title()}>
		<div class="palette-field">
			<span class="field-icon" aria-hidden="true">⌕</span>
			<input
				bind:this={inputElement}
				bind:value={query}
				type="search"
				role="combobox"
				aria-expanded={flatResults.length > 0}
				aria-controls="global-search-results"
				aria-activedescendant={activeResult ? resultDomId(activeResult) : undefined}
				aria-label={m.search_global_title()}
				placeholder={m.search_global_placeholder()}
				autocomplete="off"
				spellcheck="false"
				onkeydown={handleKeydown}
				oninput={() => (activeIndex = 0)}
			/>
			<button class="palette-close" type="button" aria-label={m.search_close()} onclick={onClose}
				>×</button
			>
		</div>

		<div class="palette-body" bind:this={listElement}>
			{#if !query.trim()}
				<p class="palette-hint">{m.search_global_hint()}</p>
			{:else if flatResults.length}
				<div id="global-search-results" role="listbox" aria-label={m.search_global_title()}>
					{#each groups as group (group.kind)}
						<div role="group" aria-label={groupLabels[group.kind]()}>
							<p class="group-title" aria-hidden="true">
								<span>{groupIcons[group.kind]}</span>
								{groupLabels[group.kind]()}
								<small>{group.results.length}</small>
							</p>

							{#each group.results as result (result.id)}
								<button
									id={resultDomId(result)}
									class="result"
									class:active={activeResult?.id === result.id}
									data-result-id={result.id}
									type="button"
									role="option"
									aria-selected={activeResult?.id === result.id}
									onmousemove={() => (activeIndex = flatResults.indexOf(result))}
									onclick={() => onSelect(result)}
								>
									{#if result.kind === 'tour'}
										<span class="result-body">
											<strong>{result.entity.name}</strong>
											<small>
												⌖ {result.entity.destination} ·
												{formatDateRange(result.entity.startDate, result.entity.endDate, locale)}
											</small>
										</span>
										<span class="status {result.entity.status}"
											>{statusLabels[result.entity.status]()}</span
										>
									{:else if result.kind === 'tourist'}
										<span class="result-body">
											<strong>{result.entity.fullName}</strong>
											<small>
												{[result.entity.phone, result.entity.email].filter(Boolean).join(' · ') ||
													m.search_no_contacts()}
											</small>
										</span>
										<span class="usage"
											>{m.used_in_tours({ count: tourUsage(result.id, 'touristIds') })}</span
										>
									{:else}
										<span class="result-body">
											<strong>{result.entity.title}</strong>
											<small>
												⌖ {result.entity.location} · {formatDate(result.entity.date, locale)}
												{result.entity.time ? `· ${result.entity.time}` : ''}
											</small>
										</span>
										<span class="usage"
											>{m.used_in_tours({ count: tourUsage(result.id, 'excursionIds') })}</span
										>
									{/if}
								</button>
							{/each}
						</div>
					{/each}
				</div>
			{:else}
				<p class="palette-hint">{m.no_search_results()}</p>
			{/if}
		</div>

		<footer class="palette-footer">
			<span class="result-total">{m.items_found({ count: countResults(groups) })}</span>
			<span class="shortcuts">
				<kbd>↑</kbd><kbd>↓</kbd>
				{m.search_hint_navigate()}
				<kbd>↵</kbd>
				{m.search_hint_open()}
				<kbd>esc</kbd>
				{m.search_hint_close()}
			</span>
		</footer>
	</div>
</div>

<style>
	.search-layer {
		position: fixed;
		z-index: 60;
		inset: 0;
		display: grid;
		align-content: start;
		justify-items: center;
		padding: clamp(1rem, 9vh, 6rem) 1rem 1rem;
	}

	.search-backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
		background: rgba(15, 23, 42, 0.55);
		backdrop-filter: blur(5px);
		cursor: default;
	}

	.palette {
		position: relative;
		display: flex;
		width: min(100%, 40rem);
		max-height: min(70vh, 34rem);
		max-height: min(70dvh, 34rem);
		flex-direction: column;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: white;
		box-shadow: 0 28px 80px rgba(15, 23, 42, 0.32);
	}

	.palette-field {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.35rem 0.75rem 0.35rem 1rem;
		border-bottom: 1px solid var(--border);
	}

	.field-icon {
		color: var(--text-muted);
		font-size: 1.1rem;
	}

	.palette-field input {
		width: 100%;
		min-height: 3.25rem;
		border: 0;
		outline: 0;
		background: transparent;
		color: var(--text);
		font-size: 1rem;
		font-weight: 600;
	}

	.palette-field input::-webkit-search-cancel-button {
		display: none;
	}

	.palette-close {
		display: grid;
		width: 2.25rem;
		height: 2.25rem;
		flex: 0 0 auto;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: var(--surface-muted);
		color: var(--text-muted);
		font: inherit;
		font-size: 1.4rem;
		cursor: pointer;
	}

	.palette-body {
		overflow-y: auto;
		padding: 0.5rem;
		overscroll-behavior: contain;
		-webkit-overflow-scrolling: touch;
	}

	.palette-hint {
		margin: 0;
		padding: 2.5rem 1.5rem;
		color: var(--text-muted);
		font-size: 0.84rem;
		line-height: 1.55;
		text-align: center;
	}

	.group-title {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin: 0.75rem 0 0.35rem;
		padding: 0 0.65rem;
		color: var(--text-muted);
		font-size: 0.66rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.group-title:first-child {
		margin-top: 0.25rem;
	}

	.group-title small {
		display: grid;
		min-width: 1.25rem;
		height: 1.25rem;
		place-items: center;
		padding: 0 0.35rem;
		border-radius: 999px;
		background: var(--surface-muted);
		font-size: 0.62rem;
		letter-spacing: 0;
	}

	.result {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 0.75rem;
		padding: 0.7rem 0.65rem;
		border: 0;
		border-radius: 0.75rem;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.result.active {
		background: var(--brand-soft);
	}

	.result-body {
		display: grid;
		min-width: 0;
		flex: 1;
		gap: 0.2rem;
	}

	.result-body strong {
		overflow: hidden;
		font-size: 0.88rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result-body small {
		overflow: hidden;
		color: var(--text-muted);
		font-size: 0.74rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result .status,
	.result .usage {
		flex: 0 0 auto;
	}

	.palette-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.6rem 1rem;
		border-top: 1px solid var(--border);
		background: #fbfdff;
		color: var(--text-muted);
		font-size: 0.68rem;
		font-weight: 700;
	}

	.shortcuts {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	kbd {
		display: inline-grid;
		min-width: 1.35rem;
		height: 1.35rem;
		place-items: center;
		padding: 0 0.3rem;
		border: 1px solid var(--border-strong);
		border-bottom-width: 2px;
		border-radius: 0.35rem;
		background: white;
		font-family: inherit;
		font-size: 0.62rem;
	}

	@media (max-width: 640px) {
		.search-layer {
			padding: 0;
		}

		.palette {
			width: 100%;
			height: 100vh;
			height: 100dvh;
			max-height: none;
			border: 0;
			border-radius: 0;
			padding-top: env(safe-area-inset-top);
		}

		.palette-body {
			flex: 1;
			padding-bottom: calc(1rem + env(safe-area-inset-bottom));
		}

		/* 16px keeps iOS Safari from zooming the viewport on focus. */
		.palette-field input {
			font-size: 16px;
		}

		.palette-footer {
			display: none;
		}
	}
</style>
