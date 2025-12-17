<script lang="ts">
	import { FlashIcon, RefreshCw01Icon } from "@untitled-theme/icons-svelte";

	interface Props {
		isLoading?: boolean;
		onCheckAgain?: () => void;
	}

	let { isLoading = false, onCheckAgain }: Props = $props();
</script>

<section
	class="w-full mt-1 bg-white rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px]"
>
	<div class="text-center max-w-sm">
		<div class="mb-6 relative">
			<div class="absolute inset-0 flex items-center justify-center">
				<div class="w-20 h-20 bg-gray-100 rounded-full animate-pulse"></div>
			</div>
			<FlashIcon
				class="mx-auto relative z-10 text-gray-400"
				width={56}
				height={56}
			/>
		</div>
		<h3 class="text-lg font-semibold text-gray-900 mb-2">
			No Attendance Data
		</h3>
		<p class="text-sm text-gray-500 mb-6 leading-relaxed">
			Your attendance records will appear here once they're available from
			the system.
		</p>
		<button
			onclick={onCheckAgain}
			disabled={isLoading}
			class="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
		>
			<RefreshCw01Icon
				width={16}
				height={16}
				class={isLoading ? "animate-spin" : ""}
			/>
			{isLoading ? "Checking..." : "Check Again"}
		</button>
	</div>
</section>
