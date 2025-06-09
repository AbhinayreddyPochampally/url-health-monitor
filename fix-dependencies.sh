#!/bin/bash

# Script to fix dependency issues and build Docker container

echo "🔧 Fixing dependency issues and building Docker container..."

# Create a temporary package.json with fixed dependencies
echo "📦 Creating fixed package.json..."
cat > package.json.fixed << EOL
{
  "name": "url-health-monitor",
  "version": "1.0.0",
  "description": "A professional URL health monitoring tool",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18",
    "lucide-react": "^0.294.0",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "date-fns": "^3.3.1"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "eslint": "^8",
    "eslint-config-next": "14.0.0"
  }
}
EOL

# Replace the original package.json
echo "🔄 Replacing package.json..."
mv package.json.fixed package.json

# Install dependencies with legacy peer deps flag
echo "📥 Installing dependencies..."
npm install --legacy-peer-deps

# Build and start Docker container
echo "🐳 Building and starting Docker container..."
docker-compose up --build -d

echo "✅ Done! Container should be starting now."
echo "🌐 Access the application at: http://localhost:3000"
