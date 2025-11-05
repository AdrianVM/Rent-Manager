# Deployment Guide

This document describes how to deploy the Rent Manager application to Scaleway.

## Prerequisites

- [Scaleway CLI](https://github.com/scaleway/scaleway-cli) installed and configured
- [Docker](https://www.docker.com/) installed
- [AWS CLI](https://aws.amazon.com/cli/) installed (for S3 static hosting)
- Scaleway account with:
  - Object Storage bucket created
  - Container Registry namespace created
  - PostgreSQL database instance (optional)

## Architecture

- **Frontend**: Static website hosted on Scaleway Object Storage
- **Backend**: .NET API running in Scaleway Container Instance
- **Database**: PostgreSQL (Scaleway Managed Database or external)

## Frontend Deployment

The frontend is a React SPA deployed to Scaleway Object Storage as a static website.

### Setup

1. **Configure environment variables**:
   ```bash
   cp frontend/.env.production frontend/.env.production.local
   ```

2. **Edit `frontend/.env.production.local`** with your production values:
   ```env
   REACT_APP_API_URL=https://your-backend-url.scw.cloud/api
   REACT_APP_BASE_URL=https://rentflow.ro.s3-website.fr-par.scw.cloud
   REACT_APP_ZITADEL_AUTHORITY=https://rent-manager-txkjry.us1.zitadel.cloud
   REACT_APP_ZITADEL_CLIENT_ID=your-production-client-id
   REACT_APP_REDIRECT_URI=https://rentflow.ro.s3-website.fr-par.scw.cloud/auth/callback
   REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   ```

### Deploy

```bash
# Build and deploy
npm run build:frontend
./deploy-frontend.sh
```

The script will:
- Upload files to Scaleway Object Storage
- Configure static website hosting
- Set proper content types
- Make the bucket publicly accessible

**Frontend URL**: `https://rentflow.ro.s3-website.fr-par.scw.cloud`

## Backend Deployment

The backend is a .NET 9.0 API deployed as a Docker container to Scaleway Container Instances.

### Setup

1. **Create a Container Registry namespace** (one-time setup):
   ```bash
   scw registry namespace create name=rent-manager region=fr-par
   ```

2. **Configure environment variables**:
   ```bash
   cp backend/.env.production backend/.env.production.local
   ```

3. **Edit `backend/.env.production.local`** with your production values:
   ```env
   ASPNETCORE_ENVIRONMENT=Production
   ASPNETCORE_URLS=http://+:8080
   FrontendUrl=https://rentflow.ro.s3-website.fr-par.scw.cloud
   UsePostgres=true
   ConnectionStrings__DefaultConnection=Host=your-db-host;Port=5432;Database=rent-manager;Username=user;Password=pass
   Zitadel__Authority=https://rent-manager-txkjry.us1.zitadel.cloud
   Zitadel__Audience=your-client-id
   Stripe__SecretKey=your-stripe-secret-key
   Stripe__PublishableKey=your-stripe-publishable-key
   Stripe__WebhookSecret=your-stripe-webhook-secret
   ```

### Deploy

```bash
# Build Docker image and push to Scaleway Container Registry
./deploy-backend.sh
```

The script will:
- Build the Docker image
- Push to Scaleway Container Registry
- Provide commands to create/update the container instance

### Create Container Instance (First Time)

After running the deployment script, create the container instance:

```bash
# Get your namespace ID
scw registry namespace list

# Create container namespace (serverless containers)
scw container namespace create name=rent-manager region=fr-par

# Get container namespace ID
scw container namespace list

# Create the container
scw container container create \
  name=rent-manager-backend \
  namespace-id=<your-container-namespace-id> \
  registry-image=rg.fr-par.scw.cloud/rent-manager/backend:latest \
  region=fr-par \
  port=8080 \
  min-scale=1 \
  max-scale=5 \
  cpu-limit=1000 \
  memory-limit=2048 \
  env-vars.ASPNETCORE_ENVIRONMENT=Production \
  env-vars.ASPNETCORE_URLS=http://+:8080 \
  env-vars.FrontendUrl=https://rentflow.ro.s3-website.fr-par.scw.cloud \
  env-vars.UsePostgres=true \
  env-vars.ConnectionStrings__DefaultConnection="<your-connection-string>"

# Deploy the container
scw container container deploy <container-id> region=fr-par
```

### Update Existing Container

For subsequent deployments:

```bash
# Build and push new image
./deploy-backend.sh

# Update container to use new image
scw container container update <container-id> \
  registry-image=rg.fr-par.scw.cloud/rent-manager/backend:latest \
  region=fr-par

# Deploy the update
scw container container deploy <container-id> region=fr-par
```

## Database Setup

### Option 1: Scaleway Managed Database

1. **Create a PostgreSQL instance**:
   ```bash
   scw rdb instance create \
     name=rent-manager-db \
     engine=PostgreSQL-15 \
     node-type=DB-DEV-S \
     region=fr-par
   ```

2. **Get connection details**:
   ```bash
   scw rdb instance get <instance-id>
   ```

3. **Run migrations**:
   ```bash
   # Update connection string in backend/.env.production.local
   cd backend/RentManager.API
   dotnet ef database update
   ```

### Option 2: External PostgreSQL

Use any PostgreSQL database and configure the connection string in `backend/.env.production.local`.

## Environment Variables Summary

### Frontend (`.env.production.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://your-backend.scw.cloud/api` |
| `REACT_APP_BASE_URL` | Frontend base URL | `https://rentflow.ro.s3-website.fr-par.scw.cloud` |
| `REACT_APP_ZITADEL_AUTHORITY` | Zitadel authority URL | `https://your-instance.zitadel.cloud` |
| `REACT_APP_ZITADEL_CLIENT_ID` | Zitadel client ID | Your production client ID |
| `REACT_APP_REDIRECT_URI` | OAuth redirect URI | `https://rentflow.ro.s3-website.fr-par.scw.cloud/auth/callback` |
| `REACT_APP_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` |

### Backend (`.env.production.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `FrontendUrl` | Frontend URL for CORS | `https://rentflow.ro.s3-website.fr-par.scw.cloud` |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string | `Host=...;Database=...` |
| `Zitadel__Authority` | Zitadel authority URL | `https://your-instance.zitadel.cloud` |
| `Zitadel__Audience` | Zitadel client ID | Your production client ID |
| `Stripe__SecretKey` | Stripe secret key | `sk_live_...` |
| `Stripe__PublishableKey` | Stripe publishable key | `pk_live_...` |
| `Stripe__WebhookSecret` | Stripe webhook secret | `whsec_...` |

## Post-Deployment

1. **Configure Zitadel redirect URIs**:
   - Add `https://rentflow.ro.s3-website.fr-par.scw.cloud/auth/callback` to allowed redirect URIs
   - Add `https://rentflow.ro.s3-website.fr-par.scw.cloud/logout` to post-logout redirect URIs

2. **Configure Stripe webhooks** (if using Stripe):
   - Add webhook endpoint: `https://your-backend-url.scw.cloud/api/stripe/webhook`
   - Select events to listen to

3. **Test the application**:
   - Visit your frontend URL
   - Test authentication
   - Test key features

## Monitoring

### Container Logs

```bash
# View container logs
scw container container logs <container-id> region=fr-par

# Follow logs
scw container container logs <container-id> region=fr-par --follow
```

### Container Status

```bash
# Check container status
scw container container get <container-id> region=fr-par

# List all containers
scw container container list namespace-id=<namespace-id> region=fr-par
```

## Troubleshooting

### Frontend 404 Errors

- Ensure static website hosting is enabled on the bucket
- Verify bucket is set to public-read
- Check that `index.html` is set as both index and error document

### Backend Connection Errors

- Check container logs: `scw container container logs <container-id>`
- Verify environment variables are set correctly
- Ensure database is accessible from the container
- Check CORS configuration matches frontend URL

### Authentication Issues

- Verify Zitadel redirect URIs are configured correctly
- Check that client IDs match between frontend and backend
- Ensure HTTPS is used for production URLs

## Costs

Scaleway pricing (approximate, check current pricing):

- **Object Storage**: ~€0.01/GB/month + transfer costs
- **Container Registry**: Free for first 75GB
- **Container Instances**: From ~€0.10/hour (depending on resources)
- **Managed Database**: From ~€10/month (DB-DEV-S tier)

## Security Best Practices

- ✅ Never commit `.env.production.local` files
- ✅ Use production Stripe keys in production
- ✅ Enable HTTPS for all services
- ✅ Rotate secrets regularly
- ✅ Use Scaleway IAM for access control
- ✅ Enable database backups
- ✅ Set up monitoring and alerts

## Support

For issues or questions, refer to:
- [Scaleway Documentation](https://www.scaleway.com/en/docs/)
- [Scaleway CLI Documentation](https://github.com/scaleway/scaleway-cli)
