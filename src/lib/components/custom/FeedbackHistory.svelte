<script lang="ts">
	import { fade, fly, scale } from "svelte/transition";
	import { cubicOut } from "svelte/easing";
	import { XIcon, CheckCircleIcon, ClockIcon } from "@untitled-theme/icons-svelte";
	import { toast } from "svelte-sonner";
	import axios from "axios";
	import { Constants } from "$lib/constants";
	import { onMount } from "svelte";

	let {
		open = $bindable(false),
	}: {
		open: boolean;
	} = $props();

	let feedbackList = $state<any[]>([]);
	let isLoading = $state(false);

	const feedbackTypeLabels: Record<string, { label: string; emoji: string; color: string }> = {
		bug: { label: "Bug Report", emoji: "🐛", color: "text-red-600 bg-red-50" },
		feature: { label: "Feature Request", emoji: "✨", color: "text-purple-600 bg-purple-50" },
		problem: { label: "Problem", emoji: "⚠️", color: "text-orange-600 bg-orange-50" },
		suggestion: { label: "Suggestion", emoji: "💡", color: "text-blue-600 bg-blue-50" },
		others: { label: "Others", emoji: "💬", color: "text-gray-600 bg-gray-50" },
	};

	async function loadFeedback() {
		if (!open) return;
		
		isLoading = true;
		try {
			const response = await axios.get(Constants._API_URI.LIST_FEEDBACK);
			feedbackList = response.data.data || [];
		} catch (error) {
			console.error("Failed to load feedback:", error);
			toast.error("Failed to load your feedback history");
		} finally {
			isLoading = false;
		}
	}

	function handleClose() {
		open = false;
	}

	function formatDate(dateString: string | Date) {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}

	$effect(() => {
		if (open) {
			loadFeedback();
		}
	});
</script>

{#if open}
	<!-- Backdrop -->
	<button
		class="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm"
		transition:fade={{ duration: 250, easing: cubicOut }}
		onclick={handleClose}
		aria-label="Close feedback history"
	></button>

	<!-- Modal -->
	<div
		class="fixed inset-x-0 bottom-0 z-70 flex items-end justify-center sm:inset-0 sm:items-center sm:p-4"
		transition:fly={{ y: 100, duration: 400, easing: cubicOut }}
	>
		<div
			class="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
			style="max-height: 85vh;"
			transition:scale={{ start: 0.95, duration: 300, easing: cubicOut }}
		>
			<!-- Header -->
			<div class="relative overflow-hidden bg-linear-to-br from-indigo-500 to-blue-600 px-6 py-8 text-white">
				<!-- Decorative circles -->
				<div class="pointer-events-none absolute inset-0 overflow-hidden">
					<div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
					<div class="absolute -left-10 top-20 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
				</div>

				<div class="relative">
					<button
						onclick={handleClose}
						class="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
					>
						<XIcon class="h-5 w-5" />
					</button>

					<h2 class="mb-2 text-2xl font-bold">Your Feedback History</h2>
					<p class="text-sm text-white/90">Track all your submitted feedback</p>
				</div>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto px-6 py-6">
				{#if isLoading}
					<div class="flex items-center justify-center py-12">
						<div class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
					</div>
				{:else if feedbackList.length === 0}
					<div class="flex flex-col items-center justify-center py-12 text-center">
						<div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
							<span class="text-4xl">📭</span>
						</div>
						<h3 class="mb-2 text-lg font-semibold text-gray-900">No feedback yet</h3>
						<p class="text-sm text-gray-600">Your feedback submissions will appear here</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each feedbackList as item, index}
							{@const typeInfo = feedbackTypeLabels[item.feedbackType] || feedbackTypeLabels.others}
							<div
								class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
								transition:scale={{ delay: index * 50, duration: 300, easing: cubicOut }}
							>
								<!-- Header -->
								<div class="mb-3 flex items-start justify-between gap-3">
									<div class="flex items-center gap-2">
										<span
											class="flex h-8 w-8 items-center justify-center rounded-xl text-lg {typeInfo.color}"
										>
											{typeInfo.emoji}
										</span>
										<div>
											<h3 class="font-semibold text-gray-900">{item.subject}</h3>
											<p class="text-xs text-gray-500">{typeInfo.label}</p>
										</div>
									</div>
									<div class="flex items-center gap-1.5 text-xs text-gray-500">
										{#if item.isReplied}
											<CheckCircleIcon class="h-4 w-4 text-green-600" />
											<span class="text-green-600">Replied</span>
										{:else}
											<ClockIcon class="h-4 w-4 text-amber-600" />
											<span class="text-amber-600">Pending</span>
										{/if}
									</div>
								</div>

								<!-- Feedback -->
								<p class="mb-3 text-sm text-gray-700">{item.feedback}</p>

								{#if item.errorCode}
									<div class="mb-3 rounded-lg bg-red-50 px-3 py-2">
										<p class="text-xs font-mono text-red-700">Error: {item.errorCode}</p>
									</div>
								{/if}

								<!-- Reply -->
								{#if item.isReplied && item.reply}
									<div class="rounded-xl bg-blue-50 p-4 border border-blue-100">
										<p class="mb-1 text-xs font-semibold text-blue-900">Team Response</p>
										<p class="text-sm text-blue-800">{item.reply}</p>
									</div>
								{/if}

								<!-- Footer -->
								<div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
									<p class="text-xs text-gray-500">
										Submitted on {formatDate(item.createdAt)}
									</p>
									<p class="text-xs text-gray-400">#{item.feedbackId.slice(0, 8)}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="border-t border-gray-100 bg-white px-6 py-4">
				<button
					onclick={handleClose}
					type="button"
					class="w-full rounded-2xl bg-gray-100 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-200"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
