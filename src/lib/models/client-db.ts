import Dexie, { type EntityTable } from 'dexie';

interface ClassTimetable {
    class_code: string;
    timetable: string;
    isActive: boolean;
    lastSyncedAt?: string;
    localVersion?: number;
}

interface TimetableUpdateNotification {
    id?: number;
    class_code: string;
    updatedAt: string;
    updatedBy: string;
    isReviewed: boolean;
    createdAt: string;
}

const clientDb = new Dexie('ShussekiClientDB') as Dexie & {
    classTimetable: EntityTable<
        ClassTimetable,
        'class_code'
    >,
    timetableUpdateNotifications: EntityTable<
        TimetableUpdateNotification,
        'id'
    >
};

clientDb.version(1).stores({
    classTimetable: 'class_code, isActive'
});

clientDb.version(2).stores({
    classTimetable: 'class_code, isActive',
    timetableUpdateNotifications: '++id, class_code, isReviewed'
}).upgrade(tx => {
    // Migration: add new fields to existing records
    return tx.table('classTimetable').toCollection().modify(timetable => {
        if (!timetable.lastSyncedAt) {
            timetable.lastSyncedAt = new Date().toISOString();
        }
        if (!timetable.localVersion) {
            timetable.localVersion = 1;
        }
    });
});

export type { ClassTimetable, TimetableUpdateNotification };
export default clientDb;