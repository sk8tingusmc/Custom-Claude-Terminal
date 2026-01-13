#!/bin/bash

# Build script for Custom Claude Terminal

echo "Building Custom Claude Terminal for Linux..."

# Compile TypeScript for electron main process
echo "Compiling electron main process..."
npx tsc -p electron/tsconfig.json

# Build renderer with Vite
echo "Building React app..."
npm run build:vite

# Build electron app
echo "Packaging electron app..."
npx electron-builder --linux AppImage

echo "Build complete! Check release/ directory for AppImage"
