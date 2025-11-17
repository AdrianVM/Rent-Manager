# Docker Troubleshooting Guide

## Database Connection Issues in Docker

### Problem
When running `docker compose up --build`, the backend container may fail to connect to the database with errors like:
```
Failed to connect to 127.0.0.1:5432
```

This happens even though the environment variable `CONNECTION_STRING` is correctly set to use `host.docker.internal`.

### Root Cause
Docker's build cache can contain old layers that include `appsettings.Local.json` (which has `Host=localhost`), even though this file is listed in `.dockerignore`. The cached layers take precedence over the environment variables.

### Solution

#### Quick Fix (If you encounter the error)
```bash
# 1. Stop containers
docker compose down

# 2. Clear ALL Docker build cache
docker builder prune -af

# 3. Rebuild and start
docker compose up --build -d
```

#### Recommended Build Commands

**For regular development:**
```bash
docker compose up -d
```

**When you need to rebuild:**
```bash
# Option 1: Clear cache first (safest)
docker builder prune -af && docker compose up --build -d

# Option 2: Use no-cache for backend only
docker compose build --no-cache backend && docker compose up -d
```

### Prevention

The `.dockerignore` file already excludes `appsettings.Local.json`, but cached layers may still contain it. When making configuration changes that affect Docker builds:

1. Always clear the build cache before rebuilding
2. Use `--no-cache` flag when rebuilding after configuration changes

### Verification

After rebuilding, verify the connection is working:
```bash
# Check health endpoint
curl http://localhost:5000/health

# Check for database connection errors in logs
docker compose logs backend | grep -i "127.0.0.1\|Failed to connect"
```

If you see no errors mentioning `127.0.0.1`, the configuration is correct.

## Environment Variables

All sensitive configuration is stored in `.env` file (not committed to git). Key variables:

- `CONNECTION_STRING`: Database connection using `host.docker.internal` for Docker access to system PostgreSQL
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`: Payment processing
- `ZITADEL_AUTHORITY`, `ZITADEL_AUDIENCE`: Backend authentication
- `REACT_APP_*`: Frontend configuration variables

Never commit the `.env` file. Use `.env.docker.template` as a reference for required variables.
