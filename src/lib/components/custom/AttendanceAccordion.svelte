<script lang="ts">
    import { slide, fade } from "svelte/transition";
    import ChevronDownIcon from "@untitled-theme/icons-svelte/ChevronDownIcon.svelte";
    interface Props {
        children: any;
        isOpen?: boolean;
        headerTitle?: string;
        className?: string;
        type?: "Single" | "Top" | "Middle" | "Bottom";
    }

    let {
        children,
        isOpen = false,
        headerTitle,
        className = "",
        type = "Single",
    }: Props = $props();

    // local state and override flag
    let open: boolean = $state(false);
    let manuallyOverridden = $state(false);

    function handleClick() {
        open = !open;
        manuallyOverridden = true;
    }

    // derived state combines parent and local
    let expanded = $derived(() => (manuallyOverridden ? open : isOpen));

    // sync if parent changes externally (reset manual override)
    $effect(() => {
        if (!manuallyOverridden) open = isOpen ?? false;
    });

    function getBorderRadius() {
        switch (type) {
            case "Top":
                return "rounded-t-2xl";
            case "Middle":
                return "rounded-none";
            case "Bottom":
                return "rounded-b-2xl";
            case "Single":
            default:
                return "rounded-2xl";
        }
    }
</script>

<div
    class="accordion w-full py-4 px-6 bg-white transition-all duration-300 {getBorderRadius()} {className}"
>
    <!-- Header -->
    <button
        class="header flex items-center justify-between w-full"
        onclick={handleClick}
    >
        <div class="text">
            <h1 class="text-[18px] font-medium text-gray-900 leading-snug mt-1">
                {headerTitle || "Attendance Details"}
            </h1>
        </div>

        <!-- Animated Chevron -->
        <span
            class="inline-block transition-transform duration-300 ease-in-out"
            style="transform: rotate({expanded() ? '180deg' : '0deg'});"
        >
            <ChevronDownIcon class="w-5 h-5 text-gray-600" />
        </span>
    </button>

    <!-- Animated Details -->
    {#if expanded()}
        <div class="details overflow-hidden" transition:slide|local>
            <div>{@render children()}</div>
        </div>
    {/if}
</div>

<style>
    div.details {
        margin-top: 1rem;
    }
</style>
