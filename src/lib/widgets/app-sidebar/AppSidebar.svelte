<script lang="ts">
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import * as m from '$lib/paraglide/messages';
	import type { AppSection } from '$lib/shared/model/navigation';

	let { active, onNavigate }: { active: AppSection; onNavigate: (section: AppSection) => void } =
		$props();

	const navigation: { id: AppSection; icon: string; label: () => string }[] = [
		{ id: 'overview', icon: '⌂', label: m.nav_overview },
		{ id: 'calendar', icon: '□', label: m.nav_calendar },
		{ id: 'tours', icon: '⌖', label: m.nav_tours },
		{ id: 'tourists', icon: '♙', label: m.nav_tourists },
		{ id: 'excursions', icon: '◇', label: m.nav_excursions }
	];
</script>

<aside>
	<div class="brand-block">
		<span class="brand-mark">TR</span>
		<div>
			<strong>{m.app_name()}</strong>
			<small>{m.app_tagline()}</small>
		</div>
	</div>

	<nav aria-label={m.main_navigation()}>
		{#each navigation as item (item.id)}
			<button class:active={active === item.id} type="button" onclick={() => onNavigate(item.id)}>
				<span class="nav-icon" aria-hidden="true">{item.icon}</span>
				<span>{item.label()}</span>
			</button>
		{/each}
	</nav>

	<div class="sidebar-footer">
		<p>{m.interface_language()}</p>
		<LanguageSwitcher />
	</div>
</aside>

<style>
	aside {
		position: sticky;
		top: 0;
		display: flex;
		width: 16.5rem;
		height: 100vh;
		flex: 0 0 auto;
		flex-direction: column;
		padding: 1.25rem 1rem;
		border-right: 1px solid #dce5ee;
		background: rgba(250, 252, 255, 0.94);
		backdrop-filter: blur(18px);
	}

	.brand-block {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 0.45rem 0.55rem 1.75rem;
	}

	.brand-mark {
		display: grid;
		width: 2.65rem;
		height: 2.65rem;
		place-items: center;
		border-radius: 0.85rem;
		background: #10233f;
		box-shadow: 0 8px 20px rgba(15, 35, 63, 0.2);
		color: white;
		font-weight: 900;
		letter-spacing: -0.06em;
	}

	.brand-block div {
		display: grid;
		gap: 0.2rem;
		min-width: 0;
	}

	.brand-block strong {
		font-size: 0.94rem;
		letter-spacing: -0.02em;
	}

	.brand-block small {
		overflow: hidden;
		color: var(--text-muted);
		font-size: 0.68rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	nav {
		display: grid;
		gap: 0.35rem;
	}

	nav button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem;
		border: 0;
		border-radius: 0.8rem;
		background: transparent;
		color: #5d6b7c;
		font: inherit;
		font-size: 0.86rem;
		font-weight: 650;
		text-align: left;
		cursor: pointer;
		transition:
			background 150ms ease,
			color 150ms ease;
	}

	nav button:hover {
		background: #edf3f8;
		color: var(--text);
	}

	nav button.active {
		background: #e0f2fe;
		color: #075985;
	}

	.nav-icon {
		display: grid;
		width: 1.75rem;
		height: 1.75rem;
		place-items: center;
		border-radius: 0.55rem;
		font-size: 1rem;
	}

	nav button.active .nav-icon {
		background: white;
		box-shadow: 0 3px 10px rgba(14, 116, 144, 0.1);
	}

	.sidebar-footer {
		margin-top: auto;
		padding: 1rem 0.5rem 0;
		border-top: 1px solid var(--border);
	}

	.sidebar-footer p {
		margin: 0 0 0.65rem;
		color: var(--text-muted);
		font-size: 0.68rem;
		font-weight: 750;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	@media (max-width: 760px) {
		aside {
			position: sticky;
			z-index: 20;
			top: 0;
			display: flex;
			width: 100%;
			height: auto;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			padding: 0.7rem 0.8rem;
			border-right: 0;
			border-bottom: 1px solid var(--border);
			background: #fafdff;
			backdrop-filter: none;
		}

		.brand-block {
			padding: 0;
		}

		.brand-block small,
		.sidebar-footer p {
			display: none;
		}

		.sidebar-footer {
			margin: 0;
			padding: 0;
			border: 0;
		}

		nav {
			position: fixed;
			z-index: 30;
			right: 0.65rem;
			bottom: 0.65rem;
			left: 0.65rem;
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			gap: 0.2rem;
			padding: 0.4rem;
			border: 1px solid var(--border);
			border-radius: 1rem;
			background: rgba(255, 255, 255, 0.96);
			box-shadow: 0 14px 40px rgba(15, 23, 42, 0.16);
			backdrop-filter: blur(18px);
		}

		nav button {
			flex-direction: column;
			gap: 0.1rem;
			padding: 0.4rem 0.2rem;
			font-size: 0.63rem;
			text-align: center;
		}

		.nav-icon {
			font-size: 1rem;
		}
	}

	@media (max-width: 430px) {
		.brand-block div {
			display: none;
		}
	}
</style>
