# PostgreSQL Database Setup Guide for Rent-Manager

This guide will help you set up and manage the PostgreSQL database for the Rent-Manager application.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Database Configuration](#database-configuration)
- [Running Migrations](#running-migrations)
- [Switching Between In-Memory and PostgreSQL](#switching-between-in-memory-and-postgresql)
- [Common Migration Commands](#common-migration-commands)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### 1. Install PostgreSQL

#### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### On macOS (using Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### On Windows:
Download and install from [PostgreSQL Official Website](https://www.postgresql.org/download/windows/)

### 2. Verify PostgreSQL Installation
```bash
psql --version
```

### 3. Install EF Core Tools (Already installed)
The `dotnet-ef` tool has already been installed globally. Verify with:
```bash
dotnet ef --version
```

## Database Configuration

### 1. Create PostgreSQL Database

Connect to PostgreSQL as the postgres user:
```bash
sudo -u postgres psql
```

Create the database and user:
```sql
CREATE DATABASE rentmanager;
CREATE USER rentmanager_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE rentmanager TO rentmanager_user;

-- Grant schema privileges (PostgreSQL 15+)
\c rentmanager
GRANT ALL ON SCHEMA public TO rentmanager_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rentmanager_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rentmanager_user;

-- Exit psql
\q
```

### 2. Update Connection String

Edit `/backend/RentManager.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=rentmanager;Username=rentmanager_user;Password=your_secure_password"
  },
  "UsePostgres": true
}
```

**Important Security Notes:**
- Never commit `appsettings.json` with real passwords to version control
- Use User Secrets for development: `dotnet user-secrets set "ConnectionStrings:DefaultConnection" "your-connection-string"`
- Use environment variables in production

### 3. Using Environment Variables (Recommended)

Set environment variable for the connection string:

**Linux/macOS:**
```bash
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=rentmanager;Username=rentmanager_user;Password=your_secure_password"
export UsePostgres=true
```

**Windows PowerShell:**
```powershell
$env:ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=rentmanager;Username=rentmanager_user;Password=your_secure_password"
$env:UsePostgres="true"
```

## Running Migrations

### Initial Migration (Already Created)

The initial migration has already been created at:
- `/backend/RentManager.API/Data/Migrations/20251017203001_InitialCreate.cs`

### Apply Migrations to Database

Navigate to the API project directory:
```bash
cd /home/adrian/IT\ Projects/Rent-Manager/backend/RentManager.API
```

Apply migrations to create database schema:
```bash
dotnet ef database update
```

You should see output like:
```
Build started...
Build succeeded.
Applying migration '20251017203001_InitialCreate'.
Done.
```

### Verify Database Schema

Connect to the database:
```bash
psql -h localhost -U rentmanager_user -d rentmanager
```

List tables:
```sql
\dt
```

You should see:
- users
- properties
- tenants
- payments
- contracts
- tenant_invitations
- __EFMigrationsHistory

View a table structure:
```sql
\d users
```

## Switching Between In-Memory and PostgreSQL

The application supports both in-memory storage (for development/testing) and PostgreSQL (for production).

### Use In-Memory Storage (Default)

Set in `appsettings.json`:
```json
{
  "UsePostgres": false
}
```

Or via environment variable:
```bash
export UsePostgres=false
```

### Use PostgreSQL

Set in `appsettings.json`:
```json
{
  "UsePostgres": true
}
```

Or via environment variable:
```bash
export UsePostgres=true
```

## Common Migration Commands

### Create a New Migration

When you modify models, create a new migration:
```bash
cd backend/RentManager.API
dotnet ef migrations add MigrationName --output-dir Data/Migrations
```

### Apply Migrations
```bash
dotnet ef database update
```

### Rollback to a Specific Migration
```bash
dotnet ef database update PreviousMigrationName
```

### Remove Last Migration (if not applied)
```bash
dotnet ef migrations remove
```

### List All Migrations
```bash
dotnet ef migrations list
```

### Generate SQL Script (for review or manual execution)
```bash
dotnet ef migrations script
```

### Generate SQL Script for Specific Migration Range
```bash
dotnet ef migrations script FromMigration ToMigration
```

### Update to Specific Migration
```bash
dotnet ef database update 20251017203001_InitialCreate
```

### Reset Database (DESTRUCTIVE - Development Only)
```bash
dotnet ef database drop --force
dotnet ef database update
```

## Database Schema

### Tables Created by InitialCreate Migration

#### 1. **users**
- Stores user accounts (property owners, renters, admins)
- Columns: id, email (unique), name, password_hash, role, is_active, created_at, updated_at, last_login_at, tenant_id, property_ids (jsonb)

#### 2. **properties**
- Stores rental properties
- Columns: id, name, address, type, bedrooms, bathrooms, rent_amount, description, parking_type, space_number, square_footage, created_at, updated_at

#### 3. **tenants**
- Stores tenant information with support for Person and Company types
- Columns: id, tenant_type, email, phone, property_id, lease_start, lease_end, rent_amount, deposit, status, person_details (json), company_details (json), created_at, updated_at

#### 4. **payments**
- Stores rent payment records
- Columns: id, tenant_id, amount, date, method, status, notes, created_at, updated_at
- Indexes: tenant_id, date

#### 5. **contracts**
- Stores lease contract documents
- Columns: id, property_id, tenant_id, file_name, file_content_base64, mime_type, file_size_bytes, uploaded_at, signed_at, status, notes
- Indexes: property_id, tenant_id

#### 6. **tenant_invitations**
- Stores tenant onboarding invitations
- Columns: id, property_id, email, invitation_token (unique), expires_at, status, invited_by_user_id, rent_amount, lease_start, lease_end, deposit, created_at, updated_at
- Indexes: invitation_token (unique), property_id, email

### Data Types and Constraints

- **Primary Keys**: All tables use string-based UUIDs
- **Decimal Precision**: Money fields use `decimal(18,2)`
- **Enums**: Stored as strings (e.g., 'Active', 'Pending', 'Completed')
- **JSON Fields**:
  - `users.property_ids`: jsonb array
  - `tenants.person_details`: json object
  - `tenants.company_details`: json object

## Troubleshooting

### Migration Build Errors

If you get build errors when running migrations:
```bash
dotnet build
dotnet ef migrations add MigrationName
```

### Connection Issues

Test PostgreSQL connection:
```bash
psql -h localhost -U rentmanager_user -d rentmanager
```

If connection fails:
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify pg_hba.conf allows local connections
3. Check firewall settings
4. Verify username/password

### Permission Errors

Grant proper permissions:
```sql
\c rentmanager
GRANT ALL ON SCHEMA public TO rentmanager_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rentmanager_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rentmanager_user;
```

### Reset Migrations (Development Only)

If migrations become corrupted:
```bash
# Delete Migrations folder
rm -rf Data/Migrations

# Drop database
dotnet ef database drop --force

# Recreate initial migration
dotnet ef migrations add InitialCreate --output-dir Data/Migrations

# Apply migration
dotnet ef database update
```

### View Migration Status
```bash
dotnet ef migrations list
```

Shows applied (*) and pending migrations.

## Best Practices

### Development
- Use in-memory database for unit tests
- Use local PostgreSQL for integration tests
- Keep migrations small and focused
- Always test migrations before applying to production

### Production
- Use environment variables for connection strings
- Enable SSL for database connections
- Regular database backups
- Use read replicas for scaling
- Monitor query performance

### Migration Workflow
1. Modify your model classes
2. Create migration: `dotnet ef migrations add DescriptiveName`
3. Review generated migration code
4. Test migration: `dotnet ef database update`
5. Verify schema changes
6. Commit migration files to version control

## Additional Resources

- [Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core/)
- [Npgsql Entity Framework Core Provider](https://www.npgsql.org/efcore/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [EF Core Migrations](https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/)

## Quick Start Checklist

- [ ] Install PostgreSQL
- [ ] Create database and user
- [ ] Update connection string in appsettings.json or environment variables
- [ ] Set `UsePostgres: true`
- [ ] Run `dotnet ef database update`
- [ ] Verify tables created: `psql -U rentmanager_user -d rentmanager -c "\dt"`
- [ ] Start application and test endpoints

---

**Generated Date**: 2025-10-17
**Migration Version**: InitialCreate (20251017203001)
