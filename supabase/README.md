# Supabase Database Migrations

This directory contains SQL migration files for the Bandly database schema.

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended for Quick Setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the contents of the migration file you want to run
5. Click **Run** to execute the SQL

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed and connected to your project:

```bash
# Apply a specific migration
supabase db push

# Or execute a specific file
supabase db execute --file ./supabase/migrations/create_band_invitations.sql
```

### Option 3: Direct Database Connection

If you have direct PostgreSQL access:

```bash
psql -h your-project.supabase.co -U postgres -d postgres -f ./supabase/migrations/create_band_invitations.sql
```

## Available Migrations

### `create_band_invitations.sql`
Creates the band invitations system including:
- `band_invitations` table
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for automatic timestamp updates

**What it creates:**
- Table for storing invitation tokens
- Security policies for band member access
- Public read access for token validation
- Automatic timestamp management

### `rollback_band_invitations.sql`
Rolls back the band_invitations migration. Use this if you need to undo the changes.

**Warning:** This will delete all invitation data!

## After Running Migrations

### 1. Verify the Migration

Check that the table was created successfully:

```sql
-- In Supabase SQL Editor
SELECT * FROM band_invitations LIMIT 1;
```

### 2. Update TypeScript Types

Generate updated type definitions for your app:

```bash
# Using Supabase CLI
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts

# Or using the direct connection string
npx supabase gen types typescript --db-url "postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres" > types/database.types.ts
```

Find your project ID in the Supabase dashboard under **Settings → General → Reference ID**

### 3. Restart Your Dev Server

After updating types, restart your development server:

```bash
npm run dev
```

## Migration Order

1. First, ensure your existing tables are in place:
   - `profiles`
   - `bands`
   - `band_members`

2. Then run the band_invitations migration

## Testing the Migration

After applying the migration, test that it works:

```sql
-- Test insert (as an authenticated user who is a band member)
INSERT INTO band_invitations (band_id, invited_by, token, max_uses, expires_at)
VALUES (
  'your-band-id',
  auth.uid(),
  'test-token-123',
  1,
  now() + interval '7 days'
);

-- Test select
SELECT * FROM band_invitations WHERE token = 'test-token-123';

-- Clean up test data
DELETE FROM band_invitations WHERE token = 'test-token-123';
```

## Troubleshooting

### Error: relation "bands" does not exist
- The `bands` table needs to exist before creating `band_invitations`
- Create the `bands` table first

### Error: relation "profiles" does not exist
- The `profiles` table needs to exist before creating `band_invitations`
- Create the `profiles` table first

### Error: function auth.uid() does not exist
- Make sure you're running this on Supabase, not a plain PostgreSQL instance
- Supabase provides the `auth.uid()` function for RLS

### RLS policies not working
- Check that RLS is enabled: `ALTER TABLE band_invitations ENABLE ROW LEVEL SECURITY;`
- Verify your user has an active band membership in the `band_members` table
- Check policy conditions match your data structure

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase SQL Editor Guide](https://supabase.com/docs/guides/database/sql-editor)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
