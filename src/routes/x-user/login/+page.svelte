<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import Loading02Icon from '@untitled-theme/icons-svelte/Loading02Icon.svelte';
    import ShussekiLogo from '$lib/components/icons/ShussekiLogo.svelte';

	let username = $state('');
	let password = $state('');
	let isLoading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		
		if (!username || !password) {
			toast.error('Please enter username and password');
			return;
		}

		isLoading = true;

		try {
			const response = await fetch('/api/x-user/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password }),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success('Login successful');
				goto('/x-user/dashboard');
			} else {
				toast.error(result.error || 'Invalid credentials');
			}
		} catch (error) {
			toast.error('Login failed');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>X-User Login - Shusseki</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black p-4">
	<div class="w-full max-w-md">
		<!-- Animated background elements -->
		<div class="absolute inset-0 overflow-hidden pointer-events-none">
			<div class="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
			<div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style="animation-delay: 2s;"></div>
		</div>

		<div class="bg-white rounded-2xl shadow-2xl p-8 relative">
			<div class="text-center mb-8">
				<div class="bg-black rounded-2xl p-4 inline-block mb-4">
					<ShussekiLogo 
						width={48} 
						height={48} 
						color="fff" 
						className="mx-auto"
					/>
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-2">X-User Panel</h1>
				<p class="text-gray-600">Shusseki Management Panel</p>
			</div>

			<form onsubmit={handleLogin} class="space-y-6">
				<div>
					<label for="username" class="block text-sm font-medium text-gray-700 mb-2">
						Username
					</label>
					<input
						id="username"
						type="text"
						bind:value={username}
						disabled={isLoading}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50 disabled:cursor-not-allowed"
						placeholder="Enter username"
						autocomplete="off"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
						Password
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						disabled={isLoading}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50 disabled:cursor-not-allowed"
						placeholder="Enter password"
						autocomplete="off"
					/>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if isLoading}
						<Loading02Icon class="w-5 h-5 animate-spin" />
						Logging in...
					{:else}
						Login
					{/if}
				</button>
			</form>

			<div class="mt-6 pt-6 border-t border-gray-200">
				<div class="flex items-center justify-center gap-2 text-xs text-gray-500">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
					<p>Restricted area. Panel for MOD and Administrators only!</p>
				</div>
			</div>
		</div>
	</div>
</div>
