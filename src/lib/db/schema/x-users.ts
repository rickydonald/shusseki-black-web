import { varchar, serial, timestamp, mysqlTable, mysqlEnum } from "drizzle-orm/mysql-core";

export const xUsers = mysqlTable("XUsers", {
    id: serial().primaryKey(),
    shussekiXUserId: varchar({ length: 191 }).notNull().unique(),
    userId: varchar({ length: 80 }).notNull().unique(),
    username: varchar({ length: 191 }).notNull(),
    password: varchar({ length: 191 }).notNull(),
    role: mysqlEnum(['mod', 'notifier', 'x-user']).default('mod').notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: varchar({ length: 191 }).notNull(),
    lastLogin: varchar({ length: 191 }).default("never")
});