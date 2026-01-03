<script lang="ts">
	import { goto } from "$app/navigation";
	import ChevronLeftIcon from "@untitled-theme/icons-svelte/ChevronLeftIcon.svelte";

	interface Props {
		title: string;
		backUrl?: string;
	}

	let { title, backUrl = "/view/attendance" }: Props = $props();
</script>

<div class="sticky top-0 bg-white backdrop-blur-lg z-10 border-b border-gray-200">
	<div class="px-4 pb-3" style="padding-top: calc(env(safe-area-inset-top) + 1rem);">
		<div class="flex items-center gap-3">
			<button
				onclick={() => goto(backUrl)}
				aria-label="Go back"
				class="p-2 -ml-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
			>
				<ChevronLeftIcon class="w-5 h-5" />
			</button>
			<h1 class="text-xl font-bold text-gray-900">{title}</h1>
		</div>
	</div>
</div>
