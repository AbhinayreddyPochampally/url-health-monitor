#!/bin/bash

# Script to fix Next.js installation issues

echo "🔧 Fixing Next.js installation..."

# Clean up node_modules
echo "🧹 Cleaning up node_modules..."
rm -rf node_modules .next package-lock.json

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
npm install

# Verify Next.js installation
echo "🔍 Verifying Next.js installation..."
npx next --version

echo "✅ Next.js installation fixed!"
echo "🚀 Try building again with: npm run build"
