<script lang="ts">
	import { onMount } from "svelte";
	import PageHeader from "$lib/components/custom/PageHeader.svelte";
	import Bell02Icon from "@untitled-theme/icons-svelte/Bell02Icon.svelte";
	import InfoCircleIcon from "@untitled-theme/icons-svelte/InfoCircleIcon.svelte";
	import CheckCircleIcon from "@untitled-theme/icons-svelte/CheckCircleIcon.svelte";
	import Monitor01Icon from "@untitled-theme/icons-svelte/Monitor01Icon.svelte";
	import ClockCheckIcon from "@untitled-theme/icons-svelte/ClockCheckIcon.svelte";
	import { toast } from "svelte-sonner";
	import shiftTimings from "$lib/data/shift_timings.json";
    import { LogOut01Icon } from "@untitled-theme/icons-svelte";
    import { goto } from "$app/navigation";

	let isSupported = $state(false);
	let isSubscribed = $state(false);
	let permission = $state<NotificationPermission>("default");
	let deviceInfo = $state({
		browser: "",
		os: "",
		subscriptionDate: "",
		currentDeviceId: "",
	});
	let userDevices = $state<Array<{ deviceId: string; createdAt: string }>>(
		[],
	);
	let loadingDevices = $state(false);
	let cleaningUp = $state(false);

	// Shift preferences
	let currentShift = $state<number>(1);
	let loadingShift = $state(false);
	let updatingShift = $state(false);
	let lastShiftUpdateTime = $state<number>(0);
	const MIN_UPDATE_INTERVAL = 2000; // 2 seconds minimum between updates

	async function loadShiftPreference() {
		loadingShift = true;
		try {
			const response = await fetch("/api/v1/user/shift");
			const data = await response.json();

			if (data.status && data.shift) {
				currentShift = data.shift;
			}
		} catch (error) {
			console.error("Failed to load shift preference:", error);
		} finally {
			loadingShift = false;
		}
	}

	async function updateShiftPreference(newShift: number) {
		// Prevent updates if already updating or same shift
		if (updatingShift || newShift === currentShift) return;

		// Client-side rate limiting: prevent rapid clicks
		const now = Date.now();
		const timeSinceLastUpdate = now - lastShiftUpdateTime;

		if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
			const waitTime = Math.ceil(
				(MIN_UPDATE_INTERVAL - timeSinceLastUpdate) / 1000,
			);
			toast.error(
				`Please wait ${waitTime} second${waitTime > 1 ? "s" : ""} before changing shift again`,
			);
			return;
		}

		updatingShift = true;
		lastShiftUpdateTime = now;

		try {
			const response = await fetch("/api/v1/user/shift/update", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ shift: newShift }),
			});

			const data = await response.json();

			if (data.status) {
				currentShift = newShift;
				toast.success("Shift preference updated successfully");
			} else {
				if (data.errorCode === "rate_limit_exceeded") {
					const retryAfter = data.retryAfter || 60;
					toast.error(
						`Too many requests. Please wait ${retryAfter} seconds.`,
					);
				} else {
					toast.error(
						data.error || "Failed to update shift preference",
					);
				}
			}
		} catch (error) {
			console.error("Failed to update shift:", error);
			toast.error("Failed to update shift preference");
		} finally {
			updatingShift = false;
		}
	}

	function getShiftTimeRange(shift: number): string {
		const shiftKey = `shift${shift}` as "shift1" | "shift2";
		const periods = shiftTimings[shiftKey];
		if (!periods || periods.length === 0) return "";

		const firstPeriod = periods[0];
		const lastPeriod = periods[periods.length - 1];

		return `${firstPeriod.startTime} - ${lastPeriod.endTime}`;
	}

	function getBrowserName(ua: string): string {
		if (ua.includes("Firefox")) return "Firefox";
		if (ua.includes("Edg")) return "Edge";
		if (ua.includes("Chrome")) return "Chrome";
		if (ua.includes("Safari")) return "Safari";
		return "Unknown Browser";
	}

	function getOSName(ua: string): string {
		if (ua.includes("Win")) return "Windows";
		if (ua.includes("Mac")) return "macOS";
		if (ua.includes("Linux")) return "Linux";
		if (ua.includes("Android")) return "Android";
		if (ua.includes("iOS")) return "iOS";
		return "Unknown OS";
	}

	function formatDeviceId(deviceId: string): string {
		// Show first 8 and last 8 characters
		if (deviceId.length > 20) {
			return `${deviceId.substring(0, 12)}...${deviceId.substring(deviceId.length - 8)}`;
		}
		return deviceId;
	}

	function isCurrentDevice(deviceId: string): boolean {
		return deviceId === deviceInfo.currentDeviceId;
	}

	 function doLogout() {
        goto("/api/v1/user/logout");
    }
</script>

<PageHeader title="Settings" backUrl="/view/attendance" />

<div class="container mx-auto p-4 space-y-6 max-w-2xl pb-24">
	<!-- Shift Preference Card -->
	<div class="bg-white border border-gray-200 rounded-lg shadow-sm">
		<div class="p-6 border-b border-gray-200">
			<div class="flex items-center gap-2 mb-2">
				<ClockCheckIcon class="w-5 h-5" />
				<h2 class="text-xl font-semibold text-gray-900">Class Shift</h2>
			</div>
			<p class="text-sm text-gray-600">
				Select your preferred class shift timing
			</p>
		</div>
		<div class="p-6 space-y-4">
			{#if loadingShift}
				<div class="flex items-center justify-center py-8">
					<div
						class="animate-spin rounded-full h-8 w-8 border-b-2 border-black"
					></div>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<!-- Shift 1 -->
					<button
						onclick={() => updateShiftPreference(1)}
						disabled={updatingShift}
						class="relative p-4 border-2 rounded-lg transition-all duration-200 text-left disabled:opacity-50"
						class:border-black={currentShift === 1}
						class:bg-black={currentShift === 1}
						class:text-white={currentShift === 1}
						class:border-gray-300={currentShift !== 1}
						class:hover:border-gray-400={currentShift !== 1 &&
							!updatingShift}
					>
						<div class="flex items-start justify-between mb-2">
							<h3 class="text-lg font-semibold">Shift 1</h3>
							{#if currentShift === 1}
								<CheckCircleIcon class="w-5 h-5" />
							{/if}
						</div>
						<p class="text-sm opacity-80">Morning Shift</p>
						<p class="text-sm font-medium mt-2">
							{getShiftTimeRange(1)}
						</p>
					</button>

					<!-- Shift 2 -->
					<button
						onclick={() => updateShiftPreference(2)}
						disabled={updatingShift}
						class="relative p-4 border-2 rounded-lg transition-all duration-200 text-left disabled:opacity-50"
						class:border-black={currentShift === 2}
						class:bg-black={currentShift === 2}
						class:text-white={currentShift === 2}
						class:border-gray-300={currentShift !== 2}
						class:hover:border-gray-400={currentShift !== 2 &&
							!updatingShift}
					>
						<div class="flex items-start justify-between mb-2">
							<h3 class="text-lg font-semibold">Shift 2</h3>
							{#if currentShift === 2}
								<CheckCircleIcon class="w-5 h-5" />
							{/if}
						</div>
						<p class="text-sm opacity-80">Afternoon Shift</p>
						<p class="text-sm font-medium mt-2">
							{getShiftTimeRange(2)}
						</p>
					</button>
				</div>

				<div
					class="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
				>
					<InfoCircleIcon
						class="w-4 h-4 text-blue-600 mt-0.5 shrink-0"
					/>
					<p class="text-sm text-blue-800">
						Your shift preference helps us show you the correct
						class timings and attendance information.
					</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Logout Section -->
	<div class="bg-white border border-gray-200 rounded-lg shadow-sm">
		<div class="p-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Account</h2>
			<button
				onclick={doLogout}
				class="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 justify-center-safe"
			>
				<LogOut01Icon class="w-5 h-5" />
				<span>Logout</span>
			</button>
		</div>
	</div>
</div>
