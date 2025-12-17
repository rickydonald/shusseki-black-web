<script lang="ts">
	import { fade } from "svelte/transition";
	import { cubicOut } from "svelte/easing";
	import axios from "axios";
	import { toast } from "svelte-sonner";

	interface Props {
		open: boolean;
		onShiftSelected: (shift: number) => void;
	}

	let { open = $bindable(), onShiftSelected }: Props = $props();

	let selectedShift = $state<number | null>(null);
	let isSubmitting = $state(false);

	async function handleSubmit() {
		if (!selectedShift) {
			toast.error("Please select a shift");
			return;
		}

		isSubmitting = true;

		try {
			const response = await axios.post("/api/v1/user/shift/update", {
				shift: selectedShift,
			});

			if (response.data.status) {
				toast.success(`Shift ${selectedShift} selected successfully!`);
				onShiftSelected(selectedShift);
				open = false;
			} else {
				toast.error(response.data.error || "Failed to update shift");
			}
		} catch (error) {
			console.error("Error updating shift:", error);
			toast.error("Failed to update shift. Please try again.");
		} finally {
			isSubmitting = false;
		}
	}

	function selectShift(shift: number) {
		selectedShift = shift;
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
			transition:fade={{ duration: 300, delay: 100, easing: cubicOut }}
		>
			<!-- Header -->
			<div class="bg-linear-to-br from-blue-500 to-blue-600 px-6 py-8 text-center">
				<div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
					<svg
						class="w-8 h-8 text-white"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h2 class="text-[24px] font-bold text-white mb-2">
					Select Your Shift
				</h2>
				<p class="text-white/80 text-[14px]">
					Please choose your college shift to continue
				</p>
			</div>

			<!-- Content -->
			<div class="p-6">
				<div class="space-y-3 mb-6">
					<!-- Shift 1 -->
					<button
						onclick={() => selectShift(1)}
						disabled={isSubmitting}
						class="w-full p-5 rounded-2xl border-2 transition-all active:scale-[0.98] text-left"
						class:border-blue-500={selectedShift === 1}
						class:bg-blue-50={selectedShift === 1}
						class:border-gray-200={selectedShift !== 1}
						class:hover:border-gray-300={selectedShift !== 1}
					>
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-3">
									<div
										class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
										class:border-blue-500={selectedShift === 1}
										class:bg-blue-500={selectedShift === 1}
										class:border-gray-300={selectedShift !== 1}
									>
										{#if selectedShift === 1}
											<svg
												class="w-4 h-4 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M5 13l4 4L19 7"
												/>
											</svg>
										{/if}
									</div>
									<div>
										<div class="text-[17px] font-semibold text-gray-900">
											Shift 1
										</div>
										<div class="text-[13px] text-gray-500 mt-0.5">
											Morning Shift (8:15 AM - 1:15 PM)
										</div>
									</div>
								</div>
							</div>
						</div>
					</button>

					<!-- Shift 2 -->
					<button
						onclick={() => selectShift(2)}
						disabled={isSubmitting}
						class="w-full p-5 rounded-2xl border-2 transition-all active:scale-[0.98] text-left"
						class:border-blue-500={selectedShift === 2}
						class:bg-blue-50={selectedShift === 2}
						class:border-gray-200={selectedShift !== 2}
						class:hover:border-gray-300={selectedShift !== 2}
					>
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-3">
									<div
										class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
										class:border-blue-500={selectedShift === 2}
										class:bg-blue-500={selectedShift === 2}
										class:border-gray-300={selectedShift !== 2}
									>
										{#if selectedShift === 2}
											<svg
												class="w-4 h-4 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M5 13l4 4L19 7"
												/>
											</svg>
										{/if}
									</div>
									<div>
										<div class="text-[17px] font-semibold text-gray-900">
											Shift 2
										</div>
										<div class="text-[13px] text-gray-500 mt-0.5">
											Afternoon Shift (1:30 PM - 6:30 PM)
										</div>
									</div>
								</div>
							</div>
						</div>
					</button>
				</div>

				<!-- Submit Button -->
				<button
					onclick={handleSubmit}
					disabled={!selectedShift || isSubmitting}
					class="w-full py-4 bg-blue-500 text-white font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						<span class="flex items-center justify-center gap-2">
							<svg
								class="animate-spin h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Saving...
						</span>
					{:else}
						Continue
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	button:disabled {
		pointer-events: none;
	}
</style>
