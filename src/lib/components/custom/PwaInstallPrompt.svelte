<script lang="ts">
	import { browser } from "$app/environment";
	import { onMount } from "svelte";

	let showInstallPrompt = $state(false);
	let deferredPrompt: any = null;
	let isIOS = $state(false);
	let isStandalone = $state(false);

	onMount(() => {
		if (browser) {
			// Check if running as PWA
			isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
						   (window.navigator as any).standalone === true;

			// Detect iOS
			isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

			// Listen for the beforeinstallprompt event (Android/Chrome)
			window.addEventListener('beforeinstallprompt', (e) => {
				e.preventDefault();
				deferredPrompt = e;
				showInstallPrompt = true;
			});

			// For iOS, show manual install instructions if not installed
			if (isIOS && !isStandalone) {
				showInstallPrompt = true;
			}
		}
	});

	async function handleInstall() {
		if (deferredPrompt) {
			// Android/Chrome installation
			deferredPrompt.prompt();
			const { outcome } = await deferredPrompt.userChoice;
			
			if (outcome === 'accepted') {
				console.log('User accepted the install prompt');
				showInstallPrompt = false;
			}
			
			deferredPrompt = null;
		}
	}

	function dismissPrompt() {
		showInstallPrompt = false;
		// Store dismissal in localStorage to not show again for a while
		if (browser) {
			localStorage.setItem('pwa-install-dismissed', Date.now().toString());
		}
	}
</script>

{#if showInstallPrompt && !isStandalone}
	<div class="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
		<div class="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
			<div class="flex items-start gap-3">
				<div class="shrink-0 w-12 h-12 bg-black rounded-xl flex items-center justify-center">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
					</svg>
				</div>
				
				<div class="flex-1 min-w-0">
					<h3 class="text-sm font-semibold text-gray-900 mb-1">
						Install Shusseki
					</h3>
					
					{#if isIOS}
						<p class="text-xs text-gray-600 mb-2">
							Tap <svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg> Share, then "Add to Home Screen"
						</p>
					{:else}
						<p class="text-xs text-gray-600 mb-3">
							Install for quick access and offline use
						</p>
						<button
							onclick={handleInstall}
							class="w-full px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
						>
							Install App
						</button>
					{/if}
				</div>
				
				<button
					onclick={dismissPrompt}
					aria-label="Dismiss install prompt"
					class="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}
