<script lang="ts">
    import type { AttendanceFormat } from "$lib/types/attendance-scrapper.type";

    interface Props {
        type: "Present" | "Absent" | "On Duty" | "Medical" | "Casual" | "Service Learning";
        value: AttendanceFormat;
        labelType?: "percentage" | "hours";
        onclick?: () => void;
        className?: string;
    }
    let { type, value, labelType, onclick, className = "" }: Props = $props();

    const bgColorMap: Record<string, string> = {
        Present: "bg-green-200",
        Absent: "bg-red-200",
        "On Duty": "bg-blue-200",
        Medical: "bg-orange-200",
        Casual: "bg-purple-200",
        "Service Learning": "bg-yellow-200",
    };
    let bgColor: string = $state(bgColorMap[type]);

    const typeMapping = () => {
        if (type === "Present" && labelType === "percentage")
            return value.percentages.present;
        if (type === "Absent" && labelType === "percentage")
            return value.percentages.absent;
        if (type === "On Duty" && labelType === "percentage")
            return value.percentages.onduty;
        if (type === "Casual" && labelType === "percentage")
            return value.percentages.casual;
        if (type === "Medical" && labelType === "percentage")
            return value.percentages.medical;
        if (type === "Present" && labelType === "hours")
            return value.hours.present;
        if (type === "Absent" && labelType === "hours")
            return value.hours.absent;
        if (type === "On Duty" && labelType === "hours")
            return value.hours.onduty;
        if (type === "Medical" && labelType === "hours")
            return value.hours.medical;
        if (type === "Casual" && labelType === "hours")
            return value.hours.casual;
        return 0;
    };
</script>

<button
    class="rounded-2xl text-left {bgColor} px-6 py-4 {className}"
    style="box-shadow: 0 1px 3px rgba(0,0,0,0.08);"
    {onclick}
>
    <p class="text-[13px] text-black font-medium mb-1 flex items-center gap-2">
        {type}
    </p>
    <p
        class="{type !== 'Present' && type !== 'Absent'
            ? 'text-[22px]'
            : 'text-[26px]'} font-bold text-black leading-tight"
    >
        {typeMapping()}{labelType ? (labelType === "hours" ? "h" : "%") : ""}
        <!-- <span class="text-gray-500 -ml-1 text-lg">
            
        </span> -->
    </p>
</button>
