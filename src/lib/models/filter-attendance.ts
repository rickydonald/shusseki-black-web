type AttendanceData = Record<string, string[]>;

interface FilterOptions {
    month?: string;              // e.g. "Sep-2025"
    date?: string;               // e.g. "09-Sep-2025"
    status?: string | string[];  // e.g. "P" | ["A","OD"] | "!P" | "*"
}

export interface Filter {
    records: Record<string, string[]>;
    counts: Record<string, number>;
    total: number;
}

/**
 * Filters attendance data while preserving array positions.
 * - Accepts multiple statuses (array).
 * - Replaces non-matching hours with "".
 * - If no match anywhere, returns {} with counts = {} and total = 0.
 *
 * Supports:
 *  - Exact match: status = "P" or ["P","A"]
 *  - Empty status match: status = ""
 *  - Wildcard (all): status = "*"
 *  - Exclusion: status = "!A" or ["!A","!P"]
 *  - Case-insensitive matching
 */
export function filterAttendance(
    data: AttendanceData,
    options: FilterOptions
): Filter {
    const { month, date, status } = options;

    const result: Record<string, string[]> = {};
    const counts: Record<string, number> = {};
    let total = 0;

    // Normalize status into lowercased array
    const statusArray: string[] = status
        ? (Array.isArray(status) ? status : [status]).map((s) => s.trim().toLowerCase())
        : [];

    for (const [day, records] of Object.entries(data)) {
        if (month && !day.includes(month)) continue;
        if (date && day !== date) continue;

        let filtered: string[];

        if (statusArray.length === 0 || statusArray.includes("*")) {
            filtered = [...records];
        } else {
            filtered = records.map((r) => {
                const lower = r?.toLowerCase() ?? "";
                const match = statusArray.some((s) => {
                    if (s.startsWith("!")) return lower !== s.slice(1);
                    return lower === s;
                });
                return match ? r : "";
            });
        }

        if (filtered.every((v) => v === "")) continue;

        result[day] = filtered;

        for (const r of filtered) {
            if (r !== "") {
                counts[r] = (counts[r] || 0) + 1;
                total++;
            }
        }
    }

    if (Object.keys(result).length === 0) {
        return { records: {}, counts: {}, total: 0 };
    }

    return { records: result, counts, total };
}