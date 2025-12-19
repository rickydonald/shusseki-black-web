import type { AttendanceFormat, AttendanceRecord } from "./types/attendance-scrapper.type";

interface AttendanceSummaryProps {
    hoursPresent: string | number;
    hoursAbsent: string | number;
    hoursCL: string | number;
    hoursML: string | number;
    hoursOD: string | number;
}
/**
 * Returns formatted and calculate percentage and hours of all stats.
 * @param data AttendanceSummaryProps
 * @returns AttendanceFormat
 */
export function attendanceFormatter(data: AttendanceSummaryProps, overrideCode?: string): AttendanceFormat {
    let present = Number(data.hoursPresent);
    let absent = Number(data.hoursAbsent);
    let cl = Number(data.hoursCL);
    let ml = Number(data.hoursML);
    let od = Number(data.hoursOD);

    const totalHours = present + absent + cl + ml + od;
    const percent = (val: number) => totalHours > 0 ? Number(((val / totalHours) * 100).toFixed(1)) : 0;

    return {
        percentages: {
            present: percent(present),
            absent: percent(absent),
            onduty: percent(od),
            casual: percent(cl),
            medical: percent(ml),
        },
        hours: {
            present,
            absent,
            onduty: od,
            casual: cl,
            medical: ml,
            total: totalHours
        },
    };
}

export const buildCookieHeader = (session: any) =>
    session.cookies
        .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
        .join("; ");