import type { ClassTimetable } from "$lib/models/client-db";
import { mysqlTable, varchar, mysqlEnum, serial, timestamp, boolean, json, int } from "drizzle-orm/mysql-core"

/** User Feedbacks Schema */
export const userFeedbacks = mysqlTable("UserFeedback", {
	id: serial().primaryKey(),
	feedbackId: varchar({ length: 191 }).notNull().unique(),
	userId: varchar({ length: 191 }).notNull(),
	feedbackType: mysqlEnum(['bug', 'feature', 'problem', 'suggestion', 'others']).default('others').notNull(),
	feedback: varchar({ length: 500 }).notNull(),
	isReplied: boolean().default(false).notNull(),
	reply: varchar({ length: 500 }),
	createdAt: timestamp().defaultNow(),
	updatedAt: varchar({ length: 191 }).notNull(),
	subject: varchar({ length: 191 }).notNull(),
	errorCode: varchar({ length: 191 }),
});

/** User Schema */
export const users = mysqlTable("Users", {
	id: serial().primaryKey(),
	userId: varchar({ length: 191 }).notNull().unique(),
	name: varchar({ length: 191 }).default('Guest'),
	dobHash: varchar({ length: 191 }).notNull(),
	shift: int().default(0),
	isBanned: boolean().default(false).notNull(),
	userType: mysqlEnum(['user', 'x-admin-user']).default('user').notNull(),
	createdAt: timestamp().defaultNow(),
	createdAtServer: varchar({ length: 191 }),
	lastLogin: varchar({ length: 191 }).default("start")
});

/** Class Timetables Schema */
export const classTimetables = mysqlTable("ClassTimetables", {
	id: serial().primaryKey(),
	userId: varchar({ length: 80 }).notNull(),
	classCode: varchar({ length: 80 }).notNull(),
	timetable: json().$type<ClassTimetable["timetable"]>().notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp().defaultNow(),
	updatedAt: varchar({ length: 191 }).notNull(),
})

/** Push Subscriptions Schema */
export const pushSubscriptions = mysqlTable("DevicePushSubscriptions", {
	id: serial().primaryKey(),
	userId: varchar({ length: 80 }).notNull(),
	deviceId: varchar({ length: 80 }).notNull(),
	subscription: json().$type<PushSubscriptionJSON>().notNull(),
	createdAt: varchar({ length: 191 }).notNull(),
	updatedAt: varchar({ length: 191 }).notNull(),
})

/** Push Notification History Schema */
export const pushNotificationHistory = mysqlTable("PushNotificationHistory", {
	id: serial().primaryKey(),
	notificationId: varchar({ length: 191 }).notNull().unique(),
	userId: varchar({ length: 80 }),
	targetType: mysqlEnum(['single', 'multiple', 'broadcast']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	body: varchar({ length: 500 }).notNull(),
	icon: varchar({ length: 255 }),
	badge: varchar({ length: 255 }),
	data: json(),
	sentCount: int().default(0).notNull(),
	failedCount: int().default(0).notNull(),
	sentBy: varchar({ length: 80 }),
	createdAt: timestamp().defaultNow(),
})