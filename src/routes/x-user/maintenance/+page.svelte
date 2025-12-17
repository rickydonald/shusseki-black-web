<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import Power01Icon from "@untitled-theme/icons-svelte/Power01Icon.svelte";
	import EyeIcon from "@untitled-theme/icons-svelte/EyeIcon.svelte";
	import CheckIcon from "@untitled-theme/icons-svelte/CheckIcon.svelte";
    import ShussekiLogo from "$lib/components/icons/ShussekiLogo.svelte";

	let maintenanceEnabled = $state(false);
	let title = $state("We'll be back soon!");
	let message = $state("We're currently under maintenance.");
	let isSubmitting = $state(false);
	let isLoading = $state(true);

	onMount(async () => {
		await loadSettings();
	});

	async function loadSettings() {
		try {
			const response = await fetch("/api/x-user/maintenance/get");
			if (!response.ok) {
				throw new Error("Failed to fetch settings");
			}
			const data = await response.json();
			console.log('Loaded maintenance settings:', data);
			maintenanceEnabled = data.maintenanceMode;
			title = data.title;
			message = data.message;
		} catch (error) {
			console.error("Error loading settings:", error);
			toast.error("Failed to load maintenance settings");
		} finally {
			isLoading = false;
		}
	}

	async function handleSubmit() {
		isSubmitting = true;

		try {
			console.log('Submitting maintenance settings:', { enabled: maintenanceEnabled, title, message });

			const response = await fetch("/api/x-user/maintenance/update", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					enabled: maintenanceEnabled,
					title,
					message,
				}),
			});

			const data = await response.json();
			console.log('Update response:', data);

			if (!response.ok) {
				throw new Error(data.error || "Failed to update settings");
			}

			toast.success(data.message || "Settings updated successfully");
			// Reload settings to confirm update
			await loadSettings();
			console.log('Reloaded settings - maintenance enabled:', maintenanceEnabled);
		} catch (error) {
			console.error("Error updating settings:", error);
			toast.error(error instanceof Error ? error.message : "Failed to update settings");
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Maintenance Control - Admin</title>
</svelte:head>

<div class="p-6">
	{#if isLoading}
		<div class="flex items-center justify-center py-24">
			<div class="text-center">
				<div class="inline-block w-10 h-10 border-3 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
				<p class="text-gray-600 mt-3 text-sm">Loading...</p>
			</div>
		</div>
	{:else}
		<div class="max-w-4xl">
			<div class="space-y-6">
				<!-- Status Toggle Card -->
				<div class="bg-white rounded-xl border border-gray-200 p-6">
					<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div class="w-12 h-12 rounded-full flex items-center justify-center {maintenanceEnabled ? 'bg-red-100' : 'bg-green-100'}">
							<Power01Icon class="w-6 h-6 {maintenanceEnabled ? 'text-red-600' : 'text-green-600'}" />
						</div>
						<div>
								<h2 class="text-lg font-semibold text-gray-900">Maintenance Mode</h2>
								<p class="text-sm text-gray-600 mt-0.5">
									{maintenanceEnabled ? 'Site is currently in maintenance' : 'Site is operational'}
								</p>
							</div>
						</div>
						<button
							type="button"
							onclick={() => (maintenanceEnabled = !maintenanceEnabled)}
							aria-label="Toggle maintenance mode"
							class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
							class:bg-red-600={maintenanceEnabled}
							class:bg-gray-300={!maintenanceEnabled}
						>
							<span
								class="inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform"
								class:translate-x-7={maintenanceEnabled}
								class:translate-x-1={!maintenanceEnabled}
							></span>
						</button>
					</div>
				</div>

				<!-- Content Editor -->
				<div class="bg-white rounded-xl border border-gray-200 p-6">
					<h3 class="text-base font-semibold text-gray-900 mb-4">Page Content</h3>
					<div class="space-y-4">
						<div>
							<label for="title" class="block text-sm font-medium text-gray-700 mb-2">
								Title
							</label>
							<input
								type="text"
								id="title"
								bind:value={title}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
								placeholder="We'll be back soon!"
							/>
						</div>

						<div>
							<label for="message" class="block text-sm font-medium text-gray-700 mb-2">
								Message
							</label>
							<textarea
								id="message"
								bind:value={message}
								rows="4"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm resize-none"
								placeholder="We're performing scheduled maintenance..."
							></textarea>
						</div>
					</div>
				</div>

				<!-- Preview -->
				<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
					<div class="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
						<EyeIcon class="w-4 h-4 text-gray-600" />
						<h3 class="text-sm font-medium text-gray-900">Preview</h3>
					</div>
					<div class="p-8 bg-gray-50">
						<div class="max-w-md mx-auto text-center bg-white rounded-lg p-8 shadow-sm">
							<div class="mb-0">
								<div class="inline-block p-3 rounded-xl">
									<ShussekiLogo color="000" width={60} height={60} />
								</div>
							</div>
							<h2 class="text-xl font-bold text-gray-900 mb-2">{title}</h2>
							<p class="text-sm text-gray-600 whitespace-pre-wrap">{message}</p>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center justify-end gap-3">
					<button
						type="button"
						onclick={loadSettings}
						class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
					>
						Reset
					</button>
					<button
						type="button"
						onclick={handleSubmit}
						disabled={isSubmitting}
						class="inline-flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isSubmitting}
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							Saving...
						{:else}
							<CheckIcon class="w-4 h-4" />
							Save Changes
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
