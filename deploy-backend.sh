#!/bin/bash

# Scaleway Backend Deployment Script
# Usage: ./deploy-backend.sh [--no-cache] [registry-endpoint] [namespace] [image-name] [region]

set -e

# Parse arguments for --no-cache flag
NO_CACHE=""
if [ "$1" = "--no-cache" ]; then
    NO_CACHE="--no-cache"
    shift  # Remove --no-cache from arguments
fi

# Configuration
REGISTRY_ENDPOINT="${1:-rg.fr-par.scw.cloud}"
NAMESPACE="${2:-rent-manager}"
IMAGE_NAME="${3:-backend}"
REGION="${4:-fr-par}"
VERSION="${5:-latest}"

# Full image name
FULL_IMAGE_NAME="${REGISTRY_ENDPOINT}/${NAMESPACE}/${IMAGE_NAME}:${VERSION}"

echo "🚀 Deploying Rent Manager Backend to Scaleway..."
echo "📦 Registry: $REGISTRY_ENDPOINT"
echo "📁 Namespace: $NAMESPACE"
echo "🏷️  Image: $IMAGE_NAME:$VERSION"
echo "🌍 Region: $REGION"
echo ""

# Check if .env.production.local exists
if [ ! -f "backend/.env.production.local" ]; then
    echo "❌ backend/.env.production.local not found"
    echo "Please create it with your production configuration"
    exit 1
fi

# Load environment variables
echo "📋 Loading environment variables..."
set -a
source backend/.env.production.local
set +a

# Build Docker image
echo "🔨 Building Docker image..."
if [ -n "$NO_CACHE" ]; then
    echo "   (Building without cache)"
fi
docker build $NO_CACHE \
    -t ${IMAGE_NAME}:${VERSION} \
    -t ${FULL_IMAGE_NAME} \
    -f backend/RentManager.API/Dockerfile \
    ./backend

# Login to Scaleway Container Registry
echo "🔐 Logging in to Scaleway Container Registry..."
echo "Note: Make sure you have created a container registry namespace"
echo "Run: scw registry namespace create name=$NAMESPACE region=$REGION"
echo ""

# Check if logged in to docker registry
if docker login ${REGISTRY_ENDPOINT} -u nologin --password-stdin <<< "$(scw config get secret-key)" 2>/dev/null; then
    echo "✅ Logged in to Scaleway Container Registry"
else
    echo "⚠️  Could not login automatically. Please login manually:"
    echo "docker login ${REGISTRY_ENDPOINT}"
    exit 1
fi

# Push image to registry
echo "📤 Pushing image to Scaleway Container Registry..."
docker push ${FULL_IMAGE_NAME}

echo ""
echo "✅ Docker image pushed successfully!"
echo "🏷️  Image: ${FULL_IMAGE_NAME}"
echo ""

# Container ID for automatic deployment
CONTAINER_ID="630aa7cb-ec2c-4c37-ad27-5877511f6b84"

echo "🚀 Deploying to Scaleway Container..."
echo "📦 Container ID: ${CONTAINER_ID}"
echo ""

# Update container with new image and environment variables
echo "🔄 Updating container with new image and environment variables..."
scw container container update ${CONTAINER_ID} \
  registry-image=${FULL_IMAGE_NAME} \
  region=${REGION} \
  environment-variables.ScalewayEmail__SecretKey="${ScalewayEmail__SecretKey}" \
  environment-variables.ScalewayEmail__ProjectId="${ScalewayEmail__ProjectId}" \
  environment-variables.ScalewayEmail__Region="${ScalewayEmail__Region}" \
  environment-variables.ScalewayEmail__DefaultFromEmail="${ScalewayEmail__DefaultFromEmail}" \
  environment-variables.ScalewayEmail__DefaultFromName="${ScalewayEmail__DefaultFromName}" \
  environment-variables.ConnectionStrings__DefaultConnection="${ConnectionStrings__DefaultConnection}" \
  environment-variables.FrontendUrl="${FrontendUrl}" \
  environment-variables.Zitadel__Authority="${Zitadel__Authority}" \
  environment-variables.Zitadel__Audience="${Zitadel__Audience}" \
  environment-variables.Stripe__SecretKey="${Stripe__SecretKey}" \
  environment-variables.Stripe__PublishableKey="${Stripe__PublishableKey}" \
  environment-variables.Stripe__WebhookSecret="${Stripe__WebhookSecret}" \
  environment-variables.Stripe__Currency="${Stripe__Currency}" \
  environment-variables.Stripe__EnableTestMode="${Stripe__EnableTestMode}" \
  environment-variables.UsePostgres="${UsePostgres}" \
  environment-variables.ASPNETCORE_ENVIRONMENT="${ASPNETCORE_ENVIRONMENT}"

# Deploy the container
echo "🚀 Deploying container..."
scw container container deploy ${CONTAINER_ID} region=${REGION}

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📊 Check deployment status:"
echo "   scw container container get ${CONTAINER_ID} region=${REGION}"
echo ""
echo "📋 View logs:"
echo "   scw container container logs ${CONTAINER_ID} region=${REGION} --tail=50"
echo ""
