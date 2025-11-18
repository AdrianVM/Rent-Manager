import { Pool, PoolClient } from 'pg';

/**
 * Database Helper for E2E Tests
 *
 * Provides utilities for database operations during test setup and teardown
 */

let pool: Pool | null = null;

/**
 * Get or create database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'rentmanager_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }

  return pool;
}

/**
 * Close database connection pool
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Execute a SQL query
 *
 * @param query - SQL query string
 * @param params - Query parameters
 * @returns Query result
 */
export async function executeQuery(query: string, params: any[] = []) {
  const dbPool = getPool();
  try {
    const result = await dbPool.query(query, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Setup test database
 * - Seeds test users if they don't exist
 * - Creates necessary test data
 */
export async function setupTestDatabase() {
  console.log('  → Setting up test database...');

  try {
    // Check database connection
    await executeQuery('SELECT NOW()');
    console.log('  → Database connection successful');

    // You can add additional setup logic here, such as:
    // - Creating test users (if not managed by Zitadel)
    // - Seeding reference data
    // - Setting up test properties, tenants, etc.

    console.log('  → Test database setup complete');
  } catch (error) {
    console.error('  ❌ Failed to setup test database:', error);
    throw error;
  }
}

/**
 * Cleanup test database
 * - Removes test data created during tests
 * - Optionally resets database to clean state
 */
export async function cleanupTestDatabase() {
  console.log('  → Cleaning up test database...');

  try {
    // Clean up test data in reverse order of foreign key dependencies
    const cleanupQueries = [
      'DELETE FROM "PaymentTransactions" WHERE "CreatedAt" > NOW() - INTERVAL \'1 day\'',
      'DELETE FROM "Payments" WHERE "CreatedAt" > NOW() - INTERVAL \'1 day\'',
      'DELETE FROM "MaintenanceRequests" WHERE "CreatedAt" > NOW() - INTERVAL \'1 day\'',
      'DELETE FROM "LeaseAgreements" WHERE "CreatedAt" > NOW() - INTERVAL \'1 day\'',
      'DELETE FROM "Properties" WHERE "Name" LIKE \'Test%\' OR "CreatedAt" > NOW() - INTERVAL \'1 day\'',
      // Add more cleanup queries as needed for your schema
    ];

    for (const query of cleanupQueries) {
      try {
        await executeQuery(query);
      } catch (error) {
        console.warn(`  ⚠️  Cleanup query failed: ${query}`, error);
        // Continue with other cleanup queries
      }
    }

    console.log('  → Test database cleanup complete');
  } catch (error) {
    console.error('  ❌ Failed to cleanup test database:', error);
    throw error;
  } finally {
    await closePool();
  }
}

/**
 * Get a test user by email
 *
 * @param email - User email
 * @returns User object or null
 */
export async function getTestUser(email: string) {
  const result = await executeQuery(
    'SELECT * FROM "Users" WHERE "Email" = $1',
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Create test property
 *
 * @param propertyData - Property data
 * @returns Created property ID
 */
export async function createTestProperty(propertyData: {
  name: string;
  address: string;
  ownerId: string;
  monthlyRent?: number;
  bedrooms?: number;
  bathrooms?: number;
}) {
  const query = `
    INSERT INTO "Properties" ("Name", "Address", "OwnerId", "MonthlyRent", "Bedrooms", "Bathrooms", "CreatedAt", "UpdatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING "Id"
  `;

  const params = [
    propertyData.name,
    propertyData.address,
    propertyData.ownerId,
    propertyData.monthlyRent || 1000,
    propertyData.bedrooms || 2,
    propertyData.bathrooms || 1,
  ];

  const result = await executeQuery(query, params);
  return result.rows[0].Id;
}

/**
 * Delete test property
 *
 * @param propertyId - Property ID to delete
 */
export async function deleteTestProperty(propertyId: string) {
  await executeQuery('DELETE FROM "Properties" WHERE "Id" = $1', [propertyId]);
}

/**
 * Create test lease agreement
 *
 * @param leaseData - Lease data
 * @returns Created lease ID
 */
export async function createTestLease(leaseData: {
  propertyId: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
}) {
  const query = `
    INSERT INTO "LeaseAgreements" ("PropertyId", "TenantId", "StartDate", "EndDate", "MonthlyRent", "Status", "CreatedAt", "UpdatedAt")
    VALUES ($1, $2, $3, $4, $5, 'Active', NOW(), NOW())
    RETURNING "Id"
  `;

  const params = [
    leaseData.propertyId,
    leaseData.tenantId,
    leaseData.startDate,
    leaseData.endDate,
    leaseData.monthlyRent,
  ];

  const result = await executeQuery(query, params);
  return result.rows[0].Id;
}

/**
 * Delete test lease agreement
 *
 * @param leaseId - Lease ID to delete
 */
export async function deleteTestLease(leaseId: string) {
  await executeQuery('DELETE FROM "LeaseAgreements" WHERE "Id" = $1', [leaseId]);
}

/**
 * Get all test data created in the last N hours
 *
 * @param hours - Number of hours to look back
 * @returns Object with counts of test data
 */
export async function getTestDataStats(hours: number = 24) {
  const interval = `${hours} hours`;

  const stats = {
    properties: await executeQuery(
      `SELECT COUNT(*) FROM "Properties" WHERE "CreatedAt" > NOW() - INTERVAL '${interval}'`
    ),
    leases: await executeQuery(
      `SELECT COUNT(*) FROM "LeaseAgreements" WHERE "CreatedAt" > NOW() - INTERVAL '${interval}'`
    ),
    payments: await executeQuery(
      `SELECT COUNT(*) FROM "Payments" WHERE "CreatedAt" > NOW() - INTERVAL '${interval}'`
    ),
    maintenanceRequests: await executeQuery(
      `SELECT COUNT(*) FROM "MaintenanceRequests" WHERE "CreatedAt" > NOW() - INTERVAL '${interval}'`
    ),
  };

  return {
    properties: parseInt(stats.properties.rows[0].count),
    leases: parseInt(stats.leases.rows[0].count),
    payments: parseInt(stats.payments.rows[0].count),
    maintenanceRequests: parseInt(stats.maintenanceRequests.rows[0].count),
  };
}

/**
 * Reset database to clean state (use with caution!)
 * Only use in test environment
 */
export async function resetDatabase() {
  if (process.env.NODE_ENV !== 'test' && process.env.CI !== 'true') {
    throw new Error('Database reset is only allowed in test environment');
  }

  console.log('  ⚠️  Resetting database to clean state...');

  const resetQueries = [
    'TRUNCATE TABLE "PaymentTransactions" CASCADE',
    'TRUNCATE TABLE "Payments" CASCADE',
    'TRUNCATE TABLE "MaintenanceRequests" CASCADE',
    'TRUNCATE TABLE "LeaseAgreements" CASCADE',
    'TRUNCATE TABLE "Properties" CASCADE',
    // Add more tables as needed
  ];

  for (const query of resetQueries) {
    try {
      await executeQuery(query);
    } catch (error) {
      console.warn(`  ⚠️  Reset query failed: ${query}`, error);
    }
  }

  console.log('  → Database reset complete');
}
