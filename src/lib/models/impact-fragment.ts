import type { Attendance } from "$lib/types/attendance-scrapper.type";
import academicCalendar from "$lib/data/academic_calendar.json";
import { DateTime } from "luxon";

export type GeniusRecommendation = {
    percentage: number;
    canSkip: number;
    mustAttend: number;
    predictedIfSkip: number;
    predictedIfAttend: number;
    predictedAfterOneDay: number;
    daysToAttend: number;
    recommendation: string;
    contextMessage?: string;
};

type CalendarEvent = {
    date: string;
    day: string;
    events: string[];
    day_order: string | null;
    is_exam: boolean;
    exam_type: string | null;
};

function getUpcomingContext(): { isExamWeek: boolean; daysUntilExam: number; examType: string | null; isHolidaySoon: boolean } {
    const today = DateTime.now().setZone("Asia/Kolkata");
    const calendar = academicCalendar as CalendarEvent[];
    
    // Find upcoming exams in next 7 days
    let isExamWeek = false;
    let daysUntilExam = -1;
    let examType: string | null = null;
    let isHolidaySoon = false;
    
    for (let i = 0; i < 7; i++) {
        const checkDate = today.plus({ days: i });
        const dateStr = checkDate.toFormat("dd.MM.yyyy");
        
        const dayInfo = calendar.find(c => c.date === dateStr);
        
        if (dayInfo) {
            if (dayInfo.is_exam && daysUntilExam === -1) {
                isExamWeek = true;
                daysUntilExam = i;
                examType = dayInfo.exam_type;
            }
            
            if (dayInfo.day_order === null && dayInfo.events.length > 0 && i <= 3) {
                isHolidaySoon = true;
            }
        }
    }
    
    return { isExamWeek, daysUntilExam, examType, isHolidaySoon };
}

export function getAttendanceRecommendation(
    summary: Attendance["summary"]["hours"],
    minPercentage: number = 80
): GeniusRecommendation {
    let present = summary.present;
    let absent = summary.absent + summary.casual + summary.medical + summary.onduty;
    let total = present + absent;

    let percentage = parseFloat(((present / total) * 100).toFixed(1));

    // Get academic calendar context
    const { isExamWeek, daysUntilExam, examType, isHolidaySoon } = getUpcomingContext();

    // Calculate safe bunks
    let canSkip = 0;
    while (((present / (total + canSkip + 1)) * 100) >= minPercentage) {
        canSkip++;
    }

    // Calculate required attendance if below threshold
    let mustAttend = 0;
    if (percentage < minPercentage) {
        while (((present + mustAttend + 1) / (total + mustAttend + 1)) * 100 < minPercentage) {
            mustAttend++;
        }
    }

    // Predicted percentages
    const predictedIfSkip = parseFloat(((present / (total + 1)) * 100).toFixed(1));
    const predictedIfAttend = parseFloat((((present + 1) / (total + 1)) * 100).toFixed(1));
    const predictedAfterOneDay = parseFloat((((present + 5) / (total + 5)) * 100).toFixed(1));

    let recommendation = "";
    let contextMessage = "";
    let daysToAttend = 0;

    // Exam week logic - prioritize attendance
    if (isExamWeek && daysUntilExam <= 2) {
        if (percentage >= minPercentage) {
            if (percentage >= 85) {
                recommendation = "You're doing great! Focus on exam prep, but don't skip classes.";
                contextMessage = `${examType} in ${daysUntilExam === 0 ? 'today' : daysUntilExam === 1 ? 'tomorrow' : `${daysUntilExam} days`}`;
            } else {
                recommendation = "Attend classes to stay above 80%. Exams are approaching!";
                contextMessage = `${examType} in ${daysUntilExam === 0 ? 'today' : daysUntilExam === 1 ? 'tomorrow' : `${daysUntilExam} days`}`;
            }
        } else {
            const hoursNeeded = mustAttend + 1;
            const daysNeeded = Math.ceil(hoursNeeded / 5);
            recommendation = `Attend next ${hoursNeeded} hour${hoursNeeded > 1 ? 's' : ''} (${daysNeeded} day${daysNeeded > 1 ? 's' : ''}) to reach 80% before exams.`;
            contextMessage = `${examType} in ${daysUntilExam === 0 ? 'today' : daysUntilExam === 1 ? 'tomorrow' : `${daysUntilExam} days`}`;
            daysToAttend = daysNeeded;
        }
    }
    // Holiday coming - encourage attendance
    else if (isHolidaySoon && percentage < 85) {
        if (percentage >= minPercentage) {
            recommendation = "Holiday approaching! Attend classes to build a buffer.";
            contextMessage = "Build your attendance cushion";
        } else {
            const hoursNeeded = mustAttend + 1;
            const daysNeeded = Math.ceil(hoursNeeded / 5);
            recommendation = `Attend next ${hoursNeeded} hour${hoursNeeded > 1 ? 's' : ''} (${daysNeeded} day${daysNeeded > 1 ? 's' : ''}) before the break.`;
            contextMessage = "Recover before holiday";
            daysToAttend = daysNeeded;
        }
    }
    // Normal recommendations
    else if (percentage >= minPercentage) {
        const daysCanSkip = Math.floor(canSkip / 5);
        const hoursCanSkip = canSkip % 5;
        
        if (canSkip >= 5) {
            if (daysCanSkip === 1 && hoursCanSkip === 0) {
                recommendation = `You can safely skip 5 hours (1 day).`;
            } else if (hoursCanSkip === 0) {
                recommendation = `You can safely skip ${canSkip} hours (${daysCanSkip} days).`;
            } else {
                recommendation = `You can skip ${canSkip} hours (${daysCanSkip} day${daysCanSkip > 1 ? 's' : ''} + ${hoursCanSkip} hour${hoursCanSkip > 1 ? 's' : ''})`;
            }
        } else if (canSkip > 0) {
            recommendation = `You can skip ${canSkip} hour${canSkip > 1 ? 's' : ''} safely.`;
        } else {
            recommendation = "You're at the minimum! Attend all classes to stay safe.";
        }
        
        daysToAttend = 0;
    } else {
        const daysNeeded = Math.ceil((mustAttend + 1) / 5);
        const hoursNeeded = mustAttend + 1;
        
        if (hoursNeeded <= 5) {
            recommendation = `Attend next ${hoursNeeded} hour${hoursNeeded > 1 ? 's' : ''} to reach 80%.`;
        } else if (daysNeeded === 1) {
            recommendation = `Attend next 5 hours (1 full day) to reach 80%.`;
        } else {
            recommendation = `Attend next ${hoursNeeded} hours (${daysNeeded} days) to reach 80%.`;
        }
        
        contextMessage = "";
        daysToAttend = daysNeeded;
    }

    return {
        percentage,
        canSkip,
        mustAttend,
        predictedIfSkip,
        predictedIfAttend,
        predictedAfterOneDay,
        daysToAttend,
        recommendation,
        contextMessage: contextMessage || undefined,
    };
}