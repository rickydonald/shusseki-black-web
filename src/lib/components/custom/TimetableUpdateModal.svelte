<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { toast } from "svelte-sonner";
    import clientDb from "$lib/models/client-db";
    import type { ClassTimetable } from "$lib/models/client-db";
    import CheckCircleIcon from "@untitled-theme/icons-svelte/CheckCircleIcon.svelte";
    import XCloseIcon from "@untitled-theme/icons-svelte/XCloseIcon.svelte";

    interface Props {
        open: boolean;
        serverTimetable: any;
        localTimetable: ClassTimetable | null;
        classCode: string;
        onAccept: () => void;
        onReject: () => void;
        onClose: () => void;
    }

    let { 
        open = $bindable(),
        serverTimetable,
        localTimetable,
        classCode,
        onAccept,
        onReject,
        onClose
    }: Props = $props();

    function parseDay(timetableData: any, dayKey: string): string[] {
        try {
            const parsed = typeof timetableData === "string" 
                ? JSON.parse(timetableData) 
                : timetableData;
            return parsed[dayKey] || [];
        } catch {
            return [];
        }
    }

    function getDayChanges(dayNum: number): { added: string[], removed: string[], changed: boolean } {
        const dayKey = `day_${dayNum}`;
        const serverDay = parseDay(serverTimetable.timetable, dayKey);
        const localDay = localTimetable ? parseDay(localTimetable.timetable, dayKey) : [];

        const added = serverDay.filter((s, i) => s !== localDay[i] && s.trim() !== "");
        const removed = localDay.filter((s, i) => s !== serverDay[i] && s.trim() !== "");
        
        return {
            added,
            removed,
            changed: JSON.stringify(serverDay) !== JSON.stringify(localDay)
        };
    }

    let isUpdating = $state(false);

    async function acceptUpdate() {
        isUpdating = true;
        try {
            const timetableData: ClassTimetable = {
                class_code: classCode,
                timetable: typeof serverTimetable.timetable === "string"
                    ? serverTimetable.timetable
                    : JSON.stringify(serverTimetable.timetable),
                isActive: true,
                lastSyncedAt: new Date().toISOString(),
                localVersion: (localTimetable?.localVersion || 0) + 1
            };

            await clientDb.classTimetable.put(timetableData);
            toast.success("Timetable updated successfully!");
            onAccept();
            open = false;
        } catch (error) {
            console.error("Error accepting update:", error);
            toast.error("Failed to update timetable");
        } finally {
            isUpdating = false;
        }
    }

    async function rejectUpdate() {
        toast.info("Keeping your current timetable");
        onReject();
        open = false;
    }
</script>

{#if open}
    <!-- Backdrop -->
    <button
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-100"
        transition:fade={{ duration: 200 }}
        onclick={onClose}
        aria-label="Close modal"
    ></button>

    <!-- Modal -->
    <div
        class="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-white rounded-3xl shadow-2xl z-110 max-h-[80vh] overflow-hidden flex flex-col"
        transition:slide={{ duration: 300, easing: cubicOut }}
    >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-200">
            <div class="flex items-start justify-between">
                <div>
                    <h2 class="text-xl font-bold text-gray-900">Timetable Update</h2>
                    <p class="text-sm text-gray-600 mt-1">
                        Your classmate updated the timetable
                    </p>
                </div>
                <button
                    onclick={onClose}
                    class="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <XCloseIcon class="w-5 h-5 text-gray-500" />
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-6 py-5">
            <div class="space-y-4">
                {#each Array(6) as _, dayIndex}
                    {@const changes = getDayChanges(dayIndex + 1)}
                    {#if changes.changed}
                        <div class="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                            <h3 class="text-sm font-bold text-gray-900 mb-3">
                                Day {dayIndex + 1}
                            </h3>
                            
                            <div class="space-y-3">
                                {#if changes.added.length > 0}
                                    <div>
                                        <p class="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                                            Added/Changed
                                        </p>
                                        <div class="space-y-1.5">
                                            {#each changes.added as subject}
                                                <div class="flex items-center gap-2 text-sm">
                                                    <div class="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                                                    <span class="text-gray-900 font-medium">{subject}</span>
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}

                                {#if changes.removed.length > 0}
                                    <div>
                                        <p class="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
                                            Removed
                                        </p>
                                        <div class="space-y-1.5">
                                            {#each changes.removed as subject}
                                                <div class="flex items-center gap-2 text-sm">
                                                    <div class="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                                                    <span class="text-gray-500 line-through">{subject}</span>
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>

            {#if serverTimetable.updatedAt}
                <p class="text-xs text-gray-500 text-center mt-4">
                    Updated {new Date(serverTimetable.updatedAt).toLocaleString()}
                </p>
            {/if}
        </div>

        <!-- Actions -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 space-y-2">
            <button
                onclick={acceptUpdate}
                disabled={isUpdating}
                class="w-full bg-[#3b82f6] text-white py-3.5 rounded-xl text-base font-bold hover:bg-[#2563eb] active:bg-[#1d4ed8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {#if isUpdating}
                    <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                {:else}
                    <CheckCircleIcon class="w-5 h-5" />
                    Accept & Update
                {/if}
            </button>
            <button
                onclick={rejectUpdate}
                disabled={isUpdating}
                class="w-full bg-white border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl text-base font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
            >
                Keep My Current Timetable
            </button>
        </div>
    </div>
{/if}

<style>
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
    .animate-spin {
        animation: spin 1s linear infinite;
    }
</style>
