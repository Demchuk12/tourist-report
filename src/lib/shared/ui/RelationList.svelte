<script lang="ts" module>
	export type RelationItem = {
		id: string;
		href: string;
		title: string;
		subtitle: string;
		badge?: string;
	};
</script>

<script lang="ts">
	let {
		items,
		emptyText
	}: {
		items: RelationItem[];
		emptyText: string;
	} = $props();
</script>

{#if items.length}
	<ul class="relation-list">
		{#each items as item (item.id)}
			<li>
				<a href={item.href}>
					<span class="relation-body">
						<strong>{item.title}</strong>
						<small>{item.subtitle}</small>
					</span>
					{#if item.badge}<span class="relation-badge">{item.badge}</span>{/if}
					<span class="relation-chevron" aria-hidden="true">›</span>
				</a>
			</li>
		{/each}
	</ul>
{:else}
	<p class="relation-empty">{emptyText}</p>
{/if}

<style>
	.relation-list {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li + li a {
		border-top: 1px solid var(--border);
	}

	a {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.85rem 0.25rem;
		color: inherit;
		text-decoration: none;
	}

	a:hover {
		background: #f8fbfe;
	}

	.relation-body {
		display: grid;
		min-width: 0;
		flex: 1;
		gap: 0.2rem;
	}

	.relation-body strong {
		overflow: hidden;
		font-size: 0.9rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.relation-body small {
		overflow: hidden;
		color: var(--text-muted);
		font-size: 0.76rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.relation-badge {
		display: inline-flex;
		flex: 0 0 auto;
		align-items: center;
		min-height: 1.7rem;
		padding: 0.25rem 0.55rem;
		border-radius: 999px;
		background: var(--surface-muted);
		color: var(--text-muted);
		font-size: 0.66rem;
		font-weight: 750;
	}

	.relation-chevron {
		flex: 0 0 auto;
		color: var(--border-strong);
		font-size: 1.2rem;
	}

	.relation-empty {
		margin: 0;
		padding: 1.5rem 0.25rem;
		color: var(--text-muted);
		font-size: 0.84rem;
	}
</style>
