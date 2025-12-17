<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    interface Props {
        value: string | null;
        minYear?: number;
        maxYear?: number;
    }
    let { value = $bindable(), minYear = 1900, maxYear = new Date().getFullYear() }: Props = $props();

    const dispatch = createEventDispatcher();

    // local state
    let day: string = $state("");
    let month: string = $state("");
    let year: string = $state("");

    let dayRef: HTMLInputElement;
    let monthRef: HTMLInputElement;
    let yearRef: HTMLInputElement;

    // normalize incoming `value` if provided
    function parseInitial(val: string | null) {
        if (!val) return;
        // Accept YYYY-MM-DD, DD-MM-YYYY, or simple numeric string.
        const cleaned = val.trim();
        // Try YYYY-MM-DD
        let m;
        if ((m = cleaned.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/))) {
            year = m[1];
            month = m[2];
            day = m[3];
        } else if ((m = cleaned.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/))) {
            day = m[1];
            month = m[2];
            year = m[3];
        } else if ((m = cleaned.match(/^(\d{2})(\d{2})(\d{4})$/))) {
            day = m[1];
            month = m[2];
            year = m[3];
        }
    }

    onMount(() => {
        parseInitial(value);
        // If initial value present focus first empty field
        if (!day) dayRef?.focus();
        else if (!month) monthRef?.focus();
        else if (!year) yearRef?.focus();
    });

    // helper to emit normalized value
    function emitChange() {
        const parts = {
            day: day.padStart(2, "0"),
            month: month.padStart(2, "0"),
            year: year,
        };
        const filled =
            parts.day.length === 2 &&
            parts.month.length === 2 &&
            parts.year.length === 4;
        const valueStr = filled
            ? `${parts.year}-${parts.month}-${parts.day}`
            : null; // ISO-ish
        dispatch("change", { ...parts, value: valueStr });
    }

    // allowed numeric input only
    function onlyDigits(s: string) {
        return s.replace(/\D+/g, "");
    }

    // basic range validators
    function validDay(d: string, m: string, y: string) {
        const dn = Number(d);
        if (!dn) return false;
        const mn = Number(m) || 1;
        const yn = Number(y) || 2000;
        if (mn < 1 || mn > 12) return false;
        // days in month (account feb leap)
        const daysInMonth = new Date(yn, mn, 0).getDate();
        return dn >= 1 && dn <= daysInMonth;
    }
    function validMonth(m: string) {
        const mn = Number(m);
        return mn >= 1 && mn <= 12;
    }
    function validYear(y: string) {
        const yn = Number(y);
        return yn >= minYear && yn <= maxYear;
    }

    // input handlers
    function handleInput(e: Event, part: "day" | "month" | "year") {
        const input = e.target as HTMLInputElement;
        let v = onlyDigits(input.value);

        if (part === "day") {
            // limit 2
            if (v.length > 2) v = v.slice(0, 2);
            day = v;
            if (day.length === 2) {
                // if day invalid but month empty, still move; but best effort allow user to correct
                monthRef?.focus();
            }
        } else if (part === "month") {
            if (v.length > 2) v = v.slice(0, 2);
            month = v;
            if (month.length === 2) yearRef?.focus();
        } else {
            if (v.length > 4) v = v.slice(0, 4);
            year = v;
        }

        emitChange();
    }

    function handleKeydown(e: KeyboardEvent, part: "day" | "month" | "year") {
        const key = e.key;
        const target = e.target as HTMLInputElement;

        // backspace behaviour: if empty move to previous
        if (key === "Backspace") {
            if (target.value.length === 0) {
                if (part === "month") {
                    dayRef?.focus();
                } else if (part === "year") {
                    monthRef?.focus();
                }
            }
            return;
        }

        // Arrow navigation
        if (key === "ArrowLeft") {
            if (part === "month") dayRef?.focus();
            else if (part === "year") monthRef?.focus();
        } else if (key === "ArrowRight") {
            if (part === "day") monthRef?.focus();
            else if (part === "month") yearRef?.focus();
        }
    }

    // paste handling: accept multiple formats and distribute values
    function handlePaste(e: ClipboardEvent) {
        const txt = (e.clipboardData || (window as any).clipboardData).getData(
            "text",
        );
        if (!txt) return;
        const cleaned = txt.trim();
        // try various patterns
        let m;
        if ((m = cleaned.match(/^(\d{2})[-\/\s](\d{2})[-\/\s](\d{4})$/))) {
            e.preventDefault();
            day = onlyDigits(m[1]);
            month = onlyDigits(m[2]);
            year = onlyDigits(m[3]);
            yearRef?.focus();
            emitChange();
        } else if ((m = cleaned.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/))) {
            e.preventDefault();
            year = onlyDigits(m[1]);
            month = onlyDigits(m[2]);
            day = onlyDigits(m[3]);
            yearRef?.focus();
            emitChange();
        } else if ((m = cleaned.match(/^(\d{2})(\d{2})(\d{4})$/))) {
            e.preventDefault();
            day = onlyDigits(m[1]);
            month = onlyDigits(m[2]);
            year = onlyDigits(m[3]);
            yearRef?.focus();
            emitChange();
        }
    }

    // small public helper to get validity
    export function isValid() {
        return (
            validDay(day, month, year) &&
            validMonth(month) &&
            validYear(year) &&
            year.length === 4
        );
    }

    // expose a convenience method to programmatically set value
    export function setValue(v: string | null) {
        day = month = year = "";
        parseInitial(v);
        emitChange();
    }
</script>

<div class="dob-input flex items-center gap-2 mt-4">
    <!-- Day -->
    <label class="sr-only" for="dob-day">Day</label>
    <input
        id="dob-day"
        bind:this={dayRef}
        inputmode="numeric"
        autocomplete="bday-day"
        class="w-full h-10 text-center rounded-lg border px-2 py-1 text-sm font-geist-mono! font-semibold! focus:ring focus:outline-none"
        value={day}
        oninput={(e) => handleInput(e, "day")}
        onkeydown={(e) => handleKeydown(e, "day")}
        maxlength="2"
        placeholder="DD"
        onpaste={handlePaste}
    />

    <span class="text-gray-400 select-none">-</span>

    <!-- Month -->
    <label class="sr-only" for="dob-month">Month</label>
    <input
        id="dob-month"
        bind:this={monthRef}
        inputmode="numeric"
        autocomplete="bday-month"
        class="w-full h-10 text-center rounded-lg border px-2 py-1 text-sm font-geist-mono! font-semibold! focus:ring focus:outline-none"
        value={month}
        oninput={(e) => handleInput(e, "month")}
        onkeydown={(e) => handleKeydown(e, "month")}
        maxlength="2"
        placeholder="MM"
        onpaste={handlePaste}
    />

    <span class="text-gray-400 select-none">-</span>

    <!-- Year -->
    <label class="sr-only" for="dob-year">Year</label>
    <input
        id="dob-year"
        bind:this={yearRef}
        inputmode="numeric"
        autocomplete="bday-year"
        class="w-full h-10 text-center rounded-lg border px-2 py-1 text-sm font-geist-mono! font-semibold!"
        value={year}
        oninput={(e) => handleInput(e, "year")}
        onkeydown={(e) => handleKeydown(e, "year")}
        maxlength="4"
        placeholder="YYYY"
        onpaste={handlePaste}
    />
</div>

<style>
    /* Fallback CSS if Tailwind isn't present */
    .dob-input input {
        border: 1px solid #e5e7eb;
        background: white;
        font-weight: 500;
        letter-spacing: 2px;
    }
    .dob-input input:focus {
        /* border-color: #a78bfa; */
        border-color: var(--color-blue-400);
        /* box-shadow: 0 0 0 3px rgba(139, 169, 250, 0.12); */
        box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.12);
    }
    .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
    }
</style>
