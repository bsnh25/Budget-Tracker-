#!/usr/bin/env bash
# ==============================================================================
# KiaBiyu Budget Tracker — Secure Deployment Script
# This script standardizes building, containerizing, and releasing the app.
# ==============================================================================

# Fail immediately if any command fails (-e), if any uninitialized variable is used (-u),
# and prevent errors in pipeline sequences from being masked (-o pipefail).
set -euo pipefail

# 1. Configuration
APP_NAME="kiabiyu-budget-tracker"
IMAGE_TAG="latest"
CONTAINER_NAME="kiabiyu-budget"
PORT_HOST=8080
PORT_CONTAINER=80

echo "🚀 Starting Deployment Sequence for ${APP_NAME}..."

# 2. Check for environmental configuration
if [ ! -f .env ]; then
    echo "⚠️ Warning: .env file not found. Ensure required credentials are set or injected."
else
    echo "🔑 Found .env configuration file."
fi

# 3. Compile local production assets
echo "📦 Building local web assets..."
npm run build

# 4. Build Docker container
echo "🐳 Building Docker container image..."
docker build -t "${APP_NAME}:${IMAGE_TAG}" .

# 5. Handle active containers
if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}$"; then
    echo "🛑 Stopping existing active container [${CONTAINER_NAME}]..."
    docker stop "${CONTAINER_NAME}" || true
    docker rm "${CONTAINER_NAME}" || true
fi

# 6. Run container with non-root security principles and isolated port
echo "⚡ Starting new container [${CONTAINER_NAME}] on port ${PORT_HOST}..."
docker run -d \
    --name "${CONTAINER_NAME}" \
    -p "${PORT_HOST}:${PORT_CONTAINER}" \
    --restart unless-stopped \
    "${APP_NAME}:${IMAGE_TAG}"

echo "🎉 Deployment completed successfully! Accessible locally at http://localhost:${PORT_HOST}"
