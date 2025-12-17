<script lang="ts">
	interface Props {
		isVisible?: boolean;
	}

	let { isVisible = true }: Props = $props();
</script>

{#if isVisible}
	<div class="fixed inset-0 pointer-events-none z-10 overflow-hidden">
		<!-- Balloon 1 -->
		<div
			class="absolute w-6 h-8 text-2xl animate-float"
			style="left: 10%; bottom: -50px; animation-delay: 0s; animation-duration: 4s;"
		>
			🎈
		</div>

		<!-- Balloon 2 -->
		<div
			class="absolute w-6 h-8 text-2xl animate-float"
			style="left: 20%; bottom: -50px; animation-delay: 0.5s; animation-duration: 4.5s;"
		>
			🎈
		</div>

		<!-- Balloon 3 -->
		<div
			class="absolute w-6 h-8 text-2xl animate-float"
			style="left: 30%; bottom: -50px; animation-delay: 1s; animation-duration: 5s;"
		>
			🎈
		</div>

		<!-- Balloon 4 -->
		<div
			class="absolute w-6 h-8 text-2xl animate-float"
			style="left: 40%; bottom: -50px; animation-delay: 1.5s; animation-duration: 4.5s;"
		>
			🎈
		</div>

		<!-- Balloon 5 -->
		<div
			class="absolute w-6 h-8 text-2xl animate-float"
			style="left: 50%; bottom: -50px; animation-delay: 0.2s; animation-duration: 5.5s;"
		>
			🎈
		</div>

		<!-- Balloon 6 -->
		<div
			class="absolute w-6 h-8 text-2xl animate-float"
			style="left: 60%; bottom: -50px; animation-delay: 0.8s; animation-duration: 4.8s;"
		>
			🎈
		</div>

		<!-- Balloon 7 -->
		<div
			class="absolute w-6 h-8 text-2xl animate-float"
			style="left: 70%; bottom: -50px; animation-delay: 1.2s; animation-duration: 5.2s;"
		>
			🎈
		</div>

		<!-- Balloon 8 -->
		<div
			class="absolute w-6 h-8 text-2xl animate-float"
			style="left: 80%; bottom: -50px; animation-delay: 0.5s; animation-duration: 4.8s;"
		>
			🎈
		</div>

		<!-- Balloon 9 -->
		<div
			class="absolute w-6 h-8 text-2xl animate-float"
			style="left: 90%; bottom: -50px; animation-delay: 1.3s; animation-duration: 5.5s;"
		>
			🎈
		</div>
	</div>
{/if}

<style>
	@keyframes float {
		0% {
			transform: translateY(0) translateX(0) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: translateY(-100vh) translateX(0) rotate(-20deg);
			opacity: 0;
		}
	}

	:global(.animate-float) {
		animation: float 5s ease-in infinite;
	}
</style>
