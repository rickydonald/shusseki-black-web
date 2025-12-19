/**
 * Function to normalize Department Number (DNO)
 * @param input Department Number
 * @returns Normalized Department Number
 */
export function normalizeDno(input: string): string {
    const cleaned = input.replace(/\s+/g, "").toUpperCase();

    const defaultFormat = /^\d{2}-[A-Z]{3}-\d{3}$/;
    if (defaultFormat.test(input)) {
        return input;
    }

    const match = cleaned.match(/^(\d{2})([A-Z]{3})(\d{3})$/);
    if (match) {
        const [, digits, letters, numbers] = match;
        return `${digits}-${letters}-${numbers}`;
    }

    return input;
}


/**
 * Function to return status color
 * @param status string
 * @returns 
 */
export const getAttendanceStatusColor = (status: string) => {
    const map: Record<string, string> = {
        P: 'bg-green-200 text-green-800',
        A: 'bg-red-200 text-red-800',
        L: 'bg-yellow-200 text-yellow-800',
        CL: 'bg-purple-200 text-purple-800',
        OD: 'bg-blue-200 text-blue-800',
        ML: 'bg-orange-200 text-orange-800',
        DA: 'bg-black text-white',
        AR: 'bg-teal-200 text-teal-800',
        SL: "bg-yellow-300 text-yellow-900",
    };
    return map[status] ?? 'bg-gray-100 text-gray-800';
};