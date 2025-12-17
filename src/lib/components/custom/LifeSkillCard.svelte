<script lang="ts">
    import { DateTime } from "luxon";
    import type { LifeSkillAttendanceRecord } from "$lib/types/attendance-scrapper.type";

    interface Props {
        lifeSkill: LifeSkillAttendanceRecord;
        onclick?: () => void;
    }

    let { lifeSkill, onclick }: Props = $props();

    const lifeSkillDates = $derived(
        Object.keys(lifeSkill?.entries ?? {}).sort((a, b) => {
            const parseDate = (d: string) => {
                const [day, month, year] = d.split("-");
                const monthMap: Record<string, number> = {
                    Jan: 0,
                    Feb: 1,
                    Mar: 2,
                    Apr: 3,
                    May: 4,
                    Jun: 5,
                    Jul: 6,
                    Aug: 7,
                    Sep: 8,
                    Oct: 9,
                    Nov: 10,
                    Dec: 11
                };
                const dd = Number(day);
                const yy = Number(year);
                const mm = monthMap[month];
                if (Number.isNaN(dd) || Number.isNaN(yy) || mm === undefined) {
                    return new Date(NaN);
                }
                return new Date(yy, mm, dd);
            };

            return parseDate(b).getTime() - parseDate(a).getTime();
        })
    );

    const latestDate = $derived(lifeSkillDates[0]);
    const latestStatus = $derived(
        latestDate ? lifeSkill?.entries?.[latestDate] : undefined
    );
    const percentage = $derived(
        lifeSkill?.totalRows > 0
            ? Math.round((lifeSkill.presentCount / lifeSkill.totalRows) * 100)
            : 0
    );

    const statusPalette = $derived(() => {
        if (percentage >= 85) return { label: "On track", tone: "positive" } as const;
        if (percentage >= 60) return { label: "Keep going", tone: "warn" } as const;
        return { label: "Needs focus", tone: "alert" } as const;
    });

    const statusChipClass = $derived(() => {
        switch (statusPalette().tone) {
            case "positive":
                return "bg-emerald-100 text-emerald-700 border border-emerald-200";
            case "warn":
                return "bg-amber-100 text-amber-700 border border-amber-200";
            default:
                return "bg-rose-100 text-rose-700 border border-rose-200";
        }
    });

    const latestLabel = $derived(() => {
        if (latestStatus === "P") return "Present";
        if (latestStatus === "A") return "Absent";
        return latestStatus ?? "No record";
    });

    const latestStatusClass = $derived(
        latestStatus === "P"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-rose-100 text-rose-700"
    );

    const latestDisplay = $derived(() => {
        if (!latestDate) return "—";
        const parsed = DateTime.fromFormat(latestDate, "dd-MMM-yyyy");
        return parsed.isValid ? parsed.toFormat("dd MMM, yyyy") : latestDate;
    });

    const totalSessionsLabel = $derived(
        lifeSkill?.totalRows === 1 ? "session" : "sessions"
    );
</script>

<button
    class="w-full rounded-xl text-left bg-white border border-slate-200 px-4 py-3 shadow-sm hover:shadow transition"
    {onclick}
>
    <div class="flex items-start justify-between gap-4">
        <div class="space-y-3">
            <div class="flex items-center gap-2">
                <div class="leading-tight">
                    <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Life Skills
                    </p>
                    <p class="text-xs text-slate-500">Tap to review sessions</p>
                </div>
            </div>
            <div class="flex items-baseline gap-1.5 text-slate-900">
                <span class="text-2xl font-semibold tracking-tight">{lifeSkill.presentCount}</span>
                <span class="text-lg font-medium text-slate-400">/</span>
                <span class="text-xl font-semibold text-slate-500">{lifeSkill.totalRows}</span>
                <span class="text-[11px] uppercase tracking-wide text-slate-500">{totalSessionsLabel}</span>
            </div>
        </div>
        <div class="flex flex-col items-end gap-0">
            <div class="flex text-gray-800 items-center justify-center rounded-full">
                <span class="text-lg font-semibold">{percentage}<span class="text-[10px] ml-0.5">%</span></span>
            </div>
            <span class="text-[10px] font-medium uppercase tracking-wide text-slate-400">Attendance</span>
        </div>
    </div>

    <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <div>
            <p class="text-[11px] uppercase tracking-wide text-slate-500">Last session</p>
            <p class="text-sm font-medium text-slate-700">{latestDisplay()}</p>
        </div>
        <span class={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${latestStatusClass}`}>
            {latestLabel()}
        </span>
    </div>
</button>
