import { writable } from 'svelte/store';
import type { AttendanceResponse } from '$lib/models/attendance-scrapper';
import type { StudentProfile } from '$lib/models/erp-scrapper/profile';

export const scrapperStore = writable<AttendanceResponse | null>(null);
export const scrapperProfileStore = writable<StudentProfile | null>(null)