/**
 * Formats a date string from ISO format (YYYY-MM-DD) to DMY format (DD/MM/YYYY).
 * @param dateStr - A date string in the format YYYY-MM-DD
 * @returns 
 */
export default {
    formatDateISOToDMY(dateStr: string): string {
        const parts = dateStr.split('-');

        if (parts.length !== 3) {
            throw new Error('Invalid date format. Expected YYYY-MM-DD');
        }

        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    },
    capitalizeWords(str: string): string {
        if (!str) return "";
        return str
            .trim()
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
    },
    format(num: string | number) {
        const n = Number(num) || 0;
        if (n % 1 === 0) {
            return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
        }
        return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
    },
    greet(): string {
        let currentHour = new Date().getHours();

        if (currentHour < 12) {
            return "Morning";
        } else if (currentHour < 18) {
            return "Afternoon";
        } else {
            return "Evening";
        }
    }
}