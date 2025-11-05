#!/bin/bash

# Scaleway Frontend Deployment Script using AWS CLI
# Usage: ./deploy-frontend.sh [--no-build] [bucket-name] [region]
#
# Examples:
#   ./deploy-frontend.sh                    # Build and deploy to default bucket
#   ./deploy-frontend.sh --no-build         # Deploy existing build (skip rebuild)
#   ./deploy-frontend.sh my-bucket          # Build and deploy to custom bucket
#   ./deploy-frontend.sh --no-build my-bucket fr-par  # Skip build, custom bucket and region

set -e

# Parse arguments for --no-build flag
NO_BUILD=false
if [ "$1" = "--no-build" ]; then
    NO_BUILD=true
    shift  # Remove --no-build from arguments
fi

# Configuration
AWS_CLI="$HOME/.local/bin/aws"
BUCKET_NAME="${1:-rentflow.ro}"
REGION="${2:-fr-par}"
ENDPOINT_URL="https://s3.${REGION}.scw.cloud"
BUILD_DIR="frontend/build"

echo "🚀 Deploying Rent Manager Frontend to Scaleway..."
echo "📦 Bucket: $BUCKET_NAME"
echo "🌍 Region: $REGION"
echo "🔗 Endpoint: $ENDPOINT_URL"
echo ""

# Build step (unless --no-build flag is set)
if [ "$NO_BUILD" = false ]; then
    echo "🔨 Building frontend..."
    echo "   Running: npm run build in frontend/"

    # Check if frontend directory exists
    if [ ! -d "frontend" ]; then
        echo "❌ Frontend directory not found!"
        echo "   Make sure you're running this from the project root."
        exit 1
    fi

    # Build the frontend
    cd frontend
    npm run build
    cd ..

    echo "✅ Build complete!"
    echo ""
else
    echo "⏭️  Skipping build (--no-build flag set)"
    echo ""
fi

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found: $BUILD_DIR"
    if [ "$NO_BUILD" = true ]; then
        echo "   You used --no-build but no build exists."
        echo "   Run without --no-build to create a fresh build first."
    else
        echo "   Build failed or directory was not created."
    fi
    exit 1
fi

# Check if AWS CLI is installed
if [ ! -f "$AWS_CLI" ]; then
    echo "❌ AWS CLI not found at: $AWS_CLI"
    exit 1
fi

# Sync files to bucket
echo "📤 Uploading files to S3..."
$AWS_CLI s3 sync $BUILD_DIR/ s3://$BUCKET_NAME/ \
    --endpoint-url=$ENDPOINT_URL \
    --delete \
    --acl public-read

# Set correct content types for specific files
echo "⚙️  Setting content types..."

# Set content type for HTML files
$AWS_CLI s3 cp s3://$BUCKET_NAME/index.html s3://$BUCKET_NAME/index.html \
    --endpoint-url=$ENDPOINT_URL \
    --content-type "text/html" \
    --metadata-directive REPLACE \
    --acl public-read

$AWS_CLI s3 cp s3://$BUCKET_NAME/silent-callback.html s3://$BUCKET_NAME/silent-callback.html \
    --endpoint-url=$ENDPOINT_URL \
    --content-type "text/html" \
    --metadata-directive REPLACE \
    --acl public-read

# Configure bucket for static website hosting
echo "🌐 Configuring static website hosting..."
$AWS_CLI s3 website s3://$BUCKET_NAME/ \
    --index-document index.html \
    --error-document index.html \
    --endpoint-url=$ENDPOINT_URL

# Make bucket public
echo "🔓 Setting bucket permissions to public..."
$AWS_CLI s3api put-bucket-acl \
    --bucket $BUCKET_NAME \
    --acl public-read \
    --endpoint-url=$ENDPOINT_URL

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your site is available at:"
echo "   https://$BUCKET_NAME.s3-website.$REGION.scw.cloud"
echo ""
echo "📊 Bucket contents:"
$AWS_CLI s3 ls s3://$BUCKET_NAME/ --endpoint-url=$ENDPOINT_URL --human-readable --summarize

echo ""
