#!/bin/bash

# Deployment preparation script for One-For-All

echo "🚀 Starting deployment preparation..."

# Install all dependencies
echo "📦 Installing dependencies..."
npm run install-all

# Build the frontend
echo "🏗️ Building frontend..."
npm run build

# Check if build was successful
if [ -d "frontend/build" ]; then
    echo "✅ Frontend build successful"
    echo "📁 Build contents:"
    ls -la frontend/build/
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Check if required files exist
if [ -f "frontend/build/index.html" ]; then
    echo "✅ index.html found"
else
    echo "❌ index.html not found in build"
    exit 1
fi

echo "🎉 Deployment preparation complete!"
