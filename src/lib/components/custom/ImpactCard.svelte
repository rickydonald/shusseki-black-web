<script lang="ts">
	import type { GeniusRecommendation } from "$lib/models/impact-fragment";
	import { FlashIcon, ChevronDownIcon, MagicWand01Icon } from "@untitled-theme/icons-svelte";
	import { fade, slide } from "svelte/transition";
	import { cubicOut, quintOut } from "svelte/easing";
	import BackgroundImage from "$lib/assets/insights-background.webp";

	let { impact }: { impact: GeniusRecommendation } = $props();

	const isAboveThreshold = $derived(impact.percentage >= 80);
	let isExpanded = $state(false);

	function toggleExpanded() {
		isExpanded = !isExpanded;
	}
</script>

<section class="w-full mt-1">
	<div
		class="relative overflow-hidden rounded-2xl shadow-xl bg-center bg-cover bg-no-repeat backdrop-blur-sm bg-violet-200"
		in:fade={{ duration: 400, delay: 100, easing: cubicOut }}
	>
		<!-- Content -->
		<div class="relative p-4">
			<!-- Header - Always Visible -->
			<button
				onclick={toggleExpanded}
				class="w-full text-left cursor-pointer group"
			>
				<div class="flex items-center justify-between mb-1">
					<div class="flex items-center gap-2">
						<MagicWand01Icon
							class="w-4.5 h-4.5 text-black"
							stroke-width="1.8"
						/>
						<div class="text-left">
							<h3 class="text-[14px] text-black/75 font-medium">
								Attendance Insights
							</h3>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<div
							class="rounded-full flex items-center justify-center transition-all duration-500 ease-out bg-white/40 backdrop-blur-sm p-1.5 hover:bg-black/50"
							class:rotate-180={isExpanded}
						>
							<ChevronDownIcon
								class="w-4.5 h-4.5 text-black transition-transform duration-300"
							/>
						</div>
					</div>
				</div>

				<!-- Main Recommendation - Always Visible -->
				<div class="mb-0 ml-6">
					<p
						class="text-black leading-[1.6] text-[16px] font-semibold"
					>
						{impact.recommendation}
					</p>
					<div class="h-6 overflow-hidden">
						{#if !isExpanded}
							<p
								class="text-black/60 text-xs mt-2"
								in:fade={{
									duration: 300,
									delay: 200,
									easing: cubicOut,
								}}
								out:fade={{ duration: 150, easing: cubicOut }}
							>
								Tap to expand and view more details
							</p>
						{/if}
					</div>
				</div>
			</button>

			<!-- Expandable Content -->
			{#if isExpanded}
				<div
					class="mt-0 overflow-hidden"
					in:slide={{ duration: 400, easing: quintOut }}
					out:slide={{ duration: 300, easing: cubicOut }}
				>
					<!-- Context Badge -->
					{#if impact.contextMessage}
						<div
							class="inline-flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm rounded-2xl mb-5 border border-white/60 shadow-sm"
						>
							<p class="text-sm text-gray-900 font-semibold">
								{impact.contextMessage}
							</p>
						</div>
					{/if}

					<!-- Stats Grid -->
					<div class="grid grid-cols-2 gap-4">
						{#if isAboveThreshold}
							<!-- Can Skip Card -->
							<div
								class="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-[20px] p-5 border border-white/80 transition-all duration-300 hover:shadow-lg"
							>
								<div
									class="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10"
								></div>
								<div class="relative">
									<div class="flex items-center gap-2 mb-3">
										<p
											class="text-xs text-green-900 uppercase font-bold tracking-wider"
										>
											Can Skip
										</p>
									</div>
									<p
										class="text-[32px] font-bold text-green-900 leading-none mb-1 tabular-nums"
									>
										{impact.canSkip}
									</p>
									<p
										class="text-sm text-green-800 font-medium"
									>
										hour{impact.canSkip !== 1 ? "s" : ""} you
										can miss
									</p>
									<p class="text-xs text-green-700 mt-1">
										Stay above 80%
									</p>
								</div>
							</div>
							<!-- If Skip Card -->
							<div
								class="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-[20px] p-5 border border-white/80 transition-all duration-300 hover:shadow-lg"
							>
								<div
									class="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10"
								></div>
								<div class="relative">
									<div class="flex items-center gap-2 mb-3">
										<p
											class="text-xs text-amber-900 uppercase font-bold tracking-wider"
										>
											If Skip
										</p>
									</div>
									<p
										class="text-[32px] font-bold text-amber-900 leading-none mb-1 tabular-nums"
									>
										{impact.predictedIfSkip.toFixed(1)}<span
											class="text-xl">%</span
										>
									</p>
									<p
										class="text-sm text-amber-800 font-medium"
									>
										if you skip once
									</p>
									<p class="text-xs text-amber-700 mt-1">
										Your new percentage
									</p>
								</div>
							</div>
						{:else}
							<!-- Must Attend Card -->
							<div
								class="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-[20px] p-5 border border-white/80 shadow-sm transition-all duration-300 hover:shadow-lg"
							>
								<div
									class="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-10 -mt-10"
								></div>
								<div class="relative">
									<div class="flex items-center gap-2 mb-3">
										<p
											class="text-xs text-red-900 uppercase font-bold tracking-wider"
										>
											Must Attend
										</p>
									</div>
									<p
										class="text-[32px] font-bold text-red-900 leading-none mb-1 tabular-nums"
									>
										{impact.mustAttend + 1}
									</p>
									<p class="text-sm text-red-800 font-medium">
										more hour{impact.mustAttend + 1 !== 1
											? "s"
											: ""} to attend
									</p>
									<p class="text-xs text-red-700 mt-1">
										To reach 80% minimum
									</p>
								</div>
							</div>
							<!-- After 1 Day Card -->
							<div
								class="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-[20px] p-5 border border-white/80 shadow-sm transition-all duration-300 hover:shadow-lg"
							>
								<div
									class="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10"
								></div>
								<div class="relative">
									<div class="flex items-center gap-2 mb-3">
										<p
											class="text-xs text-green-900 uppercase font-bold tracking-wider"
										>
											After 1 Day
										</p>
									</div>
									<p
										class="text-[32px] font-bold text-green-900 leading-none mb-1 tabular-nums"
									>
										{impact.predictedAfterOneDay.toFixed(
											1,
										)}<span class="text-xl">%</span>
									</p>
									<p
										class="text-sm text-green-800 font-medium"
									>
										after attending 5 hours
									</p>
									<p class="text-xs text-green-700 mt-1">
										Full day attendance boost
									</p>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>
