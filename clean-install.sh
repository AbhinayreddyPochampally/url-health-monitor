#!/bin/bash

# Clean installation script

echo "🧹 Performing clean installation..."

# Remove all existing files
rm -rf node_modules .next package-lock.json

# Install with legacy peer deps to bypass conflicts
echo "📦 Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

# Verify installation
echo "🔍 Verifying installation..."
npm list next

echo "✅ Clean installation complete!"
echo "🚀 Try building: npm run build"
