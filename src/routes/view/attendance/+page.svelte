<script lang="ts">
	// ===== Imports =====
	import { browser } from "$app/environment";
	import AttendanceAccordion from "$lib/components/custom/AttendanceAccordion.svelte";
	import AttendanceCard from "$lib/components/custom/AttendanceCard.svelte";
	import AttendanceTable from "$lib/components/custom/AttendanceTable.svelte";
	import AttendanceSwitch from "$lib/components/custom/AttendanceSwitch.svelte";
	import TimetableSchedule from "$lib/components/custom/TimetableSchedule.svelte";
	import ReleaseNotes from "$lib/components/custom/ReleaseNotes.svelte";
	import ShiftSelectionModal from "$lib/components/custom/ShiftSelectionModal.svelte";
	import Footer from "$lib/components/custom/Footer.svelte";
	import Sidebar from "$lib/components/custom/Sidebar.svelte";
	import BirthdayCard from "$lib/components/custom/BirthdayCard.svelte";
	import FloatingBalloons from "$lib/components/custom/FloatingBalloons.svelte";
	import LifeSkillCard from "$lib/components/custom/LifeSkillCard.svelte";
	import ImpactCard from "$lib/components/custom/ImpactCard.svelte";
	import NoAttendanceData from "$lib/components/custom/NoAttendanceData.svelte";
	import Menu01Icon from "@untitled-theme/icons-svelte/Menu01Icon.svelte";
	import AlertTriangleIcon from "@untitled-theme/icons-svelte/AlertTriangleIcon.svelte";
	import ShussekiLogo from "$lib/components/icons/ShussekiLogo.svelte";
	import helpers from "$lib/helpers";
	import { BottomSheet } from "svelte-bottom-sheet";
	import { DateTime } from "luxon";
	import { onMount } from "svelte";
	import {
		getAttendanceRecommendation,
		type GeniusRecommendation,
	} from "$lib/models/impact-fragment";
	import {
		filterAttendance,
		type Filter,
	} from "$lib/models/filter-attendance";
	import ShussekiLogoWebp from "$lib/assets/shusseki-logo-512x512.webp";
	import { goto, invalidateAll } from "$app/navigation";
	import academicCalendar from "$lib/data/academic_calendar.json";
	import releaseNotesData from "$lib/data/release_notes.json";
	import {
		shouldShowReleaseNotes,
		getLastSeenVersion,
	} from "$lib/utils/version";
	import axios from "axios";
	import { toast } from "svelte-sonner";
	import { slide, fade } from "svelte/transition";
	import { cubicOut } from "svelte/easing";
	import { scrapperProfileStore, scrapperStore } from "$lib/stores/attendance-store";
	import { RefreshCw01Icon } from "@untitled-theme/icons-svelte";

	// ===== Props =====
	let { data } = $props();

	// ===== State Variables =====
	let scrapper = $derived($scrapperStore);
	let scrapperProfile = $derived($scrapperProfileStore);
	let isLoading: boolean = $state(false);
	let loadError: boolean = $state(false);
	let errorMessage: string = $state("");
	let isReauthenticating: boolean = $state(false);
	let showFullHeader = $derived(scrapper === null);

	// Release notes state
	let showReleaseNotes: boolean = $state(false);
	let currentRelease = $derived(
		releaseNotesData.releases.find(
			(r) => r.version === releaseNotesData.currentVersion,
		),
	);

	// Shift selection state
	let showShiftModal: boolean = $state(false);
	let userShift: number = $derived(data?.user?.shift ?? 0);

	// Sidebar state
	let isSidebarOpen: boolean = $state(false);

	// Birthday state
	let showBirthdayCard: boolean = $state(false);
	let isBirthday: boolean = $state(false);

	// Feedback prompt state
	let showFeedbackPrompt: boolean = $state(false);

	// function checkIfBirthday() {
	// 	if (!data?.user?.creds?.dateOfBirth) return false;

	// 	const today = DateTime.now().setZone("Asia/Kolkata");
	// 	const dob = data.user.creds.dateOfBirth;

	// 	const dobParts = dob.includes("-") ? dob.split("-") : [];
	// 	if (dobParts.length !== 3) return false;

	// 	const dobDay = parseInt(dobParts[2]);
	// 	const dobMonth = parseInt(dobParts[1]);

	// 	return today.day === dobDay && today.month === dobMonth;
	// }

	function isBirthdayCardShownToday() {
		if (typeof localStorage === "undefined") return false;
		const today = DateTime.now()
			.setZone("Asia/Kolkata")
			.toISO()
			?.split("T")[0];
		if (!today) return false;
		const lastShown = localStorage.getItem("birthdayCardShownDate");
		return lastShown === today;
	}
	function markBirthdayCardAsShown() {
		if (typeof localStorage !== "undefined") {
			const today = DateTime.now()
				.setZone("Asia/Kolkata")
				.toISO()
				?.split("T")[0];
			if (today) {
				localStorage.setItem("birthdayCardShownDate", today);
			}
		}
	}

	function shouldShowFeedbackPrompt() {
		if (!browser || typeof localStorage === "undefined") return false;
		const dismissed = localStorage.getItem("feedbackPromptDismissed");
		return dismissed !== "true";
	}

	function dismissFeedbackPrompt() {
		showFeedbackPrompt = false;
		if (browser && typeof localStorage !== "undefined") {
			localStorage.setItem("feedbackPromptDismissed", "true");
			console.log("Feedback prompt dismissed and saved to localStorage");
		}
	}

	onMount(() => {
		// Check if shift is not set
		if (userShift === 0) {
			showShiftModal = true;
		}

		loadAttendance();

		// Check if we should show release notes
		if (shouldShowReleaseNotes(releaseNotesData.currentVersion)) {
			showReleaseNotes = true;
		}

		// isBirthday = checkIfBirthday();
		// if (isBirthday && !isBirthdayCardShownToday()) {
		// 	setTimeout(() => {
		// 		showBirthdayCard = true;
		// 		markBirthdayCardAsShown();
		// 	}, 1000);
		// }

		// Check if we should show feedback prompt
		if (shouldShowFeedbackPrompt()) {
			setTimeout(() => {
				showFeedbackPrompt = true;
			}, 2000);
		}
	});

	async function handleShiftSelected(shift: number) {
		userShift = shift;
		showShiftModal = false;
		// Invalidate all data to refresh with updated JWT
		await invalidateAll();
	}

	let impact: GeniusRecommendation | null = $state(null);
	$effect(() => {
		if (scrapper?.data?.summary) {
			impact = getAttendanceRecommendation(scrapper.data.summary.hours);
		}
	});

	function groupAttendanceByMonth(
		attendance: Record<string, string[]>,
	): Record<string, Record<string, string[]>> {
		const grouped: Record<string, Record<string, string[]>> = {};

		for (const [date, statuses] of Object.entries(attendance)) {
			const month = new Date(date).toLocaleString("default", {
				month: "long",
				year: "numeric",
			});
			(grouped[month] ??= {})[date] = statuses;
		}

		return grouped;
	}

	let monthAttendance = $derived(() => {
		if (!scrapper?.data?.attendance) return {};
		return groupAttendanceByMonth(scrapper.data.attendance);
	});

	// ===== API Service Functions =====
	async function fetchAttendanceData() {
		return await axios.get("/api/v2/user/attendance/show", {
			headers: { "Content-Type": "application/json" },
		});
	}

	// ===== Error Handling Functions =====
	interface ErrorHandlerConfig {
		showToast?: boolean;
		toastId?: string | number;
		setErrorState?: boolean;
	}

	function getErrorMessage(err: unknown): string {
		if (!axios.isAxiosError(err)) {
			return "Unknown error occurred. Please try again.";
		}

		const status = err.response?.status;
		const serverMessage = err.response?.data?.error;

		if (!err.response) {
			return "Network error. Please check your connection.";
		}

		switch (status) {
			case 429:
				return "Too many requests. Please try again later.";
			case 400:
				return "Missing required information. Please log in again.";
			case 401:
			case 403:
				return "Session expired. Please log in again.";
			case 500:
				return (
					serverMessage ||
					"Failed to load attendance data. Please try again."
				);
			default:
				return `Error ${status || "Unknown"}: ${serverMessage || "An unexpected error occurred"}`;
		}
	}

	function handleErrorResponse(
		err: unknown,
		config: ErrorHandlerConfig = {},
	) {
		const { showToast = true, toastId, setErrorState = false } = config;

		console.error(err);

		const message = getErrorMessage(err);

		if (setErrorState) {
			errorMessage = message;
		}

		if (showToast) {
			const toastOptions = toastId
				? { id: toastId, duration: 4000 }
				: { duration: 4000 };
			toast.error(message, toastOptions);
		}

		// Handle redirect for auth errors
		if (axios.isAxiosError(err)) {
			const status = err.response?.status;
			if (status === 400 || status === 401 || status === 403) {
				const delay = status === 401 || status === 403 ? 3000 : 4000;
				setTimeout(() => goto("/login"), delay);
			}
		}
	}

	function resetErrorState() {
		loadError = false;
		errorMessage = "";
	}

	function setLoadingState(loading: boolean) {
		isLoading = loading;
	}

	// ===== Data Loading Functions =====
	async function loadAttendance() {
		if (scrapper) {
			showFullHeader = false;
			return;
		}

		setLoadingState(true);
		resetErrorState();
		
		const reauthTimer = setTimeout(() => {
			if (isLoading && !loadError) {
				isReauthenticating = true;
			}
		}, 3000);

		try {
			const { data } = await fetchAttendanceData();
			
			clearTimeout(reauthTimer);
			
			// Check if re-authentication occurred
			if (data.reauthenticated) {
				console.log("ERP session was re-authenticated");
			}
			isReauthenticating = false;
			
			scrapperStore.set(data.data.attendance);
			scrapperProfileStore.set(data.data.profile);
			setLoadingState(false);
			setTimeout(() => {
				showFullHeader = false;
			}, 350);
		} catch (err) {
			clearTimeout(reauthTimer);
			setLoadingState(false);
			isReauthenticating = false;
			loadError = true;
			handleErrorResponse(err, { setErrorState: true });
		}
	}

	async function doAttendanceRefresh() {
		setLoadingState(true);
		const toastId = toast.loading("Refreshing attendance data...");

		try {
			const { data } = await fetchAttendanceData();
			scrapperStore.set(data.data);
			resetErrorState();
			toast.success("Attendance data refreshed!", {
				id: toastId,
				duration: 1000,
			});
		} catch (err) {
			handleErrorResponse(err, { toastId });
		} finally {
			setLoadingState(false);
		}
	}

	// ===== Filter and UI State Management =====
	let openFilterBottomSheet = $state(false);
	let filteredAttendance: Filter | null = $state(null);
	let filterType: "Present" | "Absent" | "On Duty" | "Medical" | "Casual" =
		$state("Present");

	const STATUS_MAP = {
		Present: "P",
		Absent: "A",
		"On Duty": "OD",
		Medical: "ML",
		Casual: "CL",
	} as const;

	type AttendanceType = keyof typeof STATUS_MAP;

	// Calculate bottom sheet height based on content
	let bottomSheetHeight = $derived(() => {
		if (!filteredAttendance) return 0.5;

		const recordCount = Object.keys(
			filteredAttendance.records || {},
		).length;

		// Empty state - small height
		if (recordCount === 0) return 0.3;

		// Few records - medium height
		if (recordCount <= 5) return 0.5;

		// Many records - larger height but not full screen
		if (recordCount <= 15) return 0.7;

		// Lots of records - near full screen with scrolling
		return 0.85;
	});

	function handleAttendanceCardSelect(type: AttendanceType) {
		filterType = type;
		const status = STATUS_MAP[type];
		filteredAttendance = status
			? filterAttendance(scrapper?.data?.attendance ?? {}, { status })
			: null;
		openFilterBottomSheet = true;
	}

	// ===== Academic Calendar Functions =====
	function getTodayDate(): string {
		return DateTime.now().setZone("Asia/Kolkata").toFormat("dd.MM.yyyy");
	}

	function getDayOrder(): (typeof academicCalendar)[number] | null {
		const today = getTodayDate();
		return academicCalendar.find((entry) => entry.date === today) || null;
	}

	function getDayOrderDisplay(): string {
		const dayOrder = getDayOrder();
		if (dayOrder?.day_order === null) {
			return "Enjoy your day off. 😉";
		}
		const weekday = DateTime.now().setZone("Asia/Kolkata").weekdayLong;
		const dayNum = dayOrder?.day_order?.split("-")[1];
		return `It's ${weekday}, Day Order ${dayNum}`;
	}

	// ===== Display Mode Functions =====
	let attendanceDisplayMode: "percentage" | "hours" = $state("percentage");

	function handleAttendanceSwitchChange(value: "percentage" | "hours") {
		attendanceDisplayMode = value;
	}

	// ===== User Display Functions =====
	function getUserDisplayName(): string {
		return helpers.capitalizeWords(
			scrapperProfile?.name || "Student",
		);
	}

	function getUserFirstName(): string {
		const showSecondName = ["25-PPH-010", "25-UBU-074"].includes(
			data.user.userId
		);
		if (showSecondName) {
			return getUserDisplayName().split(" ")[1];
		}
		return getUserDisplayName().split(" ")[0];
	}

	function getCurrentDateDisplay(): string {
		return DateTime.now()
			.setZone("Asia/Kolkata")
			.toLocaleString(DateTime.DATE_MED);
	}

	function getGreeting(): string {
		return helpers.greet();
	}

	// ===== Grouped Attendance Data =====
	function groupFilteredAttendanceByMonth(
		records: Record<string, string[]>,
	): Record<string, [string, string[]][]> {
		return Object.entries(records).reduce(
			(acc, [date, statuses]) => {
				const monthKey = new Date(date).toLocaleString("en-GB", {
					month: "long",
					year: "numeric",
				});
				(acc[monthKey] ||= []).push([date, statuses]);
				return acc;
			},
			{} as Record<string, [string, string[]][]>,
		);
	}

	let storeFilterAttendance = $derived(() => {
		if (!filteredAttendance?.records) return {};
		return groupFilteredAttendanceByMonth(filteredAttendance.records);
	});
</script>

<main class="min-h-screen bg-black flex flex-col items-center overflow-hidden">
	<div class="sm:max-w-lg w-full min-h-screen relative flex flex-col">
		<section class="w-full px-4 bg-white overflow-hidden z-0 rounded-b-2xl">
			{#if showFullHeader}
				<div
					class="flex items-center justify-center h-screen"
					transition:slide={{ duration: 600, easing: cubicOut }}
				>
					{#if loadError}
						<div class="text-center px-6">
							<div class="mb-4">
								<AlertTriangleIcon
									width={64}
									height={64}
									class="mx-auto text-red-500"
								/>
							</div>
							<h2
								class="text-xl font-semibold text-gray-900 mb-2"
							>
								Failed to Load
							</h2>
							<div class="mb-6">
								<p class="text-sm text-gray-600 mb-2">
									Unable to load attendance data.
								</p>
								<div
									class="bg-red-50 border border-red-200 rounded-lg p-3 mt-3"
								>
									<p class="text-sm text-red-700">
										{errorMessage ||
											"Unknown error occurred"}
									</p>
								</div>
							</div>
							<button
								onclick={loadAttendance}
								disabled={isLoading}
								class="px-6 py-2.5 bg-black text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
							>
								{isLoading ? "Retrying..." : "Retry"}
							</button>
						</div>
					{:else if isReauthenticating}
						<div class="text-center px-6">
							<div class="mb-4 relative">
								<ShussekiLogo width={70} height={70} />
								<div class="absolute -bottom-2 left-1/2 -translate-x-1/2">
									<div class="flex gap-1">
										<div class="w-2 h-2 bg-gray-800 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
										<div class="w-2 h-2 bg-gray-800 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
										<div class="w-2 h-2 bg-gray-800 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
									</div>
								</div>
							</div>
							<div class="mt-8 space-y-2">
								<h2 class="text-xl font-semibold text-gray-900">
									Re-authenticating
								</h2>
								<p class="text-sm text-gray-600">
									Refreshing your ERP session...
								</p>
								<div class="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-medium">
									<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									<span>Please wait...</span>
								</div>
							</div>
						</div>
					{:else}
						<ShussekiLogo width={70} height={70} />
					{/if}
				</div>
			{:else}
				<div
					class="py-6 pt-6 pb-3 w-full"
					in:fade={{ duration: 400, delay: 200, easing: cubicOut }}
				>
					<div class="flex items-center justify-between mb-8 gap-3">
						<div class="flex items-center gap-3.5 min-w-0 flex-1">
							<div class="relative shrink-0">
								<img
									src={ShussekiLogoWebp}
									alt="avatar"
									class="rounded-2xl w-12 h-12 shadow-sm"
								/>
								{#if isBirthday}
									<div
										class="absolute -top-1 -right-1 text-2xl animate-bounce"
									>
										🎉
									</div>
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-xs text-gray-500 leading-tight">
									{#if isBirthday}
										🎂 Happy Birthday!
									{:else}
										Welcome back
									{/if}
								</p>
								<p
									class="text-base font-bold text-gray-800 mt-0.5 truncate"
									title={getUserDisplayName()}
								>
									{getUserDisplayName()}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2 shrink-0">
							<button
								onclick={doAttendanceRefresh}
								disabled={isLoading}
								class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
								aria-label="Refresh attendance"
							>
								<span class:animate-spin={isLoading}>
									<RefreshCw01Icon class="w-5 h-5" />
								</span>
							</button>
							<button
								onclick={() => (isSidebarOpen = true)}
								class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800 text-white hover:bg-gray-800 active:scale-95 transition-all shadow-sm"
								aria-label="Open menu"
							>
								<Menu01Icon class="w-5 h-5" />
							</button>
						</div>
					</div>

					<div class="space-y-1.5">
						<!-- <p class="text-xs text-gray-500 font-medium">
							{getCurrentDateDisplay()} | SRGM
						</p> -->
						<h1 class="text-xl font-bold text-gray-900">
							{getGreeting()}
							{getUserFirstName()}!
						</h1>
						<h1 class="text-2xl font-bold text-gray-900">
							{getDayOrderDisplay()}
						</h1>
					</div>

					{#if scrapper?.data?.student.registerNumber}
						<div class="mt-5">
							<TimetableSchedule
								userId={scrapper.data.student.registerNumber}
								shift={userShift}
							/>
						</div>
					{/if}
				</div>
			{/if}
		</section>

		{#if !showFullHeader}
			<div
				class="flex-1"
				in:slide={{ duration: 400, delay: 250, easing: cubicOut }}
			>
				{#if scrapper?.data?.summary}
					<AttendanceSwitch
						value={attendanceDisplayMode}
						onclick={handleAttendanceSwitchChange}
					/>

					<section class="w-full grid grid-cols-2 gap-1 my-1">
						<AttendanceCard
							onclick={() =>
								handleAttendanceCardSelect("Present")}
							type="Present"
							value={scrapper.data.summary}
							labelType={attendanceDisplayMode}
						/>
						<AttendanceCard
							onclick={() => handleAttendanceCardSelect("Absent")}
							type="Absent"
							value={scrapper.data.summary}
							labelType={attendanceDisplayMode}
						/>
					</section>

					{#if scrapper.data.summary.hours.onduty > 0 || scrapper.data.summary.hours.medical > 0 || scrapper.data.summary.hours.casual > 0}
						<section class="w-full grid grid-cols-3 gap-1">
							<AttendanceCard
								onclick={() =>
									handleAttendanceCardSelect("On Duty")}
								type="On Duty"
								value={scrapper.data.summary}
								labelType={attendanceDisplayMode}
							/>
							<AttendanceCard
								onclick={() =>
									handleAttendanceCardSelect("Medical")}
								type="Medical"
								value={scrapper.data.summary}
								labelType={attendanceDisplayMode}
							/>
							<AttendanceCard
								onclick={() =>
									handleAttendanceCardSelect("Casual")}
								type="Casual"
								value={scrapper.data.summary}
								labelType={attendanceDisplayMode}
							/>
						</section>
					{/if}
					<!-- Impact Recommendation Section -->
					{#if impact}
						<ImpactCard {impact} />
					{/if}
					<!-- LifeSkill Attendance Section -->
					{#if scrapper.data.lifeSkill && scrapper.data.lifeSkill.totalRows > 0}
						<section class="w-full mt-1">
							<LifeSkillCard
								lifeSkill={scrapper.data.lifeSkill}
								onclick={() => {
									const lifeSkillEntries =
										scrapper?.data?.lifeSkill.entries ?? {};
									const convertedRecords: Record<
										string,
										string[]
									> = {};
									const counts: Record<string, number> = {};
									let total = 0;

									for (const [date, status] of Object.entries(
										lifeSkillEntries,
									)) {
										convertedRecords[date] = [status];
										if (status) {
											counts[status] =
												(counts[status] || 0) + 1;
											total++;
										}
									}

									filteredAttendance = {
										records: convertedRecords,
										counts,
										total,
									};
									filterType = "Present";
									openFilterBottomSheet = true;
								}}
							/>
						</section>
					{/if}
					<section class="mt-1 w-full">
						{#each Object.entries(monthAttendance()) as [month, dates], idx (month)}
							<AttendanceAccordion
								headerTitle={month}
								isOpen={idx === 0}
								className="mt-1"
							>
								<AttendanceTable data={dates} />
							</AttendanceAccordion>
						{/each}
					</section>
				{:else}
					<NoAttendanceData
						{isLoading}
						onCheckAgain={loadAttendance}
					/>
				{/if}
			</div>

			<!-- Footer -->
			<Footer onWhatsNewClick={() => (showReleaseNotes = true)} />
		{/if}

		{#if browser}
			<BottomSheet
				bind:isSheetOpen={openFilterBottomSheet}
				settings={{
					contentAlignment: "start-fit",
					maxHeight: bottomSheetHeight(),
				}}
			>
				<BottomSheet.Overlay>
					<BottomSheet.Sheet>
						<BottomSheet.Handle />
						<BottomSheet.Content class="p-4 w-full">
							<h1 class="text-xl font-semibold mb-2">
								{filterType}
							</h1>
							{#if filteredAttendance?.total === 0}
								<p class="text-gray-500 mt-2 mb-4">
									You have no records for {filterType} attendance.
								</p>
							{:else}
								<div class="mt-4 pb-2 overflow-y-auto">
									<AttendanceTable
										data={filteredAttendance?.records}
									/>
								</div>
							{/if}
						</BottomSheet.Content>
					</BottomSheet.Sheet>
				</BottomSheet.Overlay>
			</BottomSheet>
		{/if}
	</div>
</main>

<!-- Release Notes Modal -->
{#if currentRelease}
	<ReleaseNotes
		bind:open={showReleaseNotes}
		releaseData={currentRelease}
		previousVersion={getLastSeenVersion() || undefined}
	/>
{/if}

<!-- Shift Selection Modal -->
<ShiftSelectionModal
	bind:open={showShiftModal}
	onShiftSelected={handleShiftSelected}
/>

<!-- Sidebar -->
<Sidebar bind:isOpen={isSidebarOpen} onClose={() => (isSidebarOpen = false)} />

<!-- Birthday Card -->
{#if showBirthdayCard && isBirthday}
	<BirthdayCard
		userName={getUserDisplayName()}
		onClose={() => (showBirthdayCard = false)}
	/>
{/if}

<!-- Floating Balloons -->
{#if isBirthday}
	<FloatingBalloons isVisible={isBirthday} />
{/if}
