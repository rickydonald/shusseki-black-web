<script lang="ts">
  import { slide } from "svelte/transition";
  import ChevronLeftIcon from "@untitled-theme/icons-svelte/ChevronLeftIcon.svelte";
  import { goto } from "$app/navigation";
  import ShussekiLogo from "$lib/components/icons/ShussekiLogo.svelte";
  import { cubicInOut } from "svelte/easing";
  import { Constants } from "$lib/constants";
  import MainContainer from "$lib/components/ui/MainContainer.svelte";
  import {
    ChevronDownDoubleIcon,
    ChevronDownIcon,
  } from "@untitled-theme/icons-svelte";
  import clientDb from "$lib/models/client-db";
  import { toast } from "svelte-sonner";
  import type { PageProps } from "./$types";
  import Footer from "$lib/components/custom/Footer.svelte";
  import PageHeader from "$lib/components/custom/PageHeader.svelte";

  let { data }: PageProps = $props();

  // Timetable: 6 days × 5 periods
  let timetable = $state(Array.from({ length: 6 }, () => Array(5).fill("")));
  let openDay = $state<number | null>(null);
  let isLoadingExisting = $state(false);
  let hasReadElectiveGuidance = $state(false);

  // Load existing timetable if available
  $effect(() => {
    loadExistingTimetable();
  });

  async function loadExistingTimetable() {
    isLoadingExisting = true;
    try {
      // Try to load from local DB first
      const localTimetable = await clientDb.classTimetable.get(data.classCode);
      
      if (localTimetable) {
        const parsed = JSON.parse(localTimetable.timetable);
        timetable[0] = parsed.day_1 || Array(5).fill("");
        timetable[1] = parsed.day_2 || Array(5).fill("");
        timetable[2] = parsed.day_3 || Array(5).fill("");
        timetable[3] = parsed.day_4 || Array(5).fill("");
        timetable[4] = parsed.day_5 || Array(5).fill("");
        timetable[5] = parsed.day_6 || Array(5).fill("");
        console.log("✅ Loaded existing timetable from local DB");
      } else {
        // Try to fetch from server
        const response = await fetch("/api/v1/user/timetable/get");
        if (response.ok) {
          const result = await response.json();
          if (result.response && result.data) {
            const parsed = typeof result.data.timetable === "string" 
              ? JSON.parse(result.data.timetable) 
              : result.data.timetable;
            
            timetable[0] = parsed.day_1 || Array(5).fill("");
            timetable[1] = parsed.day_2 || Array(5).fill("");
            timetable[2] = parsed.day_3 || Array(5).fill("");
            timetable[3] = parsed.day_4 || Array(5).fill("");
            timetable[4] = parsed.day_5 || Array(5).fill("");
            timetable[5] = parsed.day_6 || Array(5).fill("");
            console.log("✅ Loaded existing timetable from server");
          }
        }
      }
    } catch (error) {
      console.error("Error loading existing timetable:", error);
    } finally {
      isLoadingExisting = false;
    }
  }

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
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return Array.from(new Set(subjects));
  });

  function getFilteredSubjectsForQuery(query: string) {
    if (!query.trim()) return [];
    const matched = allSubjects.filter((s) =>
      s.toLowerCase().includes(query.toLowerCase()),
    );
    // prioritize recentSubjects
    matched.sort((a, b) => {
      const ai = recentSubjects.indexOf(a);
      const bi = recentSubjects.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    return matched;
  }

  function selectSuggestion(day: number, period: number, value: string) {
    timetable[day][period] = value;
    // update recentSubjects, keep unique & max 6
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

  // Combined keyboard handler:
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
      // If suggestions exist, select them; otherwise go to next input
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

  /** CLEANUP **/
  function cleanSubject(s: string) {
    return s
      .replace(/\s+/g, " ")
      .replace(/\(\s*/g, "(")
      .replace(/\s*\)/g, ")")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  /** NAVIGATION **/
  function goToNextInput(day: number, period: number) {
    if (period < 4) {
      activeBox = { day, period: period + 1 };
    } else if (day < 5) {
      activeBox = { day: day + 1, period: 0 };
    } else {
      // last input - close
      activeBox = null;
    }
    highlightedIndex = 0;
  }

  /** VALIDATION **/
  function isDayComplete(dayIndex: number) {
    return timetable[dayIndex].every((p) => p.trim() !== "");
  }

  let isAllValid = $derived(
    timetable.every((d) => d.every((p) => p.trim() !== "")),
  );

  /** SUBMIT **/
  let isSubmitting = $state(false);

  async function submit() {
    if (!isAllValid || isSubmitting) return;

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

      // Save to server (will create or update for the class)
      const response = await fetch("/api/v1/user/timetable/create", {
        method: "POST",
        body: JSON.stringify(formatted),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        toast.error("Failed to save timetable. Please try again.");
        return;
      }

      const result = await response.json();
      const updatedAt = result.data?.updatedAt || new Date().toISOString();

      // Save to local database with sync timestamp
      try {
        await clientDb.classTimetable.put({
          class_code: data.classCode,
          timetable: JSON.stringify(formatted.timetable),
          isActive: true,
          lastSyncedAt: updatedAt,
          localVersion: 1
        });
        toast.success("Timetable saved and synced successfully!");
      } catch (dbError) {
        console.error("Error saving to local database:", dbError);
        toast.warning("Saved to cloud but failed to save locally.");
      }

      goto("/view/attendance");
    } catch (error) {
      console.error("Error saving timetable:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      isSubmitting = false;
    }
  }

  // helper for chip click: fill active input or first period if none
  function fillChipForBox(day: number, chipValue: string) {
    if (activeBox) {
      selectSuggestion(activeBox.day, activeBox.period, chipValue);
    } else {
      // default fill first period of the day
      selectSuggestion(day, 0, chipValue);
    }
  }

  // Handle suggestion click with keyboard support
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
  <PageHeader title="Class Timetable" />
  <section class="max-w-md mx-auto p-4 space-y-5 bg-white rounded-b-2xl">
    <!-- Important: Elective Handling Guidance -->
    <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-[15px] font-semibold text-gray-900 mb-2">
            Have students with different electives?
          </h3>
          <p class="text-[13px] text-gray-600 leading-relaxed mb-3">
            Use generic names so everyone can share the same timetable:
          </p>
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-[13px] text-gray-700">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
              <span>"<strong class="text-gray-900">Language</strong>" not Tamil/French</span>
            </div>
            <div class="flex items-center gap-2 text-[13px] text-gray-700">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
              <span>"<strong class="text-gray-900">Elective</strong>" not specific ones</span>
            </div>
            <div class="flex items-center gap-2 text-[13px] text-gray-700">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
              <span>"<strong class="text-gray-900">Cross Disciplinary</strong>" not specific ones</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {#each timetable as periods, dayIndex}
      <div class="border rounded-xl bg-white overflow-visible">
        <button
          class="w-full text-left px-4 py-3 font-semibold flex justify-between items-center hover:bg-gray-150 transition-colors rounded-xl"
          onclick={() => toggleDay(dayIndex)}
        >
          <span>Day {dayIndex + 1}</span>

          {#if isDayComplete(dayIndex)}
            <span class="text-green-600 text-sm font-semibold">Completed</span>
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
                    // small timeout to allow click on suggestion before hiding
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
        class="w-full py-3 rounded-xl text-[15px] font-semibold shadow-sm transition-all {isAllValid && hasReadElectiveGuidance
          ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
          : 'bg-gray-200 text-gray-400 cursor-not-allowed'}"
        disabled={!isAllValid || isSubmitting || !hasReadElectiveGuidance}
      >
        {#if isSubmitting}
          <span class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Saving...
          </span>
        {:else if !isAllValid}
          Fill all periods to continue
        {:else if !hasReadElectiveGuidance}
          Check the box above to continue
        {:else}
          Save Timetable
        {/if}
      </button>
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
