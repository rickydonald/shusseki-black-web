# Database Migrations Guide

This guide explains how to manage database migrations for the Shusseki project using Drizzle ORM.

## Prerequisites

- MySQL database (local or production)
- `DATABASE_URL` environment variable set

## Available Commands

### Development

```bash
# Generate new migration files from schema changes
npm run db:generate

# Push schema changes directly to database (skip migrations)
npm run db:push

# Open Drizzle Studio to view/edit database
npm run db:studio
```

### Production

```bash
# Run migrations on production database
npm run db:migrate:prod
```

## Workflow

### 1. Making Schema Changes

1. Edit your schema in `src/lib/db/schema.ts`
2. Generate migration files:
   ```bash
   npm run db:generate
   ```
3. Review the generated SQL in `drizzle/` folder
4. Commit the migration files to version control

### 2. Development Database

For quick iteration during development:

```bash
# Push changes directly without migrations
npm run db:push
```

Or apply migrations:
```bash
npm run db:migrate:prod
```

### 3. Production Deployment

#### Option A: Manual Migration

1. Set production DATABASE_URL:
   ```bash
   export DATABASE_URL="mysql://user:password@host:port/database"
   ```

2. Run migrations:
   ```bash
   npm run db:migrate:prod
   ```

#### Option B: Automated Migration (CI/CD)

Add to your deployment pipeline (e.g., Vercel, GitHub Actions):

```yaml
# Example for GitHub Actions
- name: Run Database Migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: npm run db:migrate:prod
```

For Vercel, add to `vercel.json`:
```json
{
  "buildCommand": "npm run db:migrate:prod && npm run build"
}
```

## Migration Files

Migrations are stored in `drizzle/` folder:
- `XXXX_migration_name.sql` - SQL migration files
- `meta/` - Metadata for tracking applied migrations

## Security Best Practices

### Production

- ✅ Always use SSL connections (configured in `drizzle.config.ts`)
- ✅ Store `DATABASE_URL` in environment variables
- ✅ Never commit `.env` files
- ✅ Test migrations on staging before production
- ✅ Backup database before running migrations

### Environment Variables

```bash
# .env (never commit this)
DATABASE_URL="mysql://user:password@host:3306/database"
```

## Troubleshooting

### Connection Issues

```bash
# Test database connection
npx tsx scripts/migrate.ts
```

### Migration Failed Midway

1. Check which migrations were applied
2. Manually fix the database if needed
3. Update migration tracking in `__drizzle_migrations` table
4. Re-run migrations

### Roll Back Migration

Drizzle doesn't support automatic rollbacks. To rollback:
1. Create a new migration that reverses changes
2. Or manually restore from database backup

## Examples

### Generate Migration for New Table

```typescript
// src/lib/db/schema.ts
export const newTable = mysqlTable('new_table', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});
```

```bash
npm run db:generate
# Review generated SQL in drizzle/
git add drizzle/
git commit -m "Add new_table migration"
```

### Production Deployment

```bash
# On production server
git pull origin main
npm install
DATABASE_URL="mysql://..." npm run db:migrate:prod
npm run build
npm start
```

## Monitoring

Check migration status by querying:
```sql
SELECT * FROM __drizzle_migrations ORDER BY created_at DESC;
```

## Support

For issues or questions:
- Check Drizzle docs: https://orm.drizzle.team/
- Review migration SQL files in `drizzle/` folder
- Check application logs for errors
