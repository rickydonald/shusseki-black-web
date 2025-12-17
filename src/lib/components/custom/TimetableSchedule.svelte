<script lang="ts">
    import { browser } from "$app/environment";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";
    import CalendarPlus02Icon from "@untitled-theme/icons-svelte/CalendarPlus02Icon.svelte";
    import Edit05Icon from "@untitled-theme/icons-svelte/Edit05Icon.svelte";
    import clientDb from "$lib/models/client-db";
    import type { ClassTimetable } from "$lib/models/client-db";
    import TimetableUpdateModal from "$lib/components/custom/TimetableUpdateModal.svelte";
    import academicCalendar from "$lib/data/academic_calendar.json";
    import shiftTimings from "$lib/data/shift_timings.json";
    import { DateTime } from "luxon";
    import CupOutlineWhite from '$lib/assets/cafe-outline-white.svg'

    interface Props {
        userId: string;
        shift: number;
    }

    let { userId, shift }: Props = $props();

    // ===== State =====
    let classTimetable: ClassTimetable | null = $state(null);
    let isSyncingTimetable = $state(false);
    let showImportPrompt = $state(false);
    let serverTimetableData: any = $state(null);
    let showUpdateModal = $state(false);
    let pendingUpdateData: any = $state(null);
    let scrollContainer: HTMLDivElement | null = $state(null);
    let currentPeriodIndex = $state<number | null>(null);
    let timeUpdateInterval: number | null = null;

    // ===== Academic Calendar Functions =====
    function getTodayDate(): string {
        return DateTime.now().setZone("Asia/Kolkata").toFormat("dd.MM.yyyy");
    }

    function getDayOrder(): (typeof academicCalendar)[number] | null {
        const today = getTodayDate();
        return academicCalendar.find((entry) => entry.date === today) || null;
    }

    function getCurrentPeriod(): number | null {
        if (!shift || (shift !== 1 && shift !== 2)) return null;

        const now = DateTime.now().setZone("Asia/Kolkata");
        const timings = shift === 1 ? shiftTimings.shift1 : shiftTimings.shift2;

        for (let i = 0; i < timings.length; i++) {
            const timing = timings[i];
            if (!timing.isBreak) {
                // Parse times properly for accurate comparison
                const [startHour, startMin] = timing.startTime.split(':').map(Number);
                const [endHour, endMin] = timing.endTime.split(':').map(Number);
                
                const startTime = now.set({ hour: startHour, minute: startMin, second: 0 });
                const endTime = now.set({ hour: endHour, minute: endMin, second: 0 });
                
                if (now >= startTime && now <= endTime) {
                    // Return the actual period number (accounting for break)
                    const periodsBeforeBreak = timings
                        .slice(0, i)
                        .filter((t) => !t.isBreak).length;
                    return periodsBeforeBreak + 1;
                }
            }
        }

        return null;
    }

    function updateCurrentPeriod() {
        const newPeriod = getCurrentPeriod();
        if (newPeriod !== currentPeriodIndex) {
            const oldPeriod = currentPeriodIndex;
            currentPeriodIndex = newPeriod;
            
            // If period changed and we have a new current period, scroll to it
            if (newPeriod !== null && oldPeriod !== null && scrollContainer) {
                setTimeout(() => {
                    const currentCard = scrollContainer?.querySelector(
                        `[data-period="${newPeriod}"]`,
                    );
                    if (currentCard) {
                        currentCard.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest",
                            inline: "center",
                        });
                    }
                }, 100);
            }
        }
    }

    function isCurrentBreak(): boolean {
        if (!shift || (shift !== 1 && shift !== 2)) return false;

        const now = DateTime.now().setZone("Asia/Kolkata");
        const timings = shift === 1 ? shiftTimings.shift1 : shiftTimings.shift2;

        const breakPeriod = timings.find((t) => t.isBreak);
        if (breakPeriod) {
            const [startHour, startMin] = breakPeriod.startTime.split(':').map(Number);
            const [endHour, endMin] = breakPeriod.endTime.split(':').map(Number);
            
            const startTime = now.set({ hour: startHour, minute: startMin, second: 0 });
            const endTime = now.set({ hour: endHour, minute: endMin, second: 0 });
            
            return now >= startTime && now <= endTime;
        }

        return false;
    }

    function getBreakTiming(): { startTime: string; endTime: string } | null {
        if (!shift || (shift !== 1 && shift !== 2)) return null;
        
        const timings = shift === 1 ? shiftTimings.shift1 : shiftTimings.shift2;
        const breakPeriod = timings.find((t) => t.isBreak);
        
        if (breakPeriod) {
            return {
                startTime: breakPeriod.startTime,
                endTime: breakPeriod.endTime
            };
        }
        
        return null;
    }

    function isCurrentPeriod(index: number): boolean {
        return currentPeriodIndex !== null && currentPeriodIndex === index + 1;
    }

    function getTimingForPeriod(
        index: number,
    ): { startTime: string; endTime: string } | null {
        if (!shift || (shift !== 1 && shift !== 2)) return null;

        const timings = shift === 1 ? shiftTimings.shift1 : shiftTimings.shift2;
        const classPeriods = timings.filter((t) => !t.isBreak);

        if (index < classPeriods.length) {
            return {
                startTime: classPeriods[index].startTime,
                endTime: classPeriods[index].endTime,
            };
        }

        return null;
    }

    function formatTime(time: string): string {
        const [hours, minutes] = time.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    onMount(() => {
        // Initialize current period
        updateCurrentPeriod();

        // Auto-scroll to current class after a short delay
        setTimeout(() => {
            if (currentPeriodIndex !== null && scrollContainer) {
                const currentCard = scrollContainer.querySelector(
                    `[data-period="${currentPeriodIndex}"]`,
                );
                if (currentCard) {
                    currentCard.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                        inline: "center",
                    });
                }
            }
        }, 300);

        // Update current period every 30 seconds
        timeUpdateInterval = window.setInterval(() => {
            updateCurrentPeriod();
        }, 30000); // Check every 30 seconds

        // Cleanup on unmount
        return () => {
            if (timeUpdateInterval) {
                clearInterval(timeUpdateInterval);
            }
        };
    });

    // ===== Timetable Functions =====
    async function getClassTimetable() {
        if (!browser || !userId) return;

        const classCode = userId.substring(0, 8);

        try {
            // 1. Check local database first
            const localTimetable = await clientDb.classTimetable.get(classCode);

            if (localTimetable) {
                classTimetable = localTimetable;
                console.log("✅ Timetable loaded from local database");

                // Check for updates in the background
                checkForTimetableUpdates(classCode, localTimetable);
                return;
            }

            // 2. Not found locally, fetch from server
            console.log("📡 Fetching timetable from server...");
            isSyncingTimetable = true;

            const response = await fetch("/api/v1/user/timetable/get", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                const result = await response.json();

                if (result.response && result.data) {
                    // Always sync for the class - any classmate can update
                    const timetableData: ClassTimetable = {
                        class_code: result.data.class_code,
                        timetable:
                            typeof result.data.timetable === "string"
                                ? result.data.timetable
                                : JSON.stringify(result.data.timetable),
                        isActive: result.data.isActive,
                        lastSyncedAt: new Date().toISOString(),
                        localVersion: 1,
                    };

                    await clientDb.classTimetable.put(timetableData);
                    classTimetable = timetableData;

                    console.log("✅ Timetable synced from class");
                    toast.success("Timetable synced successfully");
                }
            } else if (response.status === 404) {
                console.log("ℹ️ No timetable found on server");
            } else {
                console.error("Failed to fetch timetable:", response.status);
            }
        } catch (error) {
            console.error("Error fetching timetable:", error);
        } finally {
            isSyncingTimetable = false;
        }
    }

    async function checkForTimetableUpdates(
        classCode: string,
        localTimetable: ClassTimetable,
    ) {
        try {
            const response = await fetch("/api/v1/user/timetable/get", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                const result = await response.json();

                if (result.response && result.data) {
                    // Check if there's an update from anyone in the class
                    const serverUpdatedAt = result.data.updatedAt;
                    const localLastSynced = localTimetable.lastSyncedAt;

                    // Compare timestamps - if server is newer, check content
                    if (serverUpdatedAt && localLastSynced && serverUpdatedAt > localLastSynced) {
                        const serverTimetableStr =
                            typeof result.data.timetable === "string"
                                ? result.data.timetable
                                : JSON.stringify(result.data.timetable);

                        if (serverTimetableStr !== localTimetable.timetable) {
                            console.log("🔔 Timetable update available from classmate");
                            pendingUpdateData = result.data;
                            showUpdateModal = true;
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error checking for updates:", error);
        }
    }

    async function importTimetable() {
        if (!serverTimetableData || !userId) return;

        try {
            const classCode = userId.substring(0, 8);

            const timetableData: ClassTimetable = {
                class_code: classCode,
                timetable:
                    typeof serverTimetableData.timetable === "string"
                        ? serverTimetableData.timetable
                        : JSON.stringify(serverTimetableData.timetable),
                isActive: true,
                lastSyncedAt: new Date().toISOString(),
                localVersion: 1,
            };

            await clientDb.classTimetable.put(timetableData);
            classTimetable = timetableData;
            showImportPrompt = false;

            console.log("✅ Timetable imported successfully");
            toast.success("Timetable imported successfully");
        } catch (error) {
            console.error("Error importing timetable:", error);
            toast.error("Failed to import timetable");
        }
    }

    function handleUpdateAccepted() {
        // Reload timetable
        getClassTimetable();
        toast.success("Timetable updated!");
    }

    function handleUpdateRejected() {
        pendingUpdateData = null;
    }

    function getTodaySubjects(): string[] {
        if (!classTimetable?.timetable) return [];

        try {
            const dayOrder = getDayOrder();
            if (!dayOrder?.day_order) return [];

            const dayNum = dayOrder.day_order.split("-")[1];
            const dayKey = `day_${dayNum}`;

            const parsedTimetable = JSON.parse(classTimetable.timetable);
            return parsedTimetable[dayKey] || [];
        } catch (error) {
            console.error("Error parsing timetable:", error);
            return [];
        }
    }

    $effect(() => {
        getClassTimetable();
    });
</script>

{#if classTimetable && getTodaySubjects().length > 0}
    <div class="mt-5 space-y-3">
        <div class="flex items-center justify-between px-1">
            <h3 class="text-[15px] font-semibold text-gray-900">
                Today's Schedule
            </h3>
            <div class="flex items-center gap-1">
                <a
                    href="/view/edit-timetable"
                    class="p-1.5 rounded-full bg-gray-100 active:scale-95 transition-all"
                    aria-label="Edit timetable"
                >
                    <Edit05Icon class="w-4 h-4 text-gray-600" />
                </a>
                <span
                    class="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full"
                >
                    {getTodaySubjects().length}
                    {getTodaySubjects().length === 1 ? "class" : "classes"}
                </span>
            </div>
        </div>

        <!-- Horizontal Scrollable Container -->
        <div class="relative -mx-4 px-4">
            <div
                bind:this={scrollContainer}
                class="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
            >
                {#each getTodaySubjects() as subject, index}
                    {@const timing = getTimingForPeriod(index)}
                    {@const isCurrent = isCurrentPeriod(index)}
                    {@const breakTiming = getBreakTiming()}
                    {@const isBreakTime = isCurrentBreak()}
                    
                    <!-- Show break card after period 3 (index 2) if it's break time -->
                    {#if index === 3 && isBreakTime && breakTiming}
                        <div
                            data-period="break"
                            class="shrink-0 w-[280px] snap-start rounded-[20px] p-5 border bg-amber-500 transition-all duration-300"
                        >
                            <div class="flex items-center mb-2 gap-1.5">
                                <img src={CupOutlineWhite} alt="Break" class="w-6 h-6" />
                                <div class="gap-2.5">
                                    <h4 class="text-[16px] font-semibold leading-snug mb-0 mt-0 text-white">
                                        Break Time
                                    </h4>
                                </div>
                            </div>
                            <div class="flex items-center gap-2 mt-0">
                                <svg
                                    class="w-4 h-4 text-white/80"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span class="text-[13px] font-medium text-white/90">
                                    {formatTime(breakTiming.startTime)} - {formatTime(breakTiming.endTime)}
                                </span>
                            </div>
                            <div class="mt-3 pt-3 border-t border-white/20">
                                <div class="flex items-center gap-1.5">
                                    <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    <span class="text-[12px] font-semibold text-white">
                                        In Progress
                                    </span>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <div
                        data-period={index + 1}
                        class="shrink-0 w-[280px] snap-start rounded-[20px] p-5 border transition-all duration-300 {isCurrent
                            ? 'bg-blue-500'
                            : 'bg-white border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]'}"
                    >
                        <div class="flex items-start justify-between mb-2">
                            <div class=" gap-2.5">
                                <!-- <div
                                    class="w-7 h-7 rounded-full flex items-center justify-center"
                                    class:bg-white={isCurrent}
                                    class:bg-gray-800={!isCurrent}
                                >
                                    <span
                                        class="font-semibold text-[13px]"
                                        class:text-blue-600={isCurrent}
                                        class:text-white={!isCurrent}
                                    >
                                        {index + 1}
                                    </span>
                                </div> -->
                                <h4
                                    class="text-[16px] font-semibold leading-snug mb-0 mt-0"
                                    class:text-white={isCurrent}
                                    class:text-gray-900={!isCurrent}
                                >
                                    {index + 1} • {subject}
                                </h4>
                            </div>
                        </div>
                        {#if timing}
                            <div class="flex items-center gap-2 mt-0">
                                <svg
                                    class="w-4 h-4 {isCurrent
                                        ? 'text-white/80'
                                        : 'text-gray-500'}"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span
                                    class="text-[13px] font-medium {isCurrent
                                        ? 'text-white/90'
                                        : 'text-gray-600'}"
                                >
                                    {formatTime(timing.startTime)} - {formatTime(
                                        timing.endTime,
                                    )}
                                </span>
                            </div>
                        {/if}
                        {#if isCurrent}
                            <div class="mt-3 pt-3 border-t border-white/20">
                                <div class="flex items-center gap-1.5">
                                    <div
                                        class="w-2 h-2 bg-white rounded-full animate-pulse"
                                    ></div>
                                    <span
                                        class="text-[12px] font-semibold text-white"
                                    >
                                        In Progress
                                    </span>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>

            <!-- Scroll Indicators (subtle) -->
            <!-- <div
                class="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-full bg-linear-to-l from-white to-transparent pointer-events-none"
            ></div> -->
        </div>

        <!-- Swipe indicator below cards -->
        {#if getTodaySubjects().length > 1}
            <div
                class="flex items-center justify-center gap-1.5 mt-0 animate-pulse"
            >
                <span class="text-[11px] font-medium text-gray-500">
                    Swipe to see more
                </span>
                <svg
                    class="w-3.5 h-3.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                </svg>
            </div>
        {/if}
    </div>
{:else if classTimetable}
    <div
        class="mt-5 bg-gray-50/50 rounded-[20px] p-5 border border-gray-200/50"
    >
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 text-gray-500">
                <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <p class="text-[14px] font-medium">
                    No classes scheduled for today
                </p>
            </div>
            <a
                href="/view/edit-timetable"
                class="p-1.5 rounded-full bg-white active:scale-95 transition-all border border-gray-200"
                aria-label="Edit timetable"
            >
                <Edit05Icon class="w-4 h-4 text-gray-600" />
            </a>
        </div>
    </div>
{:else if isSyncingTimetable}
    <div
        class="mt-5 bg-gray-50/50 rounded-[20px] p-5 border border-gray-200/50"
    >
        <div class="flex items-center justify-center gap-2.5 text-gray-500">
            <svg
                class="w-5 h-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
            </svg>
            <p class="text-[14px] font-medium">Syncing timetable...</p>
        </div>
    </div>
{/if}

{#if showImportPrompt}
    <div
        class="mt-5 bg-blue-50/50 rounded-[20px] p-5 border border-blue-200/50"
    >
        <div class="space-y-3">
            <div class="flex items-start gap-3">
                <svg
                    class="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <div class="flex-1">
                    <h4 class="text-[14px] font-semibold text-gray-900 mb-1">
                        Timetable Available
                    </h4>
                    <p class="text-[13px] text-gray-600 leading-relaxed">
                        A timetable from your class is available. Import it to
                        get started quickly.
                    </p>
                </div>
            </div>
            <div class="flex gap-2">
                <button
                    onclick={importTimetable}
                    class="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-[13px] font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all"
                >
                    Import Timetable
                </button>
                <button
                    onclick={() => (showImportPrompt = false)}
                    class="px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                    Dismiss
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Timetable Update Modal -->
<TimetableUpdateModal
    bind:open={showUpdateModal}
    serverTimetable={pendingUpdateData}
    localTimetable={classTimetable}
    classCode={userId.substring(0, 8)}
    onAccept={handleUpdateAccepted}
    onReject={handleUpdateRejected}
    onClose={() => (showUpdateModal = false)}
/>

{#if !classTimetable && !showImportPrompt}
    <a
        href="/view/add-timetable"
        class="border border-gray-200/80 rounded-2xl mt-5 p-3.5 w-full flex items-center justify-center gap-2.5 hover:bg-gray-50/50 active:scale-[0.98] transition-all duration-200"
    >
        <CalendarPlus02Icon class="w-[18px] h-[18px] text-gray-600" />
        <span class="text-[14px] font-semibold text-gray-700"
            >Add Timetable</span
        >
    </a>
{/if}

<style>
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
