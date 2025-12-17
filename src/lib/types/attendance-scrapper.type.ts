export type StudentInfo = {
    name: string;
    registerNumber: string;
}

export type AttendanceRecord = {
    [date: string]: string[];
}

export type BirthdayInfo = {
    isBirthday: boolean;
    yearGap: number;
}

export type LifeSkillAttendanceRecord = {
    entries: Record<string, string>;
    presentCount: number;
    totalRows: number;
}

/**
 * AttendanceFormat interface returns percentage and hours.
 * @object percentages: present, absent, medical, casual, onduty in percentages.
 * @object hours: Returns present, absent, medical, casual, onduty in hours.
 */
export interface AttendanceFormat {
    totalWorkingDays?: number;
    percentages: {
        present: number;
        absent: number;
        medical: number;
        casual: number;
        onduty: number;
    };
    hours: {
        present: number;
        absent: number;
        medical: number;
        casual: number;
        onduty: number;
        total: number;
    };
}

/**
 * Attendance
 */
export type Attendance = {
    student: StudentInfo;
    summary: AttendanceFormat;
    attendance: AttendanceRecord;
    lifeSkill: LifeSkillAttendanceRecord;
}
