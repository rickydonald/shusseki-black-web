<script lang="ts">
    import helpers from "$lib/helpers";
    import type { AttendanceFormat } from "$lib/types/attendance-scrapper.type";

    interface SummaryCardProps {
        data: AttendanceFormat;
        summaryState: "Percentage" | "Hours";
    }
    interface Stats {
        label: string;
        value: string | number;
        color: string;
    }

    let { data, summaryState = "Percentage" }: SummaryCardProps = $props();

    let hasExtras: boolean | null = $state(null);

    const mainStats: Stats[] = [
        {
            label: "Present",
            value: "100%",
            color: "bg-green-500",
        },
        {
            label: "Absent",
            value: "19%",
            color: "bg-red-500",
        },
    ];
    const extraStats: Stats[] = [
        {
            label: "On Duty",
            value: "0%",
            color: "bg-blue-500",
        },
        {
            label: "Medical",
            value: "0%",
            color: "bg-orange-500",
        },
        {
            label: "Casual",
            value: "0%",
            color: "bg-purple-500",
        },
    ];

    $effect(() => {
        hasExtras =
            data.hours.onduty !== 0 ||
            data.hours.casual !== 0 ||
            data.hours.medical !== 0;
    });
</script>

<div class="flex items-center justify-evenly w-full gap-1">
    {#each mainStats as stats}
        <button
            class="flex flex-col items-center justify-center h-20 w-full bg-gray-100 rounded-2xl"
        >
            <h2
                class={`font-bold ${
                    hasExtras ? "text-base" : "text-xl"
                } text-gray-800`}
            >
                {data.hours.absent}
                {summaryState === "Percentage"
                    ? "%"
                    : summaryState === "Hours"
                      ? "h"
                      : ""}
            </h2>
            <span class="flex flex-col-reverse items-center gap-0.5">
                <span
                    class={`w-3 h-[3px] rounded-full ${stats.color} inline-block`}
                ></span>
                <p class="text-gray-500 text-xs font-medium">{stats.label}</p>
            </span>
        </button>
    {/each}
</div>
