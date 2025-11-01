#!/bin/bash

# Scaleway Frontend Deployment Script using AWS CLI
# Usage: ./deploy-frontend.sh <bucket-name> [region]

set -e

# Configuration
AWS_CLI="$HOME/.local/bin/aws"
BUCKET_NAME="${1:-rent-manager-fe}"
REGION="${2:-fr-par}"
ENDPOINT_URL="https://s3.${REGION}.scw.cloud"
BUILD_DIR="frontend/build"

echo "🚀 Deploying Rent Manager Frontend to Scaleway..."
echo "📦 Bucket: $BUCKET_NAME"
echo "🌍 Region: $REGION"
echo "🔗 Endpoint: $ENDPOINT_URL"
echo ""

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found: $BUILD_DIR"
    echo "Run 'npm run build:frontend' first"
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
