<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		isPushSupported, 
		getPermissionStatus, 
		enablePushNotifications,
		unsubscribeFromPush,
		isPushSubscribed,
	} from '$lib/push/client';
	import Bell02Icon from '@untitled-theme/icons-svelte/Bell02Icon.svelte';
	import BellOff02Icon from '@untitled-theme/icons-svelte/BellOff02Icon.svelte';
	import InfoCircleIcon from '@untitled-theme/icons-svelte/InfoCircleIcon.svelte';

	let isSupported = $state(false);
	let permission = $state<NotificationPermission>('default');
	let isSubscribed = $state(false);
	let isLoading = $state(false);
	let errorMessage = $state('');

	onMount(async () => {
		isSupported = isPushSupported();
		if (isSupported) {
			permission = getPermissionStatus();
			isSubscribed = await isPushSubscribed();
		}
	});

	async function handleToggleNotifications() {
		if (isLoading) return;

		isLoading = true;
		errorMessage = '';

		try {
			if (isSubscribed) {
				// Unsubscribe
				const success = await unsubscribeFromPush();
				if (success) {
					isSubscribed = false;
					permission = getPermissionStatus();
				} else {
					errorMessage = 'Failed to unsubscribe from notifications';
				}
			} else {
				// Subscribe
				const result = await enablePushNotifications();
				if (result.success) {
					isSubscribed = true;
					permission = result.permission || 'granted';
				} else {
					errorMessage = result.error || 'Failed to enable notifications';
					permission = result.permission || permission;
				}
			}
		} catch (error: any) {
			console.error('[Push Settings] Error:', error);
			errorMessage = error.message || 'An error occurred';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="push-notification-settings bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
				{#if isSubscribed}
					<Bell02Icon class="w-5 h-5 text-black" />
				{:else}
					<BellOff02Icon class="w-5 h-5 text-gray-400" />
				{/if}
				Push Notifications
			</h3>
			<p class="text-sm text-gray-600 mt-1">
				{#if !isSupported}
					Your browser doesn't support push notifications
				{:else if permission === 'denied'}
					Notifications are blocked. Please enable them in your browser settings.
				{:else if isSubscribed}
					You'll receive notifications about attendance updates and important announcements
				{:else}
					Enable notifications to stay updated on attendance and announcements
				{/if}
			</p>

			{#if errorMessage}
			<div class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start gap-2">
				<InfoCircleIcon class="w-4 h-4 mt-0.5 shrink-0" />
				<span>{errorMessage}</span>
				</div>
			{/if}
		</div>

		<div class="ml-4">
			{#if isSupported && permission !== "denied"}
				<button
					onclick={handleToggleNotifications}
					disabled={isLoading}
					class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50"
					class:bg-black={isSubscribed}
					class:bg-gray-200={!isSubscribed}
					aria-label="Toggle push notifications"
				>
					<span
						class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
						class:translate-x-6={isSubscribed}
						class:translate-x-1={!isSubscribed}
					></span>
				</button>
			{/if}
		</div>
	</div>

	{#if permission === 'denied'}
		<div class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
			<p class="text-sm text-yellow-800">
				<strong>To enable notifications:</strong>
			</p>
			<ol class="text-sm text-yellow-700 mt-2 ml-4 list-decimal space-y-1">
				<li>Click the lock or info icon in your browser's address bar</li>
				<li>Find "Notifications" in the permissions list</li>
				<li>Change it from "Block" to "Allow"</li>
				<li>Refresh this page</li>
			</ol>
		</div>
	{/if}
</div>

<style>
	.push-notification-settings {
		max-width: 600px;
	}
</style>
