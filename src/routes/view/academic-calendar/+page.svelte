<script lang="ts">
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";
    import ChevronLeftIcon from "@untitled-theme/icons-svelte/ChevronLeftIcon.svelte";
    import ChevronUpIcon from "@untitled-theme/icons-svelte/ChevronUpIcon.svelte";
    import SearchMdIcon from "@untitled-theme/icons-svelte/SearchMdIcon.svelte";
    import XCloseIcon from "@untitled-theme/icons-svelte/XCloseIcon.svelte";
    import CalendarIcon from "@untitled-theme/icons-svelte/CalendarIcon.svelte";
    import MainContainer from "$lib/components/ui/MainContainer.svelte";
    import Footer from "$lib/components/custom/Footer.svelte";
    import PageHeader from "$lib/components/custom/PageHeader.svelte";
    import academicCalendar from "$lib/data/academic_calendar.json";
    import clientDb from "$lib/models/client-db";
    import type { ClassTimetable } from "$lib/models/client-db";
    import { DateTime } from "luxon";

    type CalendarEntry = {
        date: string;
        day: string;
        events: string[];
        day_order: string | null;
        is_exam: boolean;
        exam_type: string | null;
    };

    let searchQuery = $state("");
    let isSearchFocused = $state(false);
    let selectedMonth = $state(DateTime.now().setZone("Asia/Kolkata"));
    let selectedDate = $state<string | null>(null);
    let showScrollTop = $state(false);
    let classTimetable: ClassTimetable | null = $state(null);

    // Load timetable from IndexedDB
    $effect(() => {
        if (browser) {
            clientDb.classTimetable.toArray().then(timetables => {
                if (timetables.length > 0) {
                    classTimetable = timetables[0];
                } else {
                    console.log("⚠️ No timetable found in IndexedDB");
                }
            }).catch(error => {
                console.error("❌ Error loading timetable:", error);
            });
        }
    });

    // Scroll to today on mount and setup scroll listener
    $effect(() => {
        setTimeout(() => {
            const todayElement = document.getElementById(`date-${currentDate.date}`);
            if (todayElement) {
                todayElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 300);

        // Setup scroll listener
        const handleScroll = () => {
            showScrollTop = window.scrollY > 300;
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    });

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Get current date info
    let currentDate = $derived.by(() => {
        const now = DateTime.now().setZone("Asia/Kolkata");
        const dateStr = now.toFormat("dd.MM.yyyy");

        // Find today's entry in the calendar
        const todayEntry = (academicCalendar as CalendarEntry[]).find(
            (entry) => entry.date === dateStr,
        );

        return {
            formatted: now.toFormat("EEEE, MMMM dd, yyyy"),
            dayName: now.toFormat("EEEE"),
            monthYear: now.toFormat("MMMM yyyy"),
            date: dateStr,
            entry: todayEntry,
        };
    });

    // Filter and group calendar entries
    let filteredCalendar = $derived.by(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return academicCalendar as CalendarEntry[];

        return (academicCalendar as CalendarEntry[]).filter((entry) => {
            // Parse the date for formatted matching
            const [day, month, year] = entry.date.split(".");
            const dateObj = DateTime.fromObject({
                day: parseInt(day),
                month: parseInt(month),
                year: parseInt(year),
            });

            // Generate various date formats for matching
            const formattedDates = [
                dateObj.toFormat("MMM dd").toLowerCase(),
                dateObj.toFormat("MMM d").toLowerCase(),
                dateObj.toFormat("MMMM dd").toLowerCase(),
                dateObj.toFormat("MMMM d").toLowerCase(),
                dateObj.toFormat("dd MMM").toLowerCase(),
                dateObj.toFormat("d MMM").toLowerCase(),
                dateObj.toFormat("dd MMMM").toLowerCase(),
                dateObj.toFormat("d MMMM").toLowerCase(),
            ];

            return (
                entry.date.includes(query) ||
                entry.day.toLowerCase().includes(query) ||
                entry.events.some((event) =>
                    event.toLowerCase().includes(query),
                ) ||
                entry.day_order?.toLowerCase().includes(query) ||
                entry.exam_type?.toLowerCase().includes(query) ||
                formattedDates.some((formatted) => formatted.includes(query))
            );
        });
    });

    // Group by month
    let groupedByMonth = $derived.by(() => {
        const groups: Record<string, CalendarEntry[]> = {};

        filteredCalendar.forEach((entry) => {
            const [day, month, year] = entry.date.split(".");
            const dateObj = DateTime.fromObject({
                day: parseInt(day),
                month: parseInt(month),
                year: parseInt(year),
            });
            const monthYear = dateObj.toFormat("MMMM yyyy");

            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(entry);
        });

        return groups;
    });

    function clearSearch() {
        searchQuery = "";
    }

    function getAccentColor(entry: CalendarEntry) {
        if (entry.is_exam) return "text-purple-500";
        if (entry.day_order) return "text-blue-500";
        return "text-red-500"; // Holidays in red
    }

    function getBadgeStyle(entry: CalendarEntry) {
        if (entry.is_exam) return "bg-purple-500/10 text-purple-600";
        if (entry.day_order) return "bg-blue-500/10 text-blue-600";
        return "bg-red-500/10 text-red-600"; // Holidays in red
    }

    function formatDate(dateStr: string): string {
        const [day, month, year] = dateStr.split(".");
        const dateObj = DateTime.fromObject({
            day: parseInt(day),
            month: parseInt(month),
            year: parseInt(year),
        });
        return dateObj.toFormat("dd MMM");
    }

    function isToday(dateStr: string): boolean {
        const today = DateTime.now()
            .setZone("Asia/Kolkata")
            .toFormat("dd.MM.yyyy");
        return dateStr === today;
    }

    // Calendar helper functions
    function getDaysInMonth() {
        const firstDay = selectedMonth.startOf("month");
        const lastDay = selectedMonth.endOf("month");
        const daysInMonth = selectedMonth.daysInMonth || 0;
        const startWeekday = (firstDay.weekday % 7); // Convert to 0=Sunday, 6=Saturday
        
        const days: Array<{ date: DateTime | null; entry: CalendarEntry | null }> = [];
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startWeekday; i++) {
            days.push({ date: null, entry: null });
        }
        
        // Add all days in month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = selectedMonth.set({ day });
            const dateStr = date.toFormat("dd.MM.yyyy");
            const entry = (academicCalendar as CalendarEntry[]).find(e => e.date === dateStr) || null;
            days.push({ date, entry });
        }
        
        return days;
    }

    function goToPreviousMonth() {
        selectedMonth = selectedMonth.minus({ months: 1 });
    }

    function goToNextMonth() {
        selectedMonth = selectedMonth.plus({ months: 1 });
    }

    function goToToday() {
        selectedMonth = DateTime.now().setZone("Asia/Kolkata");
        selectedDate = null;
    }

    function selectDate(dateStr: string) {
        if (selectedDate === dateStr) {
            selectedDate = null;
        } else {
            selectedDate = dateStr;
        }
    }

    function hasEvent(entry: CalendarEntry | null): boolean {
        return entry !== null && (entry.day_order !== null || entry.is_exam || entry.events.length > 0);
    }

    function getCalendarDotColor(entry: CalendarEntry | null): string {
        if (!entry) return "";
        if (entry.is_exam) return "bg-purple-500";
        if (entry.day_order) return "bg-blue-500";
        return "bg-red-500";
    }

    let calendarDays = $derived(getDaysInMonth());

    // Filter for selected date
    let selectedDateEntry = $derived.by(() => {
        if (!selectedDate) return null;
        return (academicCalendar as CalendarEntry[]).find(e => e.date === selectedDate) || null;
    });

    // Get timetable for selected day order
    let selectedDayTimetable = $derived.by(() => {
        if (!selectedDateEntry || !selectedDateEntry.day_order || !classTimetable) return null;
        
        try {
            const dayOrder = selectedDateEntry.day_order.toLowerCase().replace(/[-\s]/g, '_');
            const timetableData = JSON.parse(classTimetable.timetable);
            
            // Extract day number (1-6) from formats like "Day-3", "Day 3", "day-3", etc.
            const dayMatch = selectedDateEntry.day_order.match(/\d+/);
            if (!dayMatch) return null;
            
            const dayNum = parseInt(dayMatch[0]);
            const dayKey = `day_${dayNum}`;
            
            return timetableData[dayKey] || null;
        } catch (error) {
            console.error("Error parsing timetable:", error);
        }
        
        return null;
    });
</script>

<MainContainer>
    <section class="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col">
        <!-- Header -->
        <div class="sticky top-0 z-20 bg-white">
            <PageHeader title="Academic Calendar" />
        </div>

        <!-- Current Date Display -->
        <div class="bg-linear-to-br from-blue-500 to-blue-600 px-4 py-4">
            <div class="text-white/80 text-[13px] font-medium mb-0.5">
                Today
            </div>
            <div class="text-white text-[20px] font-semibold mb-2">
                {currentDate.formatted}
            </div>

            {#if currentDate.entry}
                <div class="flex flex-wrap gap-2 items-center">
                    {#if currentDate.entry.day_order}
                        <span
                            class="inline-flex items-center px-2.5 py-1 bg-white/20 text-white text-[12px] font-semibold rounded-lg backdrop-blur-sm"
                        >
                            {currentDate.entry.day_order}
                        </span>
                    {/if}

                    {#if currentDate.entry.is_exam && currentDate.entry.exam_type}
                        <span
                            class="inline-flex items-center px-2.5 py-1 bg-white/20 text-white text-[12px] font-semibold rounded-lg backdrop-blur-sm"
                        >
                            {currentDate.entry.exam_type}
                        </span>
                    {/if}

                    {#if !currentDate.entry.day_order && !currentDate.entry.is_exam}
                        <span
                            class="inline-flex items-center px-2.5 py-1 bg-white/20 text-white text-[12px] font-semibold rounded-lg backdrop-blur-sm"
                        >
                            Holiday
                        </span>
                    {/if}

                    {#if currentDate.entry.events && currentDate.entry.events.length > 0}
                        <span class="text-white/90 text-[13px] font-medium">
                            • {currentDate.entry.events.join(" • ")}
                        </span>
                    {/if}
                </div>
            {/if}
        </div>

        <!-- Calendar View -->
        <div class="bg-white border-b border-gray-200/50 px-4 py-4">
            <!-- Month Navigation -->
            <div class="flex items-center justify-between mb-4">
                <button
                    onclick={goToPreviousMonth}
                    class="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    aria-label="Previous month"
                >
                    <ChevronLeftIcon class="w-5 h-5 text-gray-700" />
                </button>
                
                <div class="flex items-center gap-2">
                    <h3 class="text-[16px] font-semibold text-gray-900">
                        {selectedMonth.toFormat("MMMM yyyy")}
                    </h3>
                </div>
                
                <button
                    onclick={goToNextMonth}
                    class="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors rotate-180"
                    aria-label="Next month"
                >
                    <ChevronLeftIcon class="w-5 h-5 text-gray-700" />
                </button>
            </div>

            <!-- Weekday Headers -->
            <div class="grid grid-cols-7 gap-1 mb-2">
                {#each ["S", "M", "T", "W", "T", "F", "S"] as day}
                    <div class="text-center text-[11px] font-semibold text-gray-500 py-1">
                        {day}
                    </div>
                {/each}
            </div>

            <!-- Calendar Grid -->
            <div class="grid grid-cols-7 gap-1">
                {#each calendarDays as { date, entry }}
                    {#if date}
                        {@const dateStr = date.toFormat("dd.MM.yyyy")}
                        {@const isCurrentMonth = date.month === selectedMonth.month}
                        {@const isTodayDate = isToday(dateStr)}
                        {@const isSelected = selectedDate === dateStr}
                        
                        <button
                            onclick={() => selectDate(dateStr)}
                            class="relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all"
                            class:bg-blue-500={isTodayDate && !isSelected}
                            class:text-white={isTodayDate && !isSelected}
                            class:bg-blue-600={isSelected}
                            class:text-gray-50={isSelected}
                            class:hover:bg-gray-100={!isTodayDate && !isSelected}
                            class:active:bg-gray-200={!isTodayDate && !isSelected}
                            class:text-gray-900={!isTodayDate && !isSelected}
                        >
                            <span class="text-[14px] font-medium">
                                {date.day}
                            </span>
                            {#if hasEvent(entry)}
                                <div class="absolute bottom-1 flex gap-0.5">
                                    <div class="w-1 h-1 rounded-full {getCalendarDotColor(entry)}"></div>
                                </div>
                            {/if}
                        </button>
                    {:else}
                        <div></div>
                    {/if}
                {/each}
            </div>

            <!-- Selected Date Info -->
            {#if selectedDateEntry}
                <div class="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div class="flex items-start gap-3">
                        <div class="flex flex-col items-center pt-0.5">
                            <div class="text-[10px] font-semibold uppercase tracking-wider {getAccentColor(selectedDateEntry)} mb-0.5">
                                {selectedDateEntry.day.substring(0, 3)}
                            </div>
                            <div class="text-[20px] font-semibold text-gray-900 leading-none">
                                {selectedDateEntry.date.split(".")[0]}
                            </div>
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <div class="flex flex-wrap gap-1.5 mb-2">
                                {#if selectedDateEntry.day_order}
                                    <span class="inline-flex items-center px-2 py-0.5 {getBadgeStyle(selectedDateEntry)} text-[10px] font-semibold rounded-md">
                                        {selectedDateEntry.day_order}
                                    </span>
                                {/if}
                                
                                {#if selectedDateEntry.is_exam && selectedDateEntry.exam_type}
                                    <span class="inline-flex items-center px-2 py-0.5 bg-purple-500/10 text-purple-600 text-[10px] font-semibold rounded-md">
                                        {selectedDateEntry.exam_type}
                                    </span>
                                {/if}
                                
                                {#if !selectedDateEntry.day_order && !selectedDateEntry.is_exam}
                                    <span class="inline-flex items-center px-2 py-0.5 bg-red-500/10 text-red-600 text-[10px] font-semibold rounded-md">
                                        Holiday
                                    </span>
                                {/if}
                            </div>
                            
                            {#if selectedDateEntry.events.length > 0}
                                <div class="space-y-1 mb-3">
                                    {#each selectedDateEntry.events as event}
                                        <p class="text-[13px] font-medium text-gray-700 leading-snug">
                                            {event}
                                        </p>
                                    {/each}
                                </div>
                            {/if}

                            {#if selectedDayTimetable && selectedDayTimetable.length > 0}
                                <div class="mt-3 pt-3 border-t border-gray-200">
                                    <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                        Class Schedule
                                    </p>
                                    <div class="space-y-1.5">
                                        {#each selectedDayTimetable as subject, index}
                                            {#if subject}
                                                <div class="flex items-center gap-2">
                                                    <span class="flex items-center justify-center w-5 h-5 rounded bg-blue-500/10 text-blue-600 text-[10px] font-semibold shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <span class="text-[13px] font-medium text-gray-800">
                                                        {subject}
                                                    </span>
                                                </div>
                                            {/if}
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Search Bar -->
        <div
            class="sticky top-[65px] bg-gray-50/95 backdrop-blur-xl z-15 px-4 py-3 border-b border-gray-200/50"
        >
            <div class="relative">
                <div
                    class="flex items-center gap-2.5 bg-white rounded-xl px-4 py-3 transition-all border border-gray-200/80 shadow-sm"
                    class:border-blue-500={isSearchFocused}
                    class:shadow-md={isSearchFocused}
                >
                    <SearchMdIcon class="w-[18px] h-[18px] text-gray-400" />
                    <input
                        type="text"
                        bind:value={searchQuery}
                        onfocus={() => (isSearchFocused = true)}
                        onblur={() => (isSearchFocused = false)}
                        placeholder="Search calendar..."
                        class="flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400 text-gray-900"
                    />
                    {#if searchQuery}
                        <button
                            onclick={clearSearch}
                            class="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                            aria-label="Clear search"
                        >
                            <XCloseIcon class="w-4 h-4 text-gray-500" />
                        </button>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 px-4 py-5 pb-20">
            {#if Object.keys(groupedByMonth).length === 0}
                <div class="flex flex-col items-center justify-center py-20">
                    <div
                        class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm border border-gray-100"
                    >
                        <CalendarIcon class="w-8 h-8 text-gray-300" />
                    </div>
                    <p class="text-[17px] font-semibold text-gray-900 mb-0.5">
                        No results found
                    </p>
                    <p class="text-[14px] text-gray-500">
                        Try searching with different keywords
                    </p>
                </div>
            {:else}
                {#each Object.entries(groupedByMonth) as [monthYear, entries]}
                    <div class="mb-7">
                        <!-- Month Header -->
                        <h2
                            class="text-[15px] font-semibold text-gray-900 mb-3 px-1"
                        >
                            {monthYear}
                        </h2>

                        <div class="space-y-2">
                            {#each entries as entry}
                                <div
                                    id="date-{entry.date}"
                                    class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
                                    class:ring-2={isToday(entry.date) || selectedDate === entry.date}
                                    class:ring-blue-500={isToday(entry.date) || selectedDate === entry.date}
                                >
                                    <div class="flex items-stretch gap-2 p-4">
                                        <!-- Date Display -->
                                        <div
                                            class="flex flex-col items-center justify-center shrink-0 w-[52px] pt-1"
                                        >
                                            <div
                                                class="text-[11px] font-semibold uppercase tracking-wider {getAccentColor(
                                                    entry,
                                                )} mb-0.5"
                                            >
                                                {entry.day.substring(0, 3)}
                                            </div>
                                            <div
                                                class="text-[28px] font-semibold text-gray-900 leading-none"
                                            >
                                                {entry.date.split(".")[0]}
                                            </div>
                                        </div>

                                        <!-- Divider -->
                                        <div
                                            class="w-px bg-gray-100"
                                        ></div>

                                        <!-- Content -->
                                        <div class="flex-1 min-w-0 ml-2 flex flex-col justify-center">
                                            {#if entry.events && entry.events.length > 0}
                                                <!-- Badges -->
                                                <div
                                                    class="flex flex-wrap gap-1.5 mb-2.5"
                                                >
                                                    {#if entry.day_order}
                                                        <span
                                                            class="inline-flex items-center px-2 py-1 {getBadgeStyle(
                                                                entry,
                                                            )} text-[11px] font-semibold rounded-md"
                                                        >
                                                            {entry.day_order}
                                                        </span>
                                                    {/if}

                                                    {#if entry.is_exam && entry.exam_type}
                                                        <span
                                                            class="inline-flex items-center px-2 py-1 bg-purple-500/10 text-purple-600 text-[11px] font-semibold rounded-md"
                                                        >
                                                            {entry.exam_type}
                                                        </span>
                                                    {/if}

                                                    {#if !entry.day_order && !entry.is_exam}
                                                        <span
                                                            class="inline-flex items-center px-2 py-1 bg-red-500/10 text-red-600 text-[11px] font-semibold rounded-md"
                                                        >
                                                            Holiday
                                                        </span>
                                                    {/if}

                                                    {#if isToday(entry.date)}
                                                        <span
                                                            class="inline-flex items-center px-2 py-1 bg-blue-500 text-white text-[11px] font-semibold rounded-md"
                                                        >
                                                            Today
                                                        </span>
                                                    {/if}
                                                </div>

                                                <!-- Events -->
                                                <div class="space-y-1">
                                                    {#each entry.events as event}
                                                        <p
                                                            class="text-[15px] font-medium text-gray-900 leading-snug"
                                                        >
                                                            {event}
                                                        </p>
                                                    {/each}
                                                </div>
                                            {:else}
                                                <!-- No events - show larger badge -->
                                                <div class="flex flex-wrap gap-2 items-center">
                                                    {#if entry.day_order}
                                                        <span
                                                            class="inline-flex items-center px-3 py-1.5 {getBadgeStyle(
                                                                entry,
                                                            )} text-[15px] font-semibold rounded-lg"
                                                        >
                                                            {entry.day_order}
                                                        </span>
                                                    {/if}

                                                    {#if entry.is_exam && entry.exam_type}
                                                        <span
                                                            class="inline-flex items-center px-3 py-1.5 bg-purple-500/10 text-purple-600 text-[15px] font-semibold rounded-lg"
                                                        >
                                                            {entry.exam_type}
                                                        </span>
                                                    {/if}

                                                    {#if !entry.day_order && !entry.is_exam}
                                                        <span
                                                            class="inline-flex items-center px-3 py-1.5 bg-red-500/10 text-red-600 text-[15px] font-semibold rounded-lg"
                                                        >
                                                            Holiday
                                                        </span>
                                                    {/if}

                                                    {#if isToday(entry.date)}
                                                        <span
                                                            class="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-[15px] font-semibold rounded-lg"
                                                        >
                                                            Today
                                                        </span>
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            {/if}
        </div>

        <!-- Scroll to Top Button -->
        {#if showScrollTop}
            <button
                onclick={scrollToTop}
                class="fixed bottom-6 right-4 w-12 h-12 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all animate-in fade-in slide-in-from-bottom-4 duration-200 z-20"
                aria-label="Scroll to top"
            >
                <ChevronUpIcon class="w-6 h-6" />
            </button>
        {/if}

        <Footer />
    </section>
</MainContainer>

<style>
    input {
        -webkit-tap-highlight-color: transparent;
    }
</style>
