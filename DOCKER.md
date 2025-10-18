# Docker Deployment Guide

This guide explains how to run the Rent Manager application using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### 1. Configure Environment Variables

Copy the environment template and configure it:

```bash
cp .env.docker.template .env.docker
```

Edit `.env.docker` and set your values:
- `POSTGRES_PASSWORD`: Database password
- `JWT_SECRET_KEY`: Secret key for JWT tokens (minimum 32 characters)
- `STRIPE_*`: Stripe API keys (if using payment features)

### 2. Build and Run

Start all services (PostgreSQL, Backend, Frontend):

```bash
docker-compose --env-file .env.docker up -d
```

Or build from scratch:

```bash
docker-compose --env-file .env.docker up --build -d
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432

### 4. Initialize the Database

The database will be automatically created. To seed demo data, use the backend's seed endpoint:

```bash
curl -X POST http://localhost:5000/api/seed
```

## Available Commands

### Start Services
```bash
docker-compose --env-file .env.docker up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuild Services
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

### Stop and Remove Everything (including volumes)
```bash
docker-compose down -v
```

## Service Details

### PostgreSQL
- **Port**: 5432
- **Database**: rent-manager
- **User**: postgres
- **Data Volume**: `postgres_data` (persisted)

### Backend (.NET API)
- **Port**: 5000
- **Technology**: .NET 9.0
- **Database**: PostgreSQL
- **Health Check**: Available at `/health` (if configured)

### Frontend (React)
- **Port**: 3000 (mapped from internal port 80)
- **Technology**: React 18 with nginx
- **Server**: nginx alpine

## Development vs Production

### Development
The current configuration uses development-friendly settings. For production:

1. **Change secrets**: Update all passwords and secret keys
2. **Use HTTPS**: Configure SSL certificates
3. **Environment variables**: Use proper secret management
4. **Database backups**: Set up automated backups
5. **Resource limits**: Add CPU/memory limits to services

### Production Example

Add resource limits to docker-compose.yml:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

## Troubleshooting

### Backend can't connect to database
- Check if PostgreSQL is healthy: `docker-compose ps`
- View logs: `docker-compose logs postgres`
- Verify connection string in environment variables

### Frontend can't reach backend
- Check if backend is running: `docker-compose ps`
- Verify API URL in frontend environment
- Check network configuration

### Port conflicts
If ports 3000, 5000, or 5432 are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "3001:80"  # Change frontend to port 3001
```

## Database Management

### Backup Database
```bash
docker exec rentmanager-postgres pg_dump -U postgres rent-manager > backup.sql
```

### Restore Database
```bash
docker exec -i rentmanager-postgres psql -U postgres rent-manager < backup.sql
```

### Access PostgreSQL CLI
```bash
docker exec -it rentmanager-postgres psql -U postgres -d rent-manager
```

## Network Architecture

All services run in a custom bridge network (`rentmanager-network`):
- Services can communicate using service names (e.g., `postgres`, `backend`)
- Frontend is exposed on host port 3000
- Backend is exposed on host port 5000
- PostgreSQL is exposed on host port 5432

## Volume Management

The PostgreSQL data is persisted in a Docker volume:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect rent-manager_postgres_data

# Remove volume (WARNING: This deletes all data!)
docker volume rm rent-manager_postgres_data
```
