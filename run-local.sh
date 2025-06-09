#!/bin/bash

# Local development script

echo "🚀 Starting URL Health Monitor in development mode..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🔥 Starting development server..."
npm run dev
