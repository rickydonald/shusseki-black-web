<script lang="ts">
	import { fade, scale } from "svelte/transition";
	import { cubicOut } from "svelte/easing";
	import { MessageChatCircleIcon, XIcon } from "@untitled-theme/icons-svelte";
	import { goto } from "$app/navigation";

	let {
		onClose,
	}: {
		onClose: () => void;
	} = $props();

	function handleClose() {
		console.log("Close button clicked");
		onClose();
	}

	function handleFeedback() {
		goto("/view/feedback");
	}
</script>

<div
	class="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-400 via-sky-400 to-blue-500 p-6 text-white shadow-xl"
	in:scale={{ start: 0.95, duration: 400, easing: cubicOut }}
	out:scale={{ start: 1, opacity: 0, duration: 300, easing: cubicOut }}
>
	<!-- Decorative elements -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
		<div class="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
	</div>

	<!-- Close button -->
	<button
		onclick={handleClose}
		type="button"
		class="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
		aria-label="Close feedback prompt"
	>
		<XIcon class="h-4 w-4" />
	</button>

	<!-- Content -->
	<div class="relative">
		<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
			<MessageChatCircleIcon class="h-6 w-6" />
		</div>

		<h3 class="mb-2 text-xl font-bold">We'd love your feedback!</h3>
		<p class="mb-4 text-sm text-white/90">
			Help us make Shusseki better by sharing your thoughts, reporting bugs, or suggesting new features.
		</p>

		<button
			onclick={handleFeedback}
			class="w-full rounded-2xl bg-white px-6 py-3 font-semibold text-blue-600 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
		>
			Share Feedback
		</button>
	</div>
</div>
