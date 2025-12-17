import { writable } from 'svelte/store';
import type { AttendanceResponse } from '$lib/models/attendance-scrapper';

export const scrapperStore = writable<AttendanceResponse | null>(null);