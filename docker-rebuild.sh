#!/bin/bash
# Script to rebuild Docker containers without cache issues

echo "=== Docker Rebuild Script ==="
echo ""
echo "This script will:"
echo "1. Stop all containers"
echo "2. Clear Docker build cache"
echo "3. Rebuild and start containers"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "[1/3] Stopping containers..."
docker compose down

echo ""
echo "[2/3] Clearing Docker build cache..."
docker builder prune -af

echo ""
echo "[3/3] Rebuilding and starting containers..."
docker compose up --build -d

echo ""
echo "=== Build Complete ==="
echo ""
echo "Waiting for services to be healthy..."
sleep 5

echo ""
echo "Container Status:"
docker compose ps

echo ""
echo "Testing backend health..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✓ Backend is healthy!"
else
    echo "⚠ Backend health check failed (HTTP $HEALTH_STATUS)"
    echo ""
    echo "Recent backend logs:"
    docker compose logs backend --tail=20
fi

echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
