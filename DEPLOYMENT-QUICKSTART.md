# Deployment Quick Start

## Prerequisites

```bash
# Install Scaleway CLI
# https://github.com/scaleway/scaleway-cli#installation

# Configure Scaleway CLI
scw init

# Verify AWS CLI is configured for Scaleway
# (Already done if you deployed frontend)
```

## One-Time Setup

### 1. Create Container Registry Namespace

```bash
scw registry namespace create name=rent-manager region=fr-par
```

### 2. Create Container Namespace (Serverless)

```bash
scw container namespace create name=rent-manager region=fr-par
```

Save the namespace ID from the output!

### 3. Configure Environment Variables

```bash
# Frontend
cp frontend/.env.production frontend/.env.production.local
# Edit frontend/.env.production.local with real values

# Backend
cp backend/.env.production backend/.env.production.local
# Edit backend/.env.production.local with real values
```

## Deploy Frontend

```bash
npm run build:frontend
./deploy-frontend.sh
```

**URL**: https://rent-manager-fe.s3-website.fr-par.scw.cloud

## Deploy Backend (First Time)

### Step 1: Build and Push Image

```bash
./deploy-backend.sh
```

### Step 2: Create Container

```bash
# Get your container namespace ID
scw container namespace list

# Create container (replace <namespace-id> and connection string)
scw container container create \
  name=rent-manager-backend \
  namespace-id=<your-container-namespace-id> \
  registry-image=rg.fr-par.scw.cloud/rent-manager/backend:latest \
  region=fr-par \
  port=8080 \
  min-scale=1 \
  max-scale=3 \
  cpu-limit=1000 \
  memory-limit=2048 \
  env-vars.ASPNETCORE_ENVIRONMENT=Production \
  env-vars.ASPNETCORE_URLS=http://+:8080 \
  env-vars.FrontendUrl=https://rent-manager-fe.s3-website.fr-par.scw.cloud \
  env-vars.UsePostgres=true \
  env-vars.ConnectionStrings__DefaultConnection="Host=your-db;Port=5432;Database=rent-manager;Username=user;Password=pass" \
  env-vars.Zitadel__Authority=https://rent-manager-txkjry.us1.zitadel.cloud \
  env-vars.Zitadel__Audience=344779092844924938 \
  env-vars.Stripe__SecretKey=your-secret-key \
  env-vars.Stripe__PublishableKey=your-publishable-key \
  env-vars.Stripe__WebhookSecret=your-webhook-secret
```

Save the container ID from the output!

### Step 3: Deploy Container

```bash
# Deploy the container (replace <container-id>)
scw container container deploy <container-id> region=fr-par

# Check status
scw container container get <container-id> region=fr-par
```

## Deploy Backend (Updates)

After the first deployment, updating is simpler:

```bash
# Build and push new image
./deploy-backend.sh

# Update and deploy (replace <container-id>)
scw container container update <container-id> \
  registry-image=rg.fr-par.scw.cloud/rent-manager/backend:latest \
  region=fr-par

scw container container deploy <container-id> region=fr-par
```

## Update Frontend URLs

After deploying the backend, update your frontend to use the backend URL:

1. Get your backend URL:
   ```bash
   scw container container get <container-id> region=fr-par
   ```
   Look for the `DomainName` field.

2. Update `frontend/.env.production.local`:
   ```env
   REACT_APP_API_URL=https://your-backend-url.containers.scw.cloud/api
   ```

3. Rebuild and redeploy frontend:
   ```bash
   npm run build:frontend
   ./deploy-frontend.sh
   ```

## Run Database Migrations

```bash
# Option 1: Locally (with connection to production DB)
cd backend/RentManager.API
dotnet ef database update --connection "Host=your-db;Port=5432;Database=rent-manager;Username=user;Password=pass"

# Option 2: Via container (if database is accessible)
# SSH into running container and run migrations
```

## Configure Zitadel

1. Go to https://rent-manager-txkjry.us1.zitadel.cloud
2. Navigate to your application
3. Add redirect URIs:
   - `https://rent-manager-fe.s3-website.fr-par.scw.cloud/auth/callback`
   - `https://rent-manager-fe.s3-website.fr-par.scw.cloud/auth/silent-callback`
4. Add post-logout redirect URI:
   - `https://rent-manager-fe.s3-website.fr-par.scw.cloud/logout`

## Useful Commands

```bash
# View container logs
scw container container logs <container-id> region=fr-par --follow

# List containers
scw container container list namespace-id=<namespace-id> region=fr-par

# Get container details
scw container container get <container-id> region=fr-par

# Delete container (careful!)
scw container container delete <container-id> region=fr-par
```

## Troubleshooting

**Container won't start?**
- Check logs: `scw container container logs <container-id> region=fr-par`
- Verify environment variables are set correctly
- Check database connectivity

**Frontend shows CORS errors?**
- Verify `FrontendUrl` in backend env vars matches frontend URL
- Ensure backend is deployed and accessible

**Authentication fails?**
- Check Zitadel redirect URIs are configured
- Verify client IDs match in frontend and backend

For detailed documentation, see [DEPLOYMENT.md](DEPLOYMENT.md)
