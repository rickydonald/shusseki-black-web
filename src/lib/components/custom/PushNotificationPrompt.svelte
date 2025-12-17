<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		isPushSupported, 
		getPermissionStatus, 
		enablePushNotifications,
		wasPermissionAsked,
	} from '$lib/push/client';
	import Bell02Icon from '@untitled-theme/icons-svelte/Bell02Icon.svelte';
	import XIcon from '@untitled-theme/icons-svelte/XIcon.svelte';
	import CheckCircleIcon from '@untitled-theme/icons-svelte/CheckCircleIcon.svelte';
	import CalendarDateIcon from '@untitled-theme/icons-svelte/CalendarDateIcon.svelte';
	import AlertCircleIcon from '@untitled-theme/icons-svelte/AlertCircleIcon.svelte';

	let showPrompt = $state(false);
	let isSupported = $state(false);
	let permission = $state<NotificationPermission>('default');
	let isEnabling = $state(false);
	let isClosing = $state(false);

	onMount(() => {
		isSupported = isPushSupported();
		if (!isSupported) return;

		permission = getPermissionStatus();
		
		// Show prompt if:
		// 1. Push is supported
		// 2. Permission is default (not granted or denied)
		// 3. User hasn't been asked before
		if (permission === 'default' && !wasPermissionAsked()) {
			// Delay showing prompt for better UX - after user has seen attendance
			setTimeout(() => {
				showPrompt = true;
			}, 3000);
		}
	});

	async function handleEnableNotifications() {
		if (isEnabling) return;

		isEnabling = true;

		try {
			const result = await enablePushNotifications();
			
			if (result.success) {
				// Success - hide prompt with animation
				closePrompt();
			} else {
				// Failed or denied
				permission = result.permission || 'denied';
				closePrompt();
			}
		} catch (error) {
			console.error('[Push Prompt] Error:', error);
			closePrompt();
		} finally {
			isEnabling = false;
		}
	}

	function closePrompt() {
		isClosing = true;
		// Wait for animation to complete before hiding
		setTimeout(() => {
			showPrompt = false;
			isClosing = false;
		}, 300);
	}

	function handleDismiss() {
		closePrompt();
	}
</script>

{#if showPrompt && isSupported}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
		class:animate-fadeIn={!isClosing}
		class:animate-fadeOut={isClosing}
		onclick={handleDismiss}
		onkeydown={(e) => e.key === 'Escape' && handleDismiss()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="notification-prompt-title"
		tabindex="-1"
	>
		<!-- Modal Card -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div 
			class="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col"
			class:animate-slideUp={!isClosing}
			class:animate-slideDown={isClosing}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Header with gradient -->
			<div class="relative bg-linear-to-br from-gray-900 via-gray-800 to-black p-6 pb-6 shrink-0">
				<!-- Close Button -->
				<button
					onclick={handleDismiss}
					class="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all duration-200 group"
					aria-label="Close"
				>
					<XIcon class="w-5 h-5 text-white/80 group-hover:text-white" />
				</button>

				<!-- Icon -->
				<div class="flex justify-center mb-3">
					<div class="relative">
						<div class="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
						<div class="relative w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl">
							<Bell02Icon class="w-7 h-7 text-black" />
						</div>
					</div>
				</div>

				<!-- Title -->
				<h3 id="notification-prompt-title" class="text-xl font-bold text-white text-center mb-1">
					Stay Updated
				</h3>
				<p class="text-white/70 text-center text-sm">
					Never miss important updates
				</p>
			</div>

			<!-- Content -->
			<div class="p-5">
				<!-- Benefits Grid -->
				<div class="space-y-2.5 mb-4">
					<div class="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
						<div class="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
							<CheckCircleIcon class="w-5 h-5 text-blue-600" />
						</div>
						<div class="flex-1 pt-0.5">
							<h4 class="font-semibold text-gray-900 text-sm mb-0.5">Attendance Updates</h4>
							<p class="text-xs text-gray-600 leading-relaxed">Get notified when attendance is updated</p>
						</div>
					</div>

					<div class="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
						<div class="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
							<CalendarDateIcon class="w-5 h-5 text-purple-600" />
						</div>
						<div class="flex-1 pt-0.5">
							<h4 class="font-semibold text-gray-900 text-sm mb-0.5">Important Dates</h4>
							<p class="text-xs text-gray-600 leading-relaxed">Holidays, exams, and events</p>
						</div>
					</div>

					<div class="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
						<div class="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
							<AlertCircleIcon class="w-5 h-5 text-orange-600" />
						</div>
						<div class="flex-1 pt-0.5">
							<h4 class="font-semibold text-gray-900 text-sm mb-0.5">Critical Alerts</h4>
							<p class="text-xs text-gray-600 leading-relaxed">Timetable changes and announcements</p>
						</div>
					</div>
				</div>
				
				<!-- Privacy Notice -->
				<div class="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
					<svg class="w-4 h-4 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
					<p class="text-xs text-gray-600">
						Disable anytime in settings
					</p>
				</div>
			</div>

			<!-- Actions - Sticky Footer -->
			<div class="p-5 pt-3 bg-white border-t border-gray-100 shrink-0">
				<div class="space-y-2">
					<button
						onclick={handleEnableNotifications}
						disabled={isEnabling}
						class="w-full px-5 py-3 bg-black text-white text-sm rounded-xl font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10"
					>
						{isEnabling ? 'Enabling...' : 'Enable Notifications'}
					</button>
					<button
						onclick={handleDismiss}
						class="w-full px-5 py-2.5 text-gray-600 text-sm font-medium hover:bg-gray-50 rounded-xl transition-colors"
					>
						Maybe Later
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-fadeIn {
		animation: fadeIn 0.3s ease-out forwards;
	}

	.animate-fadeOut {
		animation: fadeOut 0.3s ease-in forwards;
	}

	.animate-slideUp {
		animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.animate-slideDown {
		animation: slideDown 0.3s cubic-bezier(0.6, 0, 0.8, 0.3) forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(100%) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes slideDown {
		from {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
		to {
			opacity: 0;
			transform: translateY(100%) scale(0.95);
		}
	}

	/* Mobile - Bottom sheet style */
	@media (max-width: 640px) {
		@keyframes slideUp {
			from {
				opacity: 0;
				transform: translateY(100%);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}

		@keyframes slideDown {
			from {
				opacity: 1;
				transform: translateY(0);
			}
			to {
				opacity: 0;
				transform: translateY(100%);
			}
		}
	}
</style>
