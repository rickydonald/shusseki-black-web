<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Bell02Icon from '@untitled-theme/icons-svelte/Bell02Icon.svelte';
	import Send01Icon from '@untitled-theme/icons-svelte/Send01Icon.svelte';
	import Users01Icon from '@untitled-theme/icons-svelte/Users01Icon.svelte';
	import Loading02Icon from '@untitled-theme/icons-svelte/Loading02Icon.svelte';

	let { data } = $props();

	// Stats
	let stats = $state<{
		totalSubscriptions: number;
		uniqueUsers: number;
	} | null>(null);
	let loadingStats = $state(true);

	// Form state
	let targetType = $state<'single' | 'multiple' | 'broadcast'>('broadcast');
	let userIds = $state('');
	let title = $state('');
	let body = $state('');
	let icon = $state('/icons/icon-192x192.png');
	let image = $state('');
	let badge = $state('/icons/icon-72x72.png');
	let url = $state('/view/attendance');
	let requireInteraction = $state(false);
	let silent = $state(false);
	let sending = $state(false);

	onMount(async () => {
		await loadStats();
	});

	async function loadStats() {
		loadingStats = true;
		try {
			const response = await fetch('/api/x-user/push/stats');
			if (response.ok) {
				const data = await response.json();
				stats = data.stats;
			}
		} catch (error) {
			console.error('Failed to load stats:', error);
		} finally {
			loadingStats = false;
		}
	}

	async function handleSendNotification(event: SubmitEvent) {
		event.preventDefault();
		
		if (!title || !body) {
			toast.error('Title and body are required');
			return;
		}

		sending = true;

		try {
			const payload: any = {
				targetType,
				notification: {
					title,
					body,
					icon,
					badge,
					data: { url },
					requireInteraction,
					silent,
				},
			};

			if (image) {
				payload.notification.image = image;
			}

			if (targetType !== 'broadcast') {
				const ids = userIds.split(',').map(id => id.trim()).filter(Boolean);
				if (ids.length === 0) {
					toast.error('Please enter at least one user ID');
					return;
				}
				payload.userIds = ids;
			}

			const response = await fetch('/api/x-user/push/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			const result = await response.json();

			if (response.ok) {
				toast.success(result.message || 'Notification sent successfully');
				// Clear form
				title = '';
				body = '';
				image = '';
				userIds = '';
				// Reload stats
				await loadStats();
			} else {
				toast.error(result.error || 'Failed to send notification');
			}
		} catch (error: any) {
			console.error('Error sending notification:', error);
			toast.error('Failed to send notification');
		} finally {
			sending = false;
		}
	}
</script>

<div class="p-6 space-y-6">
	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600">Total Subscriptions</p>
						<p class="text-2xl font-bold text-gray-900 mt-1">
							{#if loadingStats}
								<span class="animate-pulse">...</span>
							{:else}
								{stats?.totalSubscriptions || 0}
							{/if}
						</p>
					</div>
					<Bell02Icon class="w-8 h-8 text-black" />
				</div>
			</div>

			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600">Unique Users</p>
						<p class="text-2xl font-bold text-gray-900 mt-1">
							{#if loadingStats}
								<span class="animate-pulse">...</span>
							{:else}
								{stats?.uniqueUsers || 0}
							{/if}
						</p>
					</div>
					<Users01Icon class="w-8 h-8 text-black" />
				</div>
			</div>
		</div>

		<!-- Send Notification Form -->
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
				<Send01Icon class="w-5 h-5" />
				Send Notification
			</h2>

			<form onsubmit={handleSendNotification} class="space-y-4">
				<!-- Target Type -->
				<div>
					<span class="block text-sm font-medium text-gray-700 mb-2">
						Target
					</span>
					<div class="flex gap-2">
						<button
							type="button"
							onclick={() => targetType = 'broadcast'}
							class="flex-1 px-4 py-2 rounded-lg border transition-colors"
							class:border-black={targetType === 'broadcast'}
							class:bg-black={targetType === 'broadcast'}
							class:text-white={targetType === 'broadcast'}
							class:border-gray-300={targetType !== 'broadcast'}
							class:text-gray-700={targetType !== 'broadcast'}
						>
							Broadcast to All
						</button>
						<button
							type="button"
							onclick={() => targetType = 'single'}
							class="flex-1 px-4 py-2 rounded-lg border transition-colors"
							class:border-black={targetType === 'single'}
							class:bg-black={targetType === 'single'}
							class:text-white={targetType === 'single'}
							class:border-gray-300={targetType !== 'single'}
							class:text-gray-700={targetType !== 'single'}
						>
							Single User
						</button>
						<button
							type="button"
							onclick={() => targetType = 'multiple'}
							class="flex-1 px-4 py-2 rounded-lg border transition-colors"
							class:border-black={targetType === 'multiple'}
							class:bg-black={targetType === 'multiple'}
							class:text-white={targetType === 'multiple'}
							class:border-gray-300={targetType !== 'multiple'}
							class:text-gray-700={targetType !== 'multiple'}
						>
							Multiple Users
						</button>
					</div>
				</div>

				{#if targetType !== 'broadcast'}
					<div>
						<label for="userIds" class="block text-sm font-medium text-gray-700 mb-2">
							User IDs (comma-separated)
						</label>
						<input
							id="userIds"
							type="text"
							bind:value={userIds}
							placeholder="user1, user2, user3"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
						/>
					</div>
				{/if}

				<!-- Title -->
				<div>
					<label for="title" class="block text-sm font-medium text-gray-700 mb-2">
						Title *
					</label>
					<input
						id="title"
						type="text"
						bind:value={title}
						placeholder="Notification title"
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
					/>
				</div>

				<!-- Body -->
				<div>
					<label for="body" class="block text-sm font-medium text-gray-700 mb-2">
						Message *
					</label>
					<textarea
						id="body"
						bind:value={body}
						placeholder="Notification message"
						required
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
					></textarea>
				</div>

				<!-- Optional Fields -->
				<details class="border border-gray-200 rounded-lg">
					<summary class="px-4 py-2 cursor-pointer font-medium text-gray-700 hover:bg-gray-50">
						Advanced Options
					</summary>
					<div class="px-4 py-3 space-y-4 border-t border-gray-200">
						<div>
							<label for="image" class="block text-sm font-medium text-gray-700 mb-2">
								Image URL
							</label>
							<input
								id="image"
								type="url"
								bind:value={image}
								placeholder="https://example.com/image.jpg"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
							/>
						</div>

						<div>
							<label for="url" class="block text-sm font-medium text-gray-700 mb-2">
								Click URL
							</label>
							<input
								id="url"
								type="text"
								bind:value={url}
								placeholder="/view/attendance"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
							/>
						</div>

						<div class="flex gap-4">
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={requireInteraction}
									class="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
								/>
								<span class="text-sm text-gray-700">Require Interaction</span>
							</label>

							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={silent}
									class="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
								/>
								<span class="text-sm text-gray-700">Silent</span>
							</label>
						</div>
					</div>
				</details>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={sending}
					class="w-full px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if sending}
						<Loading02Icon class="w-5 h-5 animate-spin" />
						Sending...
					{:else}
						<Send01Icon class="w-5 h-5" />
					Send Notification
				{/if}
			</button>
		</form>
	</div>
</div>