<script lang="ts">
    import {
        setLastSeenVersion,
        getVersionBumpType,
        isPrerelease,
        getPrereleaseType,
    } from "$lib/utils/version";
    import { fly, fade, scale } from "svelte/transition";
    import { cubicOut, elasticOut } from "svelte/easing";
    import BackgroundImage from "$lib/assets/insights-background.webp";

    interface Feature {
        icon?: string;
        title: string;
        description: string;
    }

    interface ReleaseData {
        version: string;
        versionCode: string;
        date: string;
        title: string;
        highlights: string[];
        features: Feature[];
        improvements: string[];
        bugFixes: string[];
    }

    let {
        open = $bindable(false),
        releaseData,
        previousVersion,
    }: {
        open: boolean;
        releaseData: ReleaseData;
        previousVersion?: string;
    } = $props();

    const versionBumpType = $derived(
        previousVersion
            ? getVersionBumpType(previousVersion, releaseData.version)
            : "minor",
    );

    const isPrereleaseVersion = $derived(isPrerelease(releaseData.version));
    const prereleaseType = $derived(getPrereleaseType(releaseData.version));

    // Track scroll state for blur effect
    let scrollContainer = $state<HTMLElement | undefined>(undefined);
    let isScrolled = $state(false);
    let isAtBottom = $state(false);

    function handleScroll(e: Event) {
        const target = e.target as HTMLElement;
        isScrolled = target.scrollTop > 20;
        isAtBottom =
            target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
    }

    const getBadgeColor = (type: string) => {
        switch (type) {
            case "major":
                return "bg-linear-to-r from-purple-500 to-pink-500";
            case "minor":
                return "bg-linear-to-r from-[#3b82f6] to-[#06b6d4]";
            case "patch":
                return "bg-linear-to-r from-green-500 to-emerald-500";
            case "prerelease":
                return "bg-orange-500";
            default:
                return "bg-linear-to-r from-gray-500 to-gray-600";
        }
    };

    const getBadgeText = (type: string) => {
        if (isPrereleaseVersion && prereleaseType) {
            return `${prereleaseType} Release`;
        }
        switch (type) {
            case "major":
                return "Major Update";
            case "minor":
                return "Minor Update";
            case "patch":
                return "Patch Update";
            case "prerelease":
                return "Pre-release";
            default:
                return "Update";
        }
    };

    function handleContinue() {
        setLastSeenVersion(releaseData.version);
        open = false;
    }

    function handleClose() {
        setLastSeenVersion(releaseData.version);
        open = false;
    }
</script>

{#if open}
    <!-- Backdrop -->
    <button
        class="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm"
        transition:fade={{ duration: 250, easing: cubicOut }}
        onclick={handleClose}
        aria-label="Close release notes"
    ></button>

    <!-- Modal -->
    <div
        class="fixed inset-x-0 bottom-0 z-70 flex items-end justify-center sm:inset-0 sm:items-center sm:p-4"
        transition:fly={{ y: 100, duration: 400, easing: cubicOut }}
    >
        <div
            class="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            style="max-height: 92vh;"
            transition:scale={{ start: 0.95, duration: 300, easing: cubicOut }}
        >
            <!-- Top scroll blur indicator -->
            {#if isScrolled}
                <div
                    class="pointer-events-none absolute inset-x-0 top-0 z-40 h-12 bg-linear-to-b from-white/95 to-transparent"
                    transition:fade={{ duration: 200 }}
                ></div>
            {/if}

            <!-- Scrollable container -->
            <div
                bind:this={scrollContainer}
                onscroll={handleScroll}
                class="custom-scrollbar flex-1 overflow-y-auto"
            >
                <!-- Header with gradient - Now scrolls with content -->
                <div
                    class="relative overflow-hidden px-6 pb-10 pt-10 text-white sm:pt-14 bg-cover bg-center bg-no-repeat"
                    style={`background-image:url(${BackgroundImage})`}
                >
                    <!-- Decorative circles -->
                    <div
                        class="pointer-events-none absolute inset-0 overflow-hidden"
                    >
                        <div
                            class="absolute -right-10 -top-10 h-40 w-40 animate-float rounded-full bg-white/10 blur-2xl"
                        ></div>
                        <div
                            class="absolute -left-10 top-20 h-32 w-32 animate-float-delayed rounded-full bg-white/10 blur-2xl"
                            style="animation-delay: 1s;"
                        ></div>
                    </div>

                    <!-- Title area with blur effect when scrolled -->
                    <div class="relative">
                        {#if isScrolled}
                            <div
                                class="absolute -inset-x-6 -inset-y-2 bg-white/5 backdrop-blur-md transition-all duration-300 rounded-2xl"
                                transition:fade={{ duration: 300 }}
                            ></div>
                        {/if}

                        <!-- Title with animation -->
                        <h2
                            class="relative z-10 mb-2 text-3xl font-bold leading-tight animate-slide-in-left sm:text-4xl"
                            style="animation-delay: 0.1s;"
                        >
                            {releaseData.title}
                        </h2>
                        <p
                            class="relative z-10 text-sm text-white/90 animate-slide-in-left"
                            style="animation-delay: 0.2s;"
                        >
                            #{releaseData.versionCode} | v{releaseData.version}
                        </p>
                    </div>
                </div>
                <!-- Content -->
                <div class="px-6 py-6 sm:px-8 pb-24">
                    <!-- Highlights -->
                    {#if releaseData.highlights && releaseData.highlights.length > 0}
                        <div
                            class="mb-8 animate-fade-in-up"
                            style="animation-delay: 0.1s;"
                        >
                            <div class="mb-4 flex items-center gap-2">
                                <div
                                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-yellow-400 to-orange-500 text-white shadow-md"
                                >
                                    <span class="text-lg">✨</span>
                                </div>
                                <h3 class="text-xl font-bold text-gray-900">
                                    Highlights
                                </h3>
                            </div>
                            <ul class="space-y-3 pl-1">
                                {#each releaseData.highlights as highlight, i}
                                    <li
                                        class="flex items-start gap-3 text-gray-700 animate-fade-in-up"
                                        style="animation-delay: {0.15 +
                                            i * 0.05}s;"
                                    >
                                        <span
                                            class="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-linear-to-r from-[#3b82f6] to-[#06b6d4]"
                                        ></span>
                                        <span class="flex-1 leading-relaxed"
                                            >{highlight}</span
                                        >
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/if}

                    <!-- Features -->
                    {#if releaseData.features && releaseData.features.length > 0}
                        <div
                            class="mb-8 animate-fade-in-up"
                            style="animation-delay: 0.2s;"
                        >
                            <div class="mb-4 flex items-center gap-2">
                                <h3 class="text-xl font-bold text-gray-900">
                                    What's New in Shusseki
                                </h3>
                            </div>
                            <div class="grid gap-4 sm:grid-cols-2">
                                {#each releaseData.features as feature, i}
                                    <div
                                        class="group flex gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:border-cyan-200 hover:shadow-md animate-fade-in-up"
                                        style="animation-delay: {0.25 +
                                            i * 0.05}s;"
                                    >
                                        {#if feature.icon}
                                            <div
                                                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl bg-gray-100 transition-transform duration-300 group-hover:scale-110"
                                            >
                                                {feature.icon}
                                            </div>
                                        {/if}
                                        <div class="flex-1 min-w-0">
                                            <h4
                                                class="mb-1.5 font-semibold text-gray-900 leading-tight"
                                            >
                                                {feature.title}
                                            </h4>
                                            <p
                                                class="text-sm leading-relaxed text-gray-600"
                                            >
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Improvements -->
                    {#if releaseData.improvements && releaseData.improvements.length > 0}
                        <div
                            class="mb-8 animate-fade-in-up"
                            style="animation-delay: 0.3s;"
                        >
                            <div class="mb-4 flex items-center gap-2">
                                <div
                                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-green-500 to-emerald-600 text-white shadow-md"
                                >
                                    <span class="text-lg">⚡</span>
                                </div>
                                <h3 class="text-xl font-bold text-gray-900">
                                    Improvements
                                </h3>
                            </div>
                            <ul class="space-y-3 pl-1">
                                {#each releaseData.improvements as improvement, i}
                                    <li
                                        class="flex items-start gap-3 text-gray-700 animate-fade-in-up"
                                        style="animation-delay: {0.35 +
                                            i * 0.05}s;"
                                    >
                                        <span
                                            class="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-green-500"
                                        ></span>
                                        <span class="flex-1 leading-relaxed"
                                            >{improvement}</span
                                        >
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/if}

                    <!-- Bug Fixes -->
                    {#if releaseData.bugFixes && releaseData.bugFixes.length > 0}
                        <div
                            class="mb-6 animate-fade-in-up"
                            style="animation-delay: 0.4s;"
                        >
                            <div class="mb-4 flex items-center gap-2">
                                <div
                                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-red-500 to-rose-600 text-white shadow-md"
                                >
                                    <span class="text-lg">🐛</span>
                                </div>
                                <h3 class="text-xl font-bold text-gray-900">
                                    Bug Fixes
                                </h3>
                            </div>
                            <ul class="space-y-3 pl-1">
                                {#each releaseData.bugFixes as bugFix, i}
                                    <li
                                        class="flex items-start gap-3 text-gray-700 animate-fade-in-up"
                                        style="animation-delay: {0.45 +
                                            i * 0.05}s;"
                                    >
                                        <span
                                            class="mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                                        ></span>
                                        <span class="flex-1 leading-relaxed"
                                            >{bugFix}</span
                                        >
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Footer with Continue button - Fixed at bottom -->
            <div
                class="relative z-30 border-t border-gray-100 bg-white px-6 py-5 sm:px-8 animate-fade-in"
            >
                <!-- Footer blur overlay when not at bottom -->
                {#if !isAtBottom}
                    <div
                        class="pointer-events-none absolute inset-x-0 top-0 h-12 -translate-y-full bg-linear-to-t from-white/95 to-transparent"
                        transition:fade={{ duration: 200 }}
                    ></div>
                {/if}

                <button
                    onclick={handleContinue}
                    type="button"
                    class="group relative w-full overflow-hidden rounded-2xl bg-[#3b82f6] py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                    <span class="relative z-10">Continue</span>
                    <!-- Shine effect -->
                    <div
                        class="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                    ></div>
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Custom elegant scrollbar */
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(59, 130, 246, 0.3) transparent;
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
        margin: 4px 0;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(
            to bottom,
            rgba(59, 130, 246, 0.4),
            rgba(6, 182, 212, 0.4)
        );
        border-radius: 10px;
        border: 2px solid transparent;
        background-clip: padding-box;
        transition: background 0.3s ease;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(
            to bottom,
            rgba(59, 130, 246, 0.6),
            rgba(6, 182, 212, 0.6)
        );
        border-radius: 10px;
        border: 2px solid transparent;
        background-clip: padding-box;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:active {
        background: linear-gradient(
            to bottom,
            rgba(59, 130, 246, 0.8),
            rgba(6, 182, 212, 0.8)
        );
    }

    /* Smooth scrolling */
    .custom-scrollbar {
        scroll-behavior: smooth;
    }

    /* Animations */
    @keyframes float {
        0%,
        100% {
            transform: translateY(0) scale(1);
        }
        50% {
            transform: translateY(-20px) scale(1.05);
        }
    }

    @keyframes fade-in-up {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes slide-in-left {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .animate-float {
        animation: float 6s ease-in-out infinite;
    }

    .animate-float-delayed {
        animation: float 8s ease-in-out infinite;
    }

    .animate-fade-in-up {
        animation: fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
    }

    .animate-fade-in {
        animation: fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
    }

    .animate-slide-in-left {
        animation: slide-in-left 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
    }
</style>
