<script lang="ts">
    import { getAttendanceStatusColor } from "$lib/methods";

    interface Props {
        data: Record<string, string[] | string>;
    }
    let { data }: { data: any } = $props();

    const today = new Date().toLocaleDateString("en-GB");
    const formatDate = (d: string) => {
        // Handle dates like "13-Nov-2025" or standard date formats
        // if (d.includes('-') && d.split('-').length === 3 && d.split('-')[1].length === 3) {
        //     return d; // Already formatted as "dd-Mmm-yyyy"
        // }
        return new Date(d).toLocaleDateString("en-GB");
    };
</script>

<table class="min-w-full rounded-lg">
    <tbody class="divide-y divide-gray-100">
        {#each Object.entries(data) as [date, statuses]}
            <tr class="transition">
                <!-- Date String -->
                <td
                    class="text-xs text-left py-2"
                    class:font-bold={formatDate(date) === today}
                >
                    {formatDate(date)}
                </td>

                <!-- Status Badges -->
                <td class="px-0 py-3 pl-1 whitespace-nowrap">
                    {#if Array.isArray(statuses)}
                        <!-- Regular attendance with multiple periods -->
                        <div class="grid grid-cols-5 gap-1">
                            {#each statuses as status, sIdx}
                                <span
                                    class={`text-center px-2.5 py-1 text-xs font-bold! rounded-md ${getAttendanceStatusColor(
                                        status,
                                    )}`}
                                    title={status || "N/A"}
                                >
                                    {status || "N"}
                                </span>
                            {/each}
                        </div>
                    {:else}
                        <!-- LifeSkill attendance with single status -->
                        <span
                            class={`inline-block text-center px-4 py-1 text-xs font-bold rounded-md ${getAttendanceStatusColor(
                                statuses as string,
                            )}`}
                            title={(statuses as string) || "N/A"}
                        >
                            {statuses || "N"}
                        </span>
                    {/if}
                </td>
            </tr>
        {/each}
    </tbody>
</table>
