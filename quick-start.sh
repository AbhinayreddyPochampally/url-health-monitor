#!/bin/bash

# Quick start script for URL Health Monitor

echo "🚀 Starting URL Health Monitor..."

# Check if we're in development or production mode
if [ "$1" = "dev" ]; then
    echo "🔥 Starting in development mode..."
    npm run dev
elif [ "$1" = "docker" ]; then
    echo "🐳 Building and starting with Docker..."
    docker-compose up --build -d
    echo "✅ Docker container started!"
    echo "🌐 Access the application at: http://localhost:3000"
    echo "📋 Check logs with: docker-compose logs -f url-monitor"
else
    echo "🏗️ Building for production..."
    npm run build
    echo "🚀 Starting production server..."
    npm start
fi
