#!/bin/bash

# Script to fix build issues and install missing dependencies

echo "🔧 Fixing build issues..."

# Install missing critters package
echo "📦 Installing missing dependencies..."
npm install critters --save-dev

# Clean up build artifacts
echo "🧹 Cleaning up previous build..."
rm -rf .next

# Run the build
echo "🏗️ Building the application..."
npm run build

echo "✅ Build fixes applied!"
echo "🚀 Ready to start the application!"
