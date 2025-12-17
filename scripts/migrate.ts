import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

/**
 * Production Migration Script
 * Applies all pending migrations to the database
 * 
 * Usage:
 * npm run db:migrate:prod
 * 
 * Or with custom DATABASE_URL:
 * DATABASE_URL="mysql://..." npm run db:migrate:prod
 */

async function main() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ ERROR: DATABASE_URL environment variable is not set');
        process.exit(1);
    }

    console.log('🔄 Starting migration process...');
    console.log(`📍 Database: ${databaseUrl.replace(/:[^:]*@/, ':***@')}`);

    let connection: mysql.Connection | undefined;

    try {
        // Create MySQL connection
        connection = await mysql.createConnection({
            uri: databaseUrl,
            ssl: {
                rejectUnauthorized: true
            }
        });

        console.log('✅ Database connection established');

        // Create Drizzle instance
        const db = drizzle(connection);

        // Run migrations
        console.log('🚀 Applying migrations...');
        await migrate(db, { migrationsFolder: './drizzle' });

        console.log('✅ Migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

main();
