<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import {
        MessageChatCircleIcon,
        ClockIcon,
        CheckCircleIcon,
    } from "@untitled-theme/icons-svelte";
    import { toast } from "svelte-sonner";
    import axios from "axios";
    import { Constants } from "$lib/constants";
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import TheForestv1 from "$lib/assets/the-forest.webp";
    import PageHeader from "$lib/components/custom/PageHeader.svelte";

    let feedbackType = $state<
        "bug" | "feature" | "problem" | "suggestion" | "others"
    >("suggestion");
    let subject = $state("");
    let feedback = $state("");
    let errorCode = $state("");
    let isSubmitting = $state(false);
    let feedbackList = $state<any[]>([]);
    let isLoadingHistory = $state(false);
    let showHistory = $state(false);
    let highlightFeedbackId = $state<string | null>(null);

    const feedbackTypes = [
        {
            value: "bug",
            label: "🐞 Bug Report",
            description: "Something isn't working",
        },
        {
            value: "feature",
            label: "✨ Feature Request",
            description: "Suggest a new feature",
        },
        {
            value: "problem",
            label: "⚠️ Problem",
            description: "Having an issue",
        },
        {
            value: "suggestion",
            label: "💡 Suggestion",
            description: "Share your ideas",
        },
        {
            value: "others",
            label: "💬 Others",
            description: "General feedback",
        },
    ] as const;

    const feedbackTypeLabels: Record<
        string,
        { label: string; emoji: string; color: string }
    > = {
        bug: {
            label: "Bug Report",
            emoji: "🐞",
            color: "text-red-600 bg-red-50",
        },
        feature: {
            label: "Feature Request",
            emoji: "✨",
            color: "text-purple-600 bg-purple-50",
        },
        problem: {
            label: "Problem",
            emoji: "⚠️",
            color: "text-orange-600 bg-orange-50",
        },
        suggestion: {
            label: "Suggestion",
            emoji: "💡",
            color: "text-blue-600 bg-blue-50",
        },
        others: {
            label: "Others",
            emoji: "💬",
            color: "text-gray-600 bg-gray-50",
        },
    };

    function resetForm() {
        feedbackType = "suggestion";
        subject = "";
        feedback = "";
        errorCode = "";
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
            const response = await axios.post(
                Constants._API_URI.CREATE_FEEDBACK,
                {
                    feedbackType,
                    subject: subject.trim(),
                    feedback: feedback.trim(),
                    errorCode: errorCode.trim() || undefined,
                },
            );

            toast.success(
                "Thank you for your feedback! We'll review it soon.",
                {
                    id: submitToast,
                    duration: 3000,
                },
            );

            resetForm();
            loadFeedbackHistory();
        } catch (error) {
            console.error("Feedback submission error:", error);

            if (axios.isAxiosError(error)) {
                const message =
                    error.response?.data?.error || "Failed to submit feedback";
                toast.error(message, { id: submitToast });
            } else {
                toast.error("Something went wrong. Please try again.", {
                    id: submitToast,
                });
            }
        } finally {
            isSubmitting = false;
        }
    }

    async function loadFeedbackHistory() {
        isLoadingHistory = true;
        try {
            const response = await axios.get(Constants._API_URI.LIST_FEEDBACK);
            feedbackList = response.data.data || [];
        } catch (error) {
            console.error("Failed to load feedback:", error);
        } finally {
            isLoadingHistory = false;
        }
    }

    function formatDate(dateString: string | Date) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    onMount(() => {
        loadFeedbackHistory();

        // Check if coming from notification with feedbackId
        const urlParams = new URLSearchParams(window.location.search);
        const feedbackIdFromNotification = urlParams.get('feedbackId');
        
        if (feedbackIdFromNotification) {
            // Show history tab
            showHistory = true;
            // Highlight the specific feedback
            highlightFeedbackId = feedbackIdFromNotification;
            // Scroll to it after a brief delay
            setTimeout(() => {
                const element = document.getElementById(`feedback-${feedbackIdFromNotification}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
            // Clear highlight after 5 seconds
            setTimeout(() => {
                highlightFeedbackId = null;
            }, 5000);
        }
    });
</script>

<div class="min-h-screen bg-gray-100 pb-24">
    <!-- Header with background image -->
    <div
        class="relative overflow-hidden bg-no-repeat"
        style="background-image: url({TheForestv1}); background-size: cover; background-position: center;"
    >
        <!-- Dark overlay -->
        <div class="absolute inset-0 bg-black/20"></div>
        
        <!-- Page Header Component -->
        <div class="relative">
            <div class="absolute inset-0 backdrop-blur-[2px]"></div>
            <div class="relative [&>div]:bg-transparent [&>div]:border-0 [&>div]:backdrop-blur-sm [&_button]:text-white [&_h1]:text-white [&_button:hover]:bg-white/10">
                <PageHeader title="Feedback" backUrl="/view/attendance" />
            </div>
        </div>

        <!-- Decorative circles -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
            <div
                class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
            ></div>
            <div
                class="absolute -left-10 top-20 h-32 w-32 rounded-full bg-white/10 blur-2xl"
            ></div>
        </div>

        <div class="relative px-6 pb-12 pt-4 text-white">
            <div
                class="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
            >
                <MessageChatCircleIcon class="h-7 w-7" />
            </div>
            <h1 class="mb-2 text-3xl font-bold">Share Your Feedback</h1>
            <p class="text-sm text-white/90">
                Help us improve Shusseki by sharing your thoughts
            </p>
        </div>
    </div>

    <div class="mx-auto max-w-2xl px-4 py-6">
        <!-- Toggle Buttons -->
        <div class="mb-6 flex gap-3">
            <button
                onclick={() => (showHistory = false)}
                class="text-sm flex-1 rounded-2xl px-6 py-3 font-semibold transition-all"
                class:bg-blue-600={!showHistory}
                class:text-white={!showHistory}
                class:bg-white={showHistory}
                class:text-gray-700={showHistory}
                class:shadow-md={!showHistory}
            >
                Submit Feedback
            </button>
            <button
                onclick={() => (showHistory = true)}
                class="text-sm flex-1 rounded-2xl px-6 py-3 font-semibold transition-all"
                class:bg-blue-600={showHistory}
                class:text-white={showHistory}
                class:bg-white={!showHistory}
                class:text-gray-700={!showHistory}
                class:shadow-md={showHistory}
            >
                Your History
            </button>
        </div>

        <!-- Content Container with smooth transition -->
        <div class="relative">
            {#if !showHistory}
                <!-- Feedback Form -->
                <div
                    class="rounded-3xl bg-white p-6 shadow-lg"
                    in:fade={{ duration: 200, delay: 150 }}
                    out:fade={{ duration: 150 }}
                >
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
                                class:border-blue-500={feedbackType ===
                                    type.value}
                                class:bg-blue-50={feedbackType === type.value}
                                class:border-gray-200={feedbackType !==
                                    type.value}
                                class:hover:border-gray-300={feedbackType !==
                                    type.value}
                            >
                                <div
                                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm"
                                >
                                    {type.label.split(" ")[0]}
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="font-semibold text-gray-900">
                                        {type.label
                                            .split(" ")
                                            .slice(1)
                                            .join(" ")}
                                    </div>
                                    <div class="text-sm text-gray-600">
                                        {type.description}
                                    </div>
                                </div>
                                {#if feedbackType === type.value}
                                    <div
                                        class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500"
                                    >
                                        <svg
                                            class="h-3 w-3 text-white"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
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
                    <label
                        for="subject"
                        class="mb-2 block text-sm font-semibold text-gray-900"
                    >
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
                    <label
                        for="feedback"
                        class="mb-2 block text-sm font-semibold text-gray-900"
                    >
                        Your Feedback <span class="text-red-500">*</span>
                    </label>
                    <textarea
                        id="feedback"
                        bind:value={feedback}
                        placeholder="Tell us more about your experience, suggestion, or issue..."
                        rows="5"
                        maxlength="500"
                        class="w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    ></textarea>
                    <p class="mt-1 text-xs text-gray-500">
                        {feedback.length}/500 characters
                    </p>
                </div>

                <!-- Error Code Input (optional) -->
                {#if feedbackType === "bug" || feedbackType === "problem"}
                    <div class="mb-4">
                        <label
                            for="errorCode"
                            class="mb-2 block text-sm font-semibold text-gray-900"
                        >
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
                <div
                    class="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4"
                >
                    <p class="text-sm text-blue-900">
                        <strong>Note:</strong> We review all feedback carefully.
                        While we may not respond to every submission, your input
                        helps us make Shusseki better for everyone.
                    </p>
                </div>

                <!-- Submit Button -->
                <button
                    onclick={handleSubmit}
                    disabled={isSubmitting ||
                        !subject.trim() ||
                        !feedback.trim()}
                    type="button"
                    class="w-full rounded-2xl bg-mild-blue py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                    {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </button>
            </div>
        {:else}
            <!-- Feedback History -->
            <div 
                in:fade={{ duration: 200, delay: 150 }}
                out:fade={{ duration: 150 }}
            >
                {#if isLoadingHistory}
                    <div class="flex items-center justify-center py-12">
                        <div
                            class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
                        ></div>
                    </div>
                {:else if feedbackList.length === 0}
                    <div
                        class="flex flex-col items-center justify-center rounded-3xl bg-white py-16 text-center shadow-lg"
                    >
                        <div
                            class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100"
                        >
                            <span class="text-4xl">📭</span>
                        </div>
                        <h3 class="mb-2 text-lg font-semibold text-gray-900">
                            No feedback yet
                        </h3>
                        <p class="mb-6 text-sm text-gray-600">
                            Your feedback submissions will appear here
                        </p>
                        <button
                            onclick={() => (showHistory = false)}
                            class="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700"
                        >
                            Submit Your First Feedback
                        </button>
                    </div>
                {:else}
                    <div class="space-y-4">
                        {#each feedbackList as item, index}
                            {@const typeInfo =
                                feedbackTypeLabels[item.feedbackType] ||
                                feedbackTypeLabels.others}
                            <div
                                id="feedback-{item.feedbackId}"
                                class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md {highlightFeedbackId === item.feedbackId ? 'ring-4 ring-blue-500 ring-offset-2' : ''}"
                                transition:scale={{
                                    delay: index * 50,
                                    duration: 300,
                                    easing: cubicOut,
                                }}
                            >
                                <!-- Header -->
                                <div
                                    class="mb-3 flex items-start justify-between gap-3"
                                >
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="flex h-8 w-8 items-center justify-center rounded-xl text-lg {typeInfo.color}"
                                        >
                                            {typeInfo.emoji}
                                        </span>
                                        <div>
                                            <h3
                                                class="font-semibold text-gray-900"
                                            >
                                                {item.subject}
                                            </h3>
                                            <p class="text-xs text-gray-500">
                                                {typeInfo.label}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        class="flex items-center gap-1.5 text-xs text-gray-500"
                                    >
                                        {#if item.isReplied}
                                            <CheckCircleIcon
                                                class="h-4 w-4 text-green-600"
                                            />
                                            <span class="text-green-600"
                                                >Replied</span
                                            >
                                        {:else}
                                            <ClockIcon
                                                class="h-4 w-4 text-amber-600"
                                            />
                                            <span class="text-amber-600"
                                                >Pending</span
                                            >
                                        {/if}
                                    </div>
                                </div>

                                <!-- Feedback -->
                                <p class="mb-3 text-sm text-gray-700">
                                    {item.feedback}
                                </p>

                                {#if item.errorCode}
                                    <div
                                        class="mb-3 rounded-lg bg-red-50 px-3 py-2"
                                    >
                                        <p
                                            class="font-mono text-xs text-red-700"
                                        >
                                            Error: {item.errorCode}
                                        </p>
                                    </div>
                                {/if}

                                <!-- Reply -->
                                {#if item.isReplied && item.reply}
                                    <div
                                        class="rounded-xl border border-blue-100 bg-blue-50 p-4"
                                    >
                                        <p
                                            class="mb-1 text-xs font-semibold text-blue-900"
                                        >
                                            Team Response
                                        </p>
                                        <p class="text-sm text-blue-800">
                                            {item.reply}
                                        </p>
                                    </div>
                                {/if}

                                <!-- Footer -->
                                <div
                                    class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3"
                                >
                                    <p class="text-xs text-gray-500">
                                        Submitted on {formatDate(
                                            item.createdAt,
                                        )}
                                    </p>
                                    <p class="text-xs text-gray-400">
                                        #{item.feedbackId.slice(0, 8)}
                                    </p>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
        </div>
    </div>
</div>
