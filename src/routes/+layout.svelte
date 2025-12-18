<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/shusseki-logo-512x512.webp";
	import BottomTab from "$lib/components/custom/BottomTab.svelte";
	import PwaInstallPrompt from "$lib/components/custom/PwaInstallPrompt.svelte";
	import { page } from "$app/state";
	import { Toaster, toast } from "svelte-sonner";
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
    import { Constants } from "$lib/constants";

	let { children } = $props();

	// PWA Update Handler
	let pushRegistrationRequested = false;
	let lastUserId: string | null = null;
	let isProcessingLogin = false;

	$effect(() => {
		if (!browser) return;

		const currentUserId = page?.data?.user?.userId;

		if (!currentUserId) {
			// User logged out
			if (lastUserId) {
				lastUserId = null;
				isProcessingLogin = false;
			}
			pushRegistrationRequested = false;
			return;
		}

		// User logged in or switched
		if (currentUserId !== lastUserId && !isProcessingLogin) {
			isProcessingLogin = true;
			lastUserId = currentUserId;
			
		}

		if (
			!pushRegistrationRequested &&
			currentUserId === lastUserId &&
			!isProcessingLogin
		) {
			pushRegistrationRequested = true;
		
		}
	});

	onMount(async () => {
		if (browser && "serviceWorker" in navigator) {
			try {
				const { registerSW } = await import("virtual:pwa-register");

				registerSW({
					immediate: false,
					onRegistered(r: any) {
						console.log("PWA Service Worker registered:", r);
					},
					onRegisterError(error: any) {
						console.error(
							"PWA Service Worker registration error:",
							error,
						);
					},
					onNeedRefresh() {
						console.log("PWA needs refresh");
					},
					onOfflineReady() {
						console.log("PWA offline ready");
					},
				});

				// Listen for push notification lifecycle events
				
			} catch (error) {
				console.log("PWA registration not available:", error);
			}
		}
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		rel="preconnect"
		href="https://fonts.gstatic.com"
		crossorigin="anonymous"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
		rel="stylesheet"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@600&display=swap"
		rel="stylesheet"
	/>
	<link rel="icon" href={favicon} />
	<title>{Constants._SITE.NAME}</title>
	<link rel="apple-touch-icon" href="/splash_screens/icon.png" />
</svelte:head>

{@render children()}

<!-- Push Notification Permission Prompt - Only on attendance page -->
<!-- {#if page?.data?.user && page.url.pathname === "/view/attendance"}
	<PushNotificationPrompt />
{/if} -->

<!-- <PwaInstallPrompt /> -->

<Toaster
	mobileOffset={{ bottom: "30px" }}
	position="top-center"
	visibleToasts={5}
	toastOptions={{
		class: "rounded-full! px-[20px]!",
		style: "border-radius: 100px;padding-left: 20px;padding-right: 20px;border: 0;-webkit-backdrop-filter: blur(7px);backdrop-filter: blur(7px);background-color: rgba(232, 232, 237, 0.7);box-shadow: inset 0 0 1px rgba(0, 0, 0, 0.11);color: rgb(29, 29, 31);opacity: 1;",
	}}
/>
