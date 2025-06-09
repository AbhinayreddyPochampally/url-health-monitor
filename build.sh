#!/bin/bash

# Build script for URL Health Monitor

echo "🚀 Building URL Health Monitor..."

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down --remove-orphans

# Remove old images
echo "🗑️ Removing old images..."
docker image prune -f

# Build and start the application
echo "🔨 Building and starting the application..."
docker-compose up --build -d

# Wait for the application to start
echo "⏳ Waiting for application to start..."
sleep 30

# Check if the application is running
echo "🔍 Checking application health..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo "🌐 Access the application at: http://localhost:3000"
else
    echo "❌ Application failed to start properly"
    echo "📋 Checking logs..."
    docker-compose logs url-monitor
fi

echo "📊 Container status:"
docker-compose ps
