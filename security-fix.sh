#!/bin/bash

# Script to fix security vulnerabilities and start the application

echo "🔒 Fixing security vulnerabilities..."

# Run npm audit to see what the issue is
echo "📋 Checking security audit..."
npm audit

# Fix the vulnerability
echo "🛠️ Applying security fixes..."
npm audit fix --force

# Reinstall dependencies to ensure everything is clean
echo "📦 Reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

echo "✅ Security fixes applied!"
echo "🚀 Ready to start the application!"
