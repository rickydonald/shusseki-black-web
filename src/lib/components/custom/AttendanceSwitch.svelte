<script lang="ts">
	import { cubicOut } from "svelte/easing";

	// Svelte 5 prop style
	let { value = "percentage", onclick } = $props<{
		value?: "percentage" | "hours";
		onclick?: (value: "percentage" | "hours") => void;
	}>();

	const options = [
		{ key: "percentage", label: "In Percentage" },
		{ key: "hours", label: "In Hours" },
	] as const;

	// Calculate indicator position
	let indicatorTransform = $derived(
		value === "percentage" ? "translateX(0%)" : "translateX(100%)"
	);
</script>

<div
	role="tablist"
	aria-label="Display mode"
	class="w-full relative flex items-center text-center justify-around bg-white border border-gray-200 rounded-2xl p-1 mt-1 z-0!"
	tabindex="0"
>
	<!-- Sliding indicator background -->
	<div
		class="indicator absolute top-1 bottom-1 left-1 right-1 pointer-events-none"
		style="transform: {indicatorTransform}"
	>
		<div class="indicator-inner"></div>
	</div>

	<!-- Tab buttons -->
	{#each options as opt, i}
		<button
			type="button"
			role="tab"
			aria-selected={value === opt.key}
			class="tab-button relative z-10 w-full px-4 py-2 text-sm rounded-xl transition-all duration-200 ease-out"
			class:active={value === opt.key}
			onclick={() => onclick?.(opt.key)}
		>
			<span class="relative z-10 transition-all duration-200">
				{opt.label}
			</span>
		</button>
	{/each}
</div>

<style>
	/* Sliding indicator container */
	.indicator {
		width: calc(50% - 0.25rem);
		transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 1;
	}

	/* Indicator inner styling */
	.indicator-inner {
		width: 100%;
		height: 100%;
		background: linear-gradient(
			135deg,
			rgba(17, 24, 39, 0.95) 0%,
			rgba(31, 41, 55, 0.95) 100%
		);
		border-radius: 0.75rem;
		/* box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.15),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.1); */
	}

	/* Tab button base styles */
	.tab-button {
		background: transparent;
		color: #6b7280;
		border: none;
		cursor: pointer;
		outline: none;
		position: relative;
	}

	.tab-button:hover {
		color: #374151;
	}

	.tab-button:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	/* Active tab styles */
	.tab-button.active {
		color: #ffffff;
		font-weight: 500;
	}

	.tab-button.active span {
		transform: scale(1.02);
	}

	/* Smooth color transition */
	.tab-button span {
		display: inline-block;
		transition:
			color 200ms ease-out,
			transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Hover effect for inactive tabs */
	.tab-button:not(.active):hover span {
		transform: scale(1.05);
	}

	/* Pressed state for better feedback */
	.tab-button:active:not(.active) {
		transform: scale(0.98);
	}

	/* Smooth spring animation */
	@media (prefers-reduced-motion: reduce) {
		.indicator,
		.indicator-inner,
		.tab-button,
		.tab-button span {
			transition-duration: 0ms;
			animation: none;
		}
	}
</style>
