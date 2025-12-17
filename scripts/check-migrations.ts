import 'dotenv/config';
import mysql from 'mysql2/promise';

/**
 * Check Migration Status
 * Shows which migrations have been applied and which are pending
 */

async function main() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ ERROR: DATABASE_URL environment variable is not set');
        process.exit(1);
    }

    console.log('🔍 Checking migration status...\n');

    let connection: mysql.Connection | undefined;

    try {
        connection = await mysql.createConnection({
            uri: databaseUrl,
            ssl: {
                rejectUnauthorized: true
            }
        });

        console.log('✅ Database connection established\n');

        // Check if migrations table exists
        const [tables] = await connection.query<any[]>(
            "SHOW TABLES LIKE '__drizzle_migrations'"
        );

        if (tables.length === 0) {
            console.log('⚠️  Migration tracking table does not exist');
            console.log('   This is normal for a fresh database\n');
            return;
        }

        // Get applied migrations
        const [migrations] = await connection.query<any[]>(
            'SELECT * FROM __drizzle_migrations ORDER BY created_at ASC'
        );

        if (migrations.length === 0) {
            console.log('📝 No migrations have been applied yet\n');
        } else {
            console.log('📋 Applied migrations:');
            migrations.forEach((m: any, idx: number) => {
                console.log(`   ${idx + 1}. ${m.hash} (${m.created_at})`);
            });
            console.log(`\n✅ Total applied: ${migrations.length} migrations\n`);
        }

        // Check for DevicePushSubscriptions table
        const [deviceTables] = await connection.query<any[]>(
            "SHOW TABLES LIKE 'DevicePushSubscriptions'"
        );

        if (deviceTables.length > 0) {
            console.log('ℹ️  DevicePushSubscriptions table EXISTS');
            console.log('   If migration fails, you may need to mark it as applied manually\n');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

main();
