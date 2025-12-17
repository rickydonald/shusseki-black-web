import 'dotenv/config';
import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

/**
 * Fix Migration Tracking
 * Marks existing tables as migrated to prevent "table already exists" errors
 * 
 * Usage:
 * npm run db:fix-migrations
 */

async function main() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ ERROR: DATABASE_URL environment variable is not set');
        process.exit(1);
    }

    console.log('🔧 Starting migration fix process...\n');

    let connection: mysql.Connection | undefined;

    try {
        connection = await mysql.createConnection({
            uri: databaseUrl,
            ssl: {
                rejectUnauthorized: true
            }
        });

        console.log('✅ Database connection established\n');

        // Ensure migrations table exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS __drizzle_migrations (
                id SERIAL PRIMARY KEY,
                hash text NOT NULL,
                created_at bigint
            )
        `);

        console.log('✅ Migration tracking table ready\n');

        // Get current applied migrations
        const [existingMigrations] = await connection.query<any[]>(
            'SELECT hash FROM __drizzle_migrations'
        );
        const appliedHashes = new Set(existingMigrations.map(m => m.hash));

        // Read all migration files
        const migrationsDir = path.join(process.cwd(), 'drizzle');
        const journalPath = path.join(migrationsDir, 'meta', '_journal.json');
        
        if (!fs.existsSync(journalPath)) {
            console.error('❌ Migration journal not found');
            process.exit(1);
        }

        const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));

        console.log('📋 Checking migrations...\n');

        for (const entry of journal.entries) {
            const migrationFile = path.join(migrationsDir, `${entry.tag}.sql`);
            
            if (!fs.existsSync(migrationFile)) {
                console.log(`⚠️  Skipping ${entry.tag} (file not found)`);
                continue;
            }

            const sql = fs.readFileSync(migrationFile, 'utf-8');
            const hash = createHash('sha256').update(sql).digest('hex');

            if (appliedHashes.has(hash)) {
                console.log(`✅ ${entry.tag} - Already applied`);
            } else {
                // Check if the tables from this migration already exist
                const tableMatch = sql.match(/CREATE TABLE `(\w+)`/);
                
                if (tableMatch) {
                    const tableName = tableMatch[1];
                    const [tables] = await connection.query<any[]>(
                        `SHOW TABLES LIKE '${tableName}'`
                    );

                    if (tables.length > 0) {
                        // Table exists, mark migration as applied
                        await connection.query(
                            'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
                            [hash, Date.now()]
                        );
                        console.log(`🔧 ${entry.tag} - Table exists, marked as applied`);
                    } else {
                        console.log(`⏭️  ${entry.tag} - Pending (will be applied on next migrate)`);
                    }
                } else {
                    console.log(`⏭️  ${entry.tag} - Pending (ALTER/other operation)`);
                }
            }
        }

        console.log('\n✅ Migration tracking fixed successfully!');
        console.log('💡 You can now run: npm run db:migrate:prod\n');

    } catch (error) {
        console.error('❌ Fix failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

main();
