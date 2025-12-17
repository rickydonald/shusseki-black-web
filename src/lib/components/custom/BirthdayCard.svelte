<script lang="ts">
	import { fade, scale } from "svelte/transition";
	import { quintOut } from "svelte/easing";
	import XCloseIcon from "@untitled-theme/icons-svelte/XCloseIcon.svelte";

	// Props
	interface Props {
		userName: string;
		onClose: () => void;
	}

	let { userName, onClose }: Props = $props();
</script>

<!-- Overlay -->
<button
	class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 cursor-default"
	onclick={onClose}
	transition:fade={{ duration: 300 }}
	aria-label="Close birthday card"
></button>

<!-- Birthday Card -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
	transition:fade={{ duration: 300 }}
>
	<div
		class="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm pointer-events-auto overflow-hidden"
		transition:scale={{ duration: 500, easing: quintOut, start: 0.85 }}
	>
		<!-- Close Button -->
		<button
			onclick={onClose}
			class="absolute top-5 right-5 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200"
		>
			<XCloseIcon class="w-4 h-4" />
		</button>

		<!-- Card Content -->
		<div class="px-6 py-8 text-center">
			<!-- Emoji Icon -->
			<div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
				<span class="text-5xl">🎂</span>
			</div>

			<!-- Birthday Text -->
			<div class="space-y-2 mb-5">
				<h2 class="text-4xl font-bold text-gray-900">
					Happy Birthday!
				</h2>
				
				<p class="text-2xl font-semibold text-gray-800">
					{userName}
				</p>
			</div>

			<!-- Message -->
			<p class="text-gray-600 leading-relaxed text-sm mb-5">
				Today is your special day. Celebrating you and all the wonderful things you bring!
			</p>

			<!-- Decorative Line -->
			<div class="flex items-center justify-center gap-2 mb-5">
				<div class="h-px w-6 bg-gray-300"></div>
				<span class="text-xl">✨</span>
				<div class="h-px w-6 bg-gray-300"></div>
			</div>

			<!-- Birthday Info -->
			<p class="text-xs text-gray-500 mb-6">
				Wishing you joy, growth, and amazing moments!
				<span class="block mt-1">Love ❤️ from Shusseki</span>
			</p>

			<!-- Button -->
			<button
				onclick={onClose}
				class="w-full py-2.5 px-6 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full transition-all duration-300 active:scale-95"
			>
				Thank You
			</button>
		</div>
	</div>
</div>
