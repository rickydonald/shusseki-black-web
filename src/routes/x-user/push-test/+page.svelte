<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/custom/PageHeader.svelte';
	import { toast } from 'svelte-sonner';
	import { isPushSupported, isPushSubscribed, getPermissionStatus } from '$lib/push/client';

	let diagnostics = $state({
		pushSupported: false,
		permission: 'default' as NotificationPermission,
		isSubscribed: false,
		serviceWorkerRegistered: false,
		serviceWorkerActive: false,
		subscription: null as any,
		subscriptionInDB: false,
		vapidKey: '',
	});

	let testing = $state(false);
	let logs = $state<string[]>([]);

	function addLog(message: string) {
		const timestamp = new Date().toLocaleTimeString();
		logs = [...logs, `[${timestamp}] ${message}`];
		console.log(`[Push Test] ${message}`);
	}

	onMount(async () => {
		await runDiagnostics();
	});

	async function runDiagnostics() {
		addLog('Starting diagnostics...');

		// Check push support
		diagnostics.pushSupported = isPushSupported();
		addLog(`Push supported: ${diagnostics.pushSupported}`);

		if (!diagnostics.pushSupported) {
			addLog('❌ Push notifications not supported in this browser');
			return;
		}

		// Check permission
		diagnostics.permission = getPermissionStatus();
		addLog(`Permission status: ${diagnostics.permission}`);

		// Check service worker
		if ('serviceWorker' in navigator) {
			try {
				const registration = await navigator.serviceWorker.ready;
				diagnostics.serviceWorkerRegistered = true;
				diagnostics.serviceWorkerActive = !!registration.active;
				addLog(`✅ Service Worker registered and active`);

				// Check subscription
				const subscription = await registration.pushManager.getSubscription();
				diagnostics.isSubscribed = !!subscription;
				diagnostics.subscription = subscription;
				
				if (subscription) {
					addLog(`✅ Push subscription found`);
					addLog(`Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
				} else {
					addLog(`⚠️ No push subscription found`);
				}
			} catch (error: any) {
				addLog(`❌ Service Worker error: ${error.message}`);
			}
		}

		// Check VAPID key
		try {
			const response = await fetch('/api/v1/push/vapid-key');
			if (response.ok) {
				const data = await response.json();
				diagnostics.vapidKey = data.publicKey;
				addLog(`✅ VAPID key fetched: ${data.publicKey.substring(0, 20)}...`);
			} else {
				addLog(`❌ Failed to fetch VAPID key: ${response.status}`);
			}
		} catch (error: any) {
			addLog(`❌ Error fetching VAPID key: ${error.message}`);
		}

		// Check DB subscription
		try {
			const response = await fetch('/api/x-user/push/stats');
			if (response.ok) {
				const data = await response.json();
				diagnostics.subscriptionInDB = data.stats.totalSubscriptions > 0;
				addLog(`Database subscriptions: ${data.stats.totalSubscriptions} (${data.stats.uniqueUsers} users)`);
			}
		} catch (error: any) {
			addLog(`⚠️ Could not check database: ${error.message}`);
		}

		addLog('Diagnostics complete!');
	}

	async function sendTestNotification() {
		if (testing) return;
		
		testing = true;
		addLog('Sending test notification...');

		try {
			const response = await fetch('/api/v1/push/test', {
				method: 'POST',
			});

			const result = await response.json();

			if (response.ok) {
				addLog(`✅ ${result.message}`);
				toast.success(result.message);
			} else {
				addLog(`❌ ${result.error || result.message}`);
				toast.error(result.error || result.message);
			}
		} catch (error: any) {
			addLog(`❌ Error sending test: ${error.message}`);
			toast.error('Failed to send test notification');
		} finally {
			testing = false;
		}
	}

	function clearLogs() {
		logs = [];
	}
</script>

<svelte:head>
	<title>Push Notification Test - Shusseki</title>
</svelte:head>

<PageHeader title="Push Notification Test" backUrl="/view/settings" />

<div class="container mx-auto p-4 space-y-6 max-w-4xl pb-24">
	<!-- Diagnostics -->
	<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
		<h2 class="text-lg font-semibold mb-4">Diagnostics</h2>
		
		<div class="space-y-3 text-sm">
			<div class="flex items-center justify-between py-2 border-b">
				<span class="text-gray-600">Push Supported</span>
				<span class={diagnostics.pushSupported ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
					{diagnostics.pushSupported ? '✅ Yes' : '❌ No'}
				</span>
			</div>

			<div class="flex items-center justify-between py-2 border-b">
				<span class="text-gray-600">Permission Status</span>
				<span class:text-green-600={diagnostics.permission === 'granted'}
				      class:text-red-600={diagnostics.permission === 'denied'}
				      class:text-yellow-600={diagnostics.permission === 'default'}
				      class="font-medium capitalize">
					{diagnostics.permission === 'granted' ? '✅' : diagnostics.permission === 'denied' ? '❌' : '⚠️'} {diagnostics.permission}
				</span>
			</div>

			<div class="flex items-center justify-between py-2 border-b">
				<span class="text-gray-600">Service Worker</span>
				<span class={diagnostics.serviceWorkerActive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
					{diagnostics.serviceWorkerActive ? '✅ Active' : '❌ Not Active'}
				</span>
			</div>

			<div class="flex items-center justify-between py-2 border-b">
				<span class="text-gray-600">Push Subscription</span>
				<span class={diagnostics.isSubscribed ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
					{diagnostics.isSubscribed ? '✅ Subscribed' : '❌ Not Subscribed'}
				</span>
			</div>

			<div class="flex items-center justify-between py-2 border-b">
				<span class="text-gray-600">VAPID Key</span>
				<span class={diagnostics.vapidKey ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
					{diagnostics.vapidKey ? '✅ Found' : '❌ Missing'}
				</span>
			</div>

			<div class="flex items-center justify-between py-2">
				<span class="text-gray-600">Database</span>
				<span class={diagnostics.subscriptionInDB ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
					{diagnostics.subscriptionInDB ? '✅ Has subscriptions' : '⚠️ No subscriptions'}
				</span>
			</div>
		</div>

		<div class="mt-6 flex gap-3">
			<button
				onclick={runDiagnostics}
				class="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
			>
				Refresh Diagnostics
			</button>

			<button
				onclick={sendTestNotification}
				disabled={testing || !diagnostics.isSubscribed}
				class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{testing ? 'Sending...' : 'Send Test Notification'}
			</button>
		</div>
	</div>

	<!-- Logs -->
	<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold">Logs</h2>
			<button
				onclick={clearLogs}
				class="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
			>
				Clear
			</button>
		</div>

		<div class="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs space-y-1">
			{#if logs.length === 0}
				<p class="text-gray-400">No logs yet...</p>
			{:else}
				{#each logs as log}
					<div class="text-gray-700">{log}</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Subscription Details -->
	{#if diagnostics.subscription}
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<h2 class="text-lg font-semibold mb-4">Subscription Details</h2>
			<pre class="bg-gray-50 rounded-lg p-4 text-xs overflow-x-auto">{JSON.stringify(diagnostics.subscription.toJSON(), null, 2)}</pre>
		</div>
	{/if}
</div>
