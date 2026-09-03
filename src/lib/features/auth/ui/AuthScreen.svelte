<script lang="ts">
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import type { SessionStore } from '$lib/features/auth/model/session-store.svelte';
	import * as m from '$lib/paraglide/messages';

	let { session }: { session: SessionStore } = $props();

	type Mode = 'login' | 'register';

	let mode = $state<Mode>('login');
	let email = $state('');
	let password = $state('');
	let fullName = $state('');

	const submitLabel = $derived(mode === 'login' ? m.auth_sign_in() : m.auth_create_account());

	function switchTo(next: Mode): void {
		mode = next;
		session.error = '';
	}

	async function submit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (session.pending) return;

		const credentials = { email: email.trim(), password };

		// The shell swaps itself out on success, so there is nothing to reset here.
		if (mode === 'login') await session.login(credentials);
		else await session.register({ ...credentials, fullName: fullName.trim() });
	}
</script>

<div class="auth-screen">
	<div class="auth-card">
		<div class="auth-brand">
			<span class="brand-mark">TR</span>
			<div>
				<strong>{m.app_name()}</strong>
				<small>{m.app_tagline()}</small>
			</div>
		</div>

		<div class="auth-tabs" role="group" aria-label={m.auth_title()}>
			<button
				type="button"
				class:selected={mode === 'login'}
				aria-pressed={mode === 'login'}
				onclick={() => switchTo('login')}>{m.auth_sign_in()}</button
			>
			<button
				type="button"
				class:selected={mode === 'register'}
				aria-pressed={mode === 'register'}
				onclick={() => switchTo('register')}>{m.auth_create_account()}</button
			>
		</div>

		<p class="auth-intro">
			{mode === 'login' ? m.auth_sign_in_hint() : m.auth_register_hint()}
		</p>

		<form onsubmit={submit}>
			{#if mode === 'register'}
				<label>
					<span>{m.field_full_name()}</span>
					<input
						bind:value={fullName}
						maxlength="120"
						autocomplete="name"
						placeholder={m.placeholder_full_name()}
						disabled={session.pending}
					/>
				</label>
			{/if}

			<label>
				<span>{m.field_email()}</span>
				<input
					required
					type="email"
					bind:value={email}
					maxlength="120"
					autocomplete="email"
					placeholder="name@example.com"
					disabled={session.pending}
				/>
			</label>

			<label>
				<span>{m.field_password()}</span>
				<input
					required
					type="password"
					bind:value={password}
					minlength="8"
					maxlength="72"
					autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
					placeholder={m.placeholder_password()}
					disabled={session.pending}
				/>
				{#if mode === 'register'}
					<small class="field-hint">{m.auth_password_rule()}</small>
				{/if}
			</label>

			{#if session.error}
				<p class="auth-error" role="alert">{session.error}</p>
			{/if}

			<button class="button primary auth-submit" type="submit" disabled={session.pending}>
				{#if session.pending}
					<span class="button-spinner" aria-hidden="true"></span>
					{m.auth_submitting()}
				{:else}
					{submitLabel}
				{/if}
			</button>
		</form>

		<div class="auth-footer">
			<p>{m.interface_language()}</p>
			<LanguageSwitcher />
		</div>
	</div>
</div>

<style>
	.auth-screen {
		display: grid;
		min-height: 100vh;
		min-height: 100dvh;
		place-items: center;
		padding: calc(1.5rem + env(safe-area-inset-top)) 1rem calc(1.5rem + env(safe-area-inset-bottom));
	}

	.auth-card {
		width: min(100%, 25rem);
		padding: 1.6rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: white;
		box-shadow: var(--shadow);
	}

	.auth-brand {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin-bottom: 1.5rem;
	}

	.brand-mark {
		display: grid;
		width: 2.65rem;
		height: 2.65rem;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 0.85rem;
		background: #10233f;
		color: white;
		font-size: 0.86rem;
		font-weight: 800;
		letter-spacing: 0.06em;
	}

	.auth-brand strong {
		display: block;
		font-size: 0.95rem;
	}

	.auth-brand small {
		color: var(--text-muted);
		font-size: 0.74rem;
	}

	.auth-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.25rem;
		padding: 0.25rem;
		border-radius: 0.8rem;
		background: var(--surface-muted);
	}

	.auth-tabs button {
		min-height: 2.4rem;
		padding: 0.4rem 0.6rem;
		border: 0;
		border-radius: 0.6rem;
		background: none;
		color: var(--text-muted);
		font-size: 0.8rem;
		font-weight: 750;
		cursor: pointer;
	}

	.auth-tabs button.selected {
		background: white;
		color: var(--text);
		box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
	}

	.auth-intro {
		margin: 1rem 0 1.25rem;
		color: var(--text-muted);
		font-size: 0.8rem;
		line-height: 1.55;
	}

	form {
		display: grid;
		gap: 0.9rem;
	}

	label {
		display: grid;
		gap: 0.35rem;
	}

	label > span {
		color: var(--text-muted);
		font-size: 0.74rem;
		font-weight: 700;
	}

	.field-hint {
		color: var(--text-muted);
		font-size: 0.7rem;
	}

	input {
		width: 100%;
		min-height: 2.65rem;
		padding: 0.6rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		background: white;
		font-size: 0.88rem;
	}

	input:focus-visible {
		border-color: var(--brand);
		outline: 2px solid var(--brand-soft);
	}

	input:disabled {
		background: var(--surface-muted);
	}

	.auth-error {
		margin: 0;
		padding: 0.65rem 0.8rem;
		border: 1px solid #fecdd3;
		border-radius: 0.7rem;
		background: #fff1f2;
		color: var(--danger);
		font-size: 0.78rem;
		line-height: 1.45;
	}

	.auth-submit {
		width: 100%;
		margin-top: 0.25rem;
	}

	.auth-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.65rem;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
	}

	.auth-footer p {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.72rem;
		font-weight: 700;
	}

	/* Anything under 16px makes iOS Safari zoom the viewport on focus. */
	@media (pointer: coarse) {
		input {
			font-size: 16px;
		}
	}
</style>
