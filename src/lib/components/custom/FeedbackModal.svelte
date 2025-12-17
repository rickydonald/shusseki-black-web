<script lang="ts">
	import { fade, fly, scale } from "svelte/transition";
	import { cubicOut } from "svelte/easing";
	import { XIcon, ClockIcon } from "@untitled-theme/icons-svelte";
	import { toast } from "svelte-sonner";
	import axios from "axios";
	import { Constants } from "$lib/constants";

	let {
		open = $bindable(false),
		onViewHistory,
	}: {
		open: boolean;
		onViewHistory?: () => void;
	} = $props();

	let feedbackType = $state<"bug" | "feature" | "problem" | "suggestion" | "others">("suggestion");
	let subject = $state("");
	let feedback = $state("");
	let errorCode = $state("");
	let isSubmitting = $state(false);

	const feedbackTypes = [
		{ value: "bug", label: "🐛 Bug Report", description: "Something isn't working" },
		{ value: "feature", label: "✨ Feature Request", description: "Suggest a new feature" },
		{ value: "problem", label: "⚠️ Problem", description: "Having an issue" },
		{ value: "suggestion", label: "💡 Suggestion", description: "Share your ideas" },
		{ value: "others", label: "💬 Others", description: "General feedback" },
	] as const;

	function resetForm() {
		feedbackType = "suggestion";
		subject = "";
		feedback = "";
		errorCode = "";
	}

	function handleClose() {
		open = false;
		resetForm();
	}

	async function handleSubmit() {
		// Validation
		if (!subject.trim()) {
			toast.error("Please enter a subject");
			return;
		}
		if (!feedback.trim()) {
			toast.error("Please enter your feedback");
			return;
		}

		if (feedback.trim().length < 10) {
			toast.error("Feedback must be at least 10 characters");
			return;
		}

		isSubmitting = true;
		const submitToast = toast.loading("Submitting your feedback...");

		try {
			const response = await axios.post(Constants._API_URI.CREATE_FEEDBACK, {
				feedbackType,
				subject: subject.trim(),
				feedback: feedback.trim(),
				errorCode: errorCode.trim() || undefined,
			});

			toast.success("Thank you for your feedback! We'll review it soon.", {
				id: submitToast,
				duration: 3000,
			});

			handleClose();
		} catch (error) {
			console.error("Feedback submission error:", error);
			
			if (axios.isAxiosError(error)) {
				const message = error.response?.data?.error || "Failed to submit feedback";
				toast.error(message, { id: submitToast });
			} else {
				toast.error("Something went wrong. Please try again.", { id: submitToast });
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if open}
	<!-- Backdrop -->
	<button
		class="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm"
		transition:fade={{ duration: 250, easing: cubicOut }}
		onclick={handleClose}
		aria-label="Close feedback modal"
	></button>

	<!-- Modal -->
	<div
		class="fixed inset-x-0 bottom-0 z-70 flex items-end justify-center sm:inset-0 sm:items-center sm:p-4"
		transition:fly={{ y: 100, duration: 400, easing: cubicOut }}
	>
		<div
			class="relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
			style="max-height: 90vh;"
			transition:scale={{ start: 0.95, duration: 300, easing: cubicOut }}
		>
			<!-- Header -->
			<div class="relative overflow-hidden bg-linear-to-br from-blue-500 to-purple-600 px-6 py-8 text-white">
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

					<h2 class="mb-2 text-2xl font-bold">Share Your Feedback</h2>
					<p class="text-sm text-white/90">Help us improve Shusseki</p>
					
					{#if onViewHistory}
						<button
							onclick={() => {
								handleClose();
								onViewHistory?.();
							}}
							class=""
						>
							<ClockIcon class="h-4 w-4" />
							<span>View feedback history</span>
						</button>
					{/if}
				</div>
			</div>

			<!-- Scrollable Form Content -->
			<div class="flex-1 overflow-y-auto px-6 py-6">
				<!-- Feedback Type Selection -->
				<div class="mb-6">
					<div class="mb-3 block text-sm font-semibold text-gray-900">
						What type of feedback?
					</div>
					<div class="grid grid-cols-1 gap-2">
						{#each feedbackTypes as type}
							<button
								onclick={() => (feedbackType = type.value)}
								class="flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all"
								class:border-blue-500={feedbackType === type.value}
								class:bg-blue-50={feedbackType === type.value}
								class:border-gray-200={feedbackType !== type.value}
								class:hover:border-gray-300={feedbackType !== type.value}
							>
								<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-2xl bg-white shadow-sm">
									{type.label.split(" ")[0]}
								</div>
								<div class="flex-1 min-w-0">
									<div class="font-semibold text-gray-900">
										{type.label.split(" ").slice(1).join(" ")}
									</div>
									<div class="text-sm text-gray-600">{type.description}</div>
								</div>
								{#if feedbackType === type.value}
									<div class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500">
										<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<!-- Subject Input -->
				<div class="mb-4">
					<label for="subject" class="mb-2 block text-sm font-semibold text-gray-900">
						Subject <span class="text-red-500">*</span>
					</label>
					<input
						id="subject"
						type="text"
						bind:value={subject}
						placeholder="Brief summary of your feedback"
						maxlength="191"
						class="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
					/>
				</div>

				<!-- Feedback Textarea -->
				<div class="mb-4">
					<label for="feedback" class="mb-2 block text-sm font-semibold text-gray-900">
						Your Feedback <span class="text-red-500">*</span>
					</label>
					<textarea
						id="feedback"
						bind:value={feedback}
						placeholder="Tell us more about your experience, suggestion, or issue..."
						rows="5"
						maxlength="191"
						class="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
					></textarea>
					<p class="mt-1 text-xs text-gray-500">
						{feedback.length}/191 characters
					</p>
				</div>

				<!-- Error Code Input (optional) -->
				{#if feedbackType === "bug" || feedbackType === "problem"}
					<div class="mb-4">
						<label for="errorCode" class="mb-2 block text-sm font-semibold text-gray-900">
							Error Code (if any)
						</label>
						<input
							id="errorCode"
							type="text"
							bind:value={errorCode}
							placeholder="e.g., ERR_500, ATTENDANCE_LOAD_FAILED"
							maxlength="191"
							class="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>
				{/if}

				<!-- Note -->
				<div class="rounded-2xl bg-blue-50 p-4 border border-blue-100">
					<p class="text-sm text-blue-900">
						<strong>Note:</strong> We review all feedback carefully. While we may not respond to every submission, your input helps us make Shusseki better for everyone.
					</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="border-t border-gray-100 bg-white px-6 py-4">
				<button
					onclick={handleSubmit}
					disabled={isSubmitting || !subject.trim() || !feedback.trim()}
					type="button"
					class="w-full rounded-2xl bg-linear-to-r from-blue-500 to-purple-600 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
				>
					{isSubmitting ? "Submitting..." : "Submit Feedback"}
				</button>
			</div>
		</div>
	</div>
{/if}
