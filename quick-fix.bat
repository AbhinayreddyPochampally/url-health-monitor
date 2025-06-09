@echo off
echo 🧹 Performing clean installation...

REM Remove existing files
if exist node_modules rmdir /s /q node_modules
if exist .next rmdir /s /q .next
if exist package-lock.json del package-lock.json

echo 📦 Installing dependencies with legacy peer deps...
npm install --legacy-peer-deps

echo ✅ Clean installation complete!
echo 🚀 Try building: npm run build
pause
