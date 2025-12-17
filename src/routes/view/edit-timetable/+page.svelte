<script lang="ts">
  import { slide, fade } from "svelte/transition";
  import ChevronLeftIcon from "@untitled-theme/icons-svelte/ChevronLeftIcon.svelte";
  import { goto } from "$app/navigation";
  import { cubicOut } from "svelte/easing";
  import { Constants } from "$lib/constants";
  import MainContainer from "$lib/components/ui/MainContainer.svelte";
  import Footer from "$lib/components/custom/Footer.svelte";
  import PageHeader from "$lib/components/custom/PageHeader.svelte";
  import {
    ChevronDownIcon,
    CheckCircleIcon,
  } from "@untitled-theme/icons-svelte";
  import clientDb from "$lib/models/client-db";
  import { toast } from "svelte-sonner";
  import type { PageProps } from "./$types";
  import { onMount } from "svelte";

  let { data }: PageProps = $props();

  // Day order labels
  const dayOrderLabels = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"];

  // Redirect if no timetable
  onMount(() => {
    if (data.redirect) {
      goto(data.redirect);
    }
  });

  // Parse existing timetable
  let initialTimetable = $derived.by(() => {
    if (!data.currentTimetable)
      return Array.from({ length: 6 }, () => Array(5).fill(""));

    const parsed =
      typeof data.currentTimetable.timetable === "string"
        ? JSON.parse(data.currentTimetable.timetable)
        : data.currentTimetable.timetable;

    return [
      parsed.day_1 || Array(5).fill(""),
      parsed.day_2 || Array(5).fill(""),
      parsed.day_3 || Array(5).fill(""),
      parsed.day_4 || Array(5).fill(""),
      parsed.day_5 || Array(5).fill(""),
      parsed.day_6 || Array(5).fill(""),
    ];
  });

  // Timetable: 6 days × 5 periods
  let timetable = $state<string[][]>(
    Array.from({ length: 6 }, () => Array(5).fill(""))
  );
  
  // Load initial data
  $effect(() => {
    timetable = JSON.parse(JSON.stringify(initialTimetable));
  });
  
  let openDay = $state<number | null>(null);
  let hasReadElectiveGuidance = $state(false);

  // Track if changes were made
  let hasChanges = $derived(
    JSON.stringify(timetable) !== JSON.stringify(initialTimetable),
  );

  function toggleDay(i: number) {
    openDay = openDay === i ? null : i;
  }

  /** AUTOCOMPLETE / UX STATE **/
  let activeBox = $state<{ day: number; period: number } | null>(null);
  let highlightedIndex = $state(0);
  const recentSubjects = $state<string[]>([]);

  // Memoized subjects list
  let allSubjects = $derived.by(() => {
    const subjects = timetable
      .flat()
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    return Array.from(new Set(subjects));
  });

  function getFilteredSubjectsForQuery(query: string): string[] {
    if (!query.trim()) return [];
    const matched = allSubjects.filter((s: string) =>
      s.toLowerCase().includes(query.toLowerCase()),
    );
    matched.sort((a: string, b: string) => {
      const ai = recentSubjects.indexOf(a);
      const bi = recentSubjects.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    return matched;
  }

  function selectSuggestion(day: number, period: number, value: string) {
    timetable[day][period] = value;
    recentSubjects.unshift(value);
    const uniq = Array.from(new Set(recentSubjects));
    recentSubjects.splice(0, recentSubjects.length, ...uniq.slice(0, 6));
    activeBox = null;
    highlightedIndex = 0;
  }

  function highlightMatch(text: string, query: string) {
    if (!query) return escapeHtml(text);
    const escapedQuery = escapeRegExp(query);
    const regex = new RegExp(`(${escapedQuery})`, "ig");
    return escapeHtml(text).replace(regex, `<strong class="match">$1</strong>`);
  }

  function escapeHtml(str: string) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function handleKeydown(
    e: KeyboardEvent,
    day: number,
    period: number,
    currentQuery: string,
  ) {
    const suggestions = getFilteredSubjectsForQuery(currentQuery);
    if (e.key === "ArrowDown") {
      if (suggestions.length === 0) return;
      highlightedIndex = (highlightedIndex + 1) % suggestions.length;
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowUp") {
      if (suggestions.length === 0) return;
      highlightedIndex =
        (highlightedIndex - 1 + suggestions.length) % suggestions.length;
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      if (suggestions.length > 0) {
        selectSuggestion(day, period, suggestions[highlightedIndex]);
      } else {
        goToNextInput(day, period);
      }
      e.preventDefault();
      return;
    }
    if (e.key === "Escape") {
      activeBox = null;
      highlightedIndex = 0;
    }
  }

  function cleanSubject(s: string) {
    return s
      .replace(/\s+/g, " ")
      .replace(/\(\s*/g, "(")
      .replace(/\s*\)/g, ")")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function goToNextInput(day: number, period: number) {
    if (period < 4) {
      activeBox = { day, period: period + 1 };
    } else if (day < 5) {
      activeBox = { day: day + 1, period: 0 };
    } else {
      activeBox = null;
    }
    highlightedIndex = 0;
  }

  function isDayComplete(dayIndex: number) {
    return timetable[dayIndex].every((p: string) => p.trim() !== "");
  }

  let isAllValid = $derived(
    timetable.every((d: string[]) => d.every((p: string) => p.trim() !== "")),
  );

  /** SUBMIT **/
  let isSubmitting = $state(false);

  async function submit() {
    if (!isAllValid || isSubmitting || !hasChanges || !hasReadElectiveGuidance) return;

    isSubmitting = true;
    try {
      const formatted = {
        timetable: {
          day_1: timetable[0],
          day_2: timetable[1],
          day_3: timetable[2],
          day_4: timetable[3],
          day_5: timetable[4],
          day_6: timetable[5],
        },
      };

      // Update on server
      const response = await fetch("/api/v1/user/timetable/update", {
        method: "PUT",
        body: JSON.stringify(formatted),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to update timetable. Please try again.");
        return;
      }

      const result = await response.json();
      const updatedAt = result.data?.updatedAt || new Date().toISOString();

      // Update local database with proper sync timestamp
      try {
        await clientDb.classTimetable.put({
          class_code: data.classCode || "",
          timetable: JSON.stringify(formatted.timetable),
          isActive: true,
          lastSyncedAt: updatedAt,
          localVersion: 1
        });
        toast.success("Timetable updated & synced with classmates!");
      } catch (dbError) {
        console.error("Error updating local database:", dbError);
        toast.success("Timetable updated on server!");
        toast.warning("Failed to save locally. Reload to sync.");
      }

      setTimeout(() => {
        goto("/view/attendance");
      }, 1500);
    } catch (error) {
      console.error("Error updating timetable:", error);
      toast.error("❌ Network error. Please check your connection.");
    } finally {
      isSubmitting = false;
    }
  }

  function fillChipForBox(day: number, chipValue: string) {
    if (activeBox) {
      selectSuggestion(activeBox.day, activeBox.period, chipValue);
    } else {
      selectSuggestion(day, 0, chipValue);
    }
  }

  function handleSuggestionInteraction(
    day: number,
    period: number,
    suggestion: string,
    event: MouseEvent | KeyboardEvent,
  ) {
    if (
      event instanceof KeyboardEvent &&
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }
    event.preventDefault();
    selectSuggestion(day, period, suggestion);
  }
</script>

<MainContainer>
  <section class="max-w-md mx-auto bg-white rounded-b-2xl">
    <!-- Header -->
    <PageHeader title="Edit Class Timetable" />

    <div class="p-4 space-y-5">
      <!-- Elective Handling Guidance -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-[14px] font-semibold text-gray-900 mb-2">
              💡 Tip: Use generic names for electives
            </h3>
            <div class="space-y-1.5 text-[13px] text-gray-600">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                <span>"<strong class="text-gray-900">Language</strong>" not Tamil/French</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                <span>"<strong class="text-gray-900">Major Elective</strong>" not AI/Data Science</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                <span>"<strong class="text-gray-900">Cross Disciplinary</strong>" not specific ones</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Changes Indicator -->
      {#if hasChanges}
        <div
          class="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 flex items-center gap-2"
          transition:fade
        >
          <span class="text-orange-600 text-lg">⚠️</span>
          <span class="text-sm text-orange-700 font-medium"
            >Unsaved changes</span
          >
        </div>
      {/if}
      {#each timetable as periods, dayIndex}
        <div class="border rounded-xl bg-white overflow-visible">
          <button
            class="w-full text-left px-4 py-3 font-semibold flex justify-between items-center hover:bg-gray-150 transition-colors rounded-xl"
            onclick={() => toggleDay(dayIndex)}
          >
            <div class="flex items-center gap-2">
              <span>{dayOrderLabels[dayIndex]}</span>
            </div>

            {#if isDayComplete(dayIndex)}
              <span class="text-green-600 text-sm font-semibold">Completed</span
              >
            {/if}

            <span
              class="text-gray-500 transition-transform duration-200"
              class:rotate-180={openDay === dayIndex}
            >
              <ChevronDownIcon />
            </span>
          </button>

          {#if openDay === dayIndex}
            <div class="p-3 space-y-5 rounded-b-xl" transition:slide|local>
              <!-- Chips -->
              {#if allSubjects.length > 0}
                <div class="flex flex-wrap gap-2 mb-3">
                  {#each allSubjects as s}
                    <button
                      type="button"
                      class="px-2 py-1 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors"
                      onclick={() => fillChipForBox(dayIndex, s)}
                    >
                      {s}
                    </button>
                  {/each}
                </div>
              {/if}

              {#each periods as subject, periodIndex}
                <div class="relative">
                  <p class="text-sm text-gray-600 pb-1">
                    Period {periodIndex + 1}
                  </p>

                  <input
                    class="w-full p-3 border rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    bind:value={timetable[dayIndex][periodIndex]}
                    placeholder="Enter subject"
                    onfocus={() => {
                      activeBox = { day: dayIndex, period: periodIndex };
                      highlightedIndex = 0;
                    }}
                    oninput={() => {
                      activeBox = { day: dayIndex, period: periodIndex };
                      highlightedIndex = 0;
                    }}
                    onblur={() => {
                      timetable[dayIndex][periodIndex] = cleanSubject(
                        timetable[dayIndex][periodIndex],
                      );
                      setTimeout(() => {
                        if (
                          !activeBox ||
                          activeBox.day !== dayIndex ||
                          activeBox.period !== periodIndex
                        ) {
                        }
                      }, 150);
                    }}
                    onkeydown={(e) =>
                      handleKeydown(
                        e,
                        dayIndex,
                        periodIndex,
                        timetable[dayIndex][periodIndex],
                      )}
                  />

                  <!-- autocomplete -->
                  {#if activeBox && activeBox.day === dayIndex && activeBox.period === periodIndex}
                    {#if getFilteredSubjectsForQuery(timetable[dayIndex][periodIndex]).length > 0}
                      <ul
                        role="listbox"
                        class="absolute left-0 right-0 bg-white border rounded-lg shadow-lg z-20 mt-1 max-h-40 overflow-auto"
                      >
                        {#each getFilteredSubjectsForQuery(timetable[dayIndex][periodIndex]) as suggestion, i}
                          <button
                            type="button"
                            role="option"
                            aria-selected={i === highlightedIndex}
                            class="suggestion-item w-full text-left px-3 py-2 text-sm transition-colors"
                            class:selected={i === highlightedIndex}
                            onclick={(e) =>
                              handleSuggestionInteraction(
                                dayIndex,
                                periodIndex,
                                suggestion,
                                e,
                              )}
                            onkeydown={(e) =>
                              handleSuggestionInteraction(
                                dayIndex,
                                periodIndex,
                                suggestion,
                                e,
                              )}
                          >
                            {@html highlightMatch(
                              suggestion,
                              timetable[dayIndex][periodIndex],
                            )}
                          </button>
                        {/each}
                      </ul>
                    {/if}
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}

      <!-- Submit Button with Integrated Checkbox -->
      <div class="space-y-3">
        <label class="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer group hover:bg-blue-100 transition-colors">
          <input
            type="checkbox"
            bind:checked={hasReadElectiveGuidance}
            class="w-5 h-5 rounded border-2 border-blue-500 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer transition-all"
          />
          <span class="text-[14px] font-medium text-gray-900 leading-snug">
            I'll use generic names for electives (e.g., "Language" not "French")
          </span>
        </label>
        
        <button
          type="button"
          onclick={submit}
          class="w-full py-3 rounded-xl text-[15px] font-semibold shadow-sm transition-all {isAllValid && hasReadElectiveGuidance && hasChanges
            ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}"
          disabled={!isAllValid || isSubmitting || !hasReadElectiveGuidance || !hasChanges}
        >
          {#if isSubmitting}
            <span class="flex items-center justify-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Saving...
            </span>
          {:else if !hasChanges}
            No Changes to Save
          {:else if !isAllValid}
            Fill all periods to continue
          {:else if !hasReadElectiveGuidance}
            Check the box above to continue
          {:else}
            Save Timetable
          {/if}
        </button>
      </div>
    </div>
  </section>

  <Footer />
</MainContainer>

<style>
  .suggestion-item {
    transition: background 0.12s;
  }

  .suggestion-item.selected {
    background: rgba(191, 219, 254, 0.9); /* Tailwind sky-200 like */
  }

  .suggestion-item:focus {
    outline: 2px solid rgb(59, 130, 246); /* blue-500 */
    outline-offset: -2px;
  }

  button:disabled {
    opacity: 0.6;
  }

  /* small touch target improvements */
  input {
    -webkit-tap-highlight-color: transparent;
  }
</style>
