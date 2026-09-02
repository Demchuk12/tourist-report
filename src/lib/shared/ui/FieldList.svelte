<script lang="ts" module>
	export type DetailField = {
		label: string;
		value: string;
		/** Renders the value as a link (tel:, mailto:, or an app route). */
		href?: string;
		/** Long-form values (notes) get their own full-width row. */
		wide?: boolean;
	};
</script>

<script lang="ts">
	let { fields }: { fields: DetailField[] } = $props();

	const EMPTY_VALUE = '—';
</script>

<dl class="field-list">
	{#each fields as field (field.label)}
		<div class:wide={field.wide}>
			<dt>{field.label}</dt>
			<dd>
				{#if field.value && field.href}
					<a href={field.href}>{field.value}</a>
				{:else if field.value}
					{field.value}
				{:else}
					<span class="empty">{EMPTY_VALUE}</span>
				{/if}
			</dd>
		</div>
	{/each}
</dl>

<style>
	.field-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
		gap: 1.1rem 1.5rem;
		margin: 0;
	}

	.wide {
		grid-column: 1 / -1;
	}

	dt {
		margin-bottom: 0.3rem;
		color: var(--text-muted);
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	dd {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.5;
		overflow-wrap: anywhere;
		white-space: pre-line;
	}

	dd a {
		color: var(--brand-dark);
		text-decoration: none;
	}

	dd a:hover {
		text-decoration: underline;
	}

	.empty {
		color: var(--border-strong);
	}
</style>
