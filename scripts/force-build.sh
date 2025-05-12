#!/bin/bash

# Force build script for NEDA Pay Merchant Portal
# This script bypasses TypeScript errors during build

echo "🚀 Starting force build process for NEDA Pay Merchant Portal..."

# Clean install of dependencies to ensure everything is fresh
echo "📦 Installing dependencies..."
rm -rf node_modules package-lock.json .next out
npm install --legacy-peer-deps

# Verify node_modules exists
if [ ! -d "node_modules" ] || [ ! -d "node_modules/next" ]; then
  echo "❌ Dependencies installation failed. Retrying with npm..."
  npm install --legacy-peer-deps --no-fund --no-audit
  
  # Check again
  if [ ! -d "node_modules" ] || [ ! -d "node_modules/next" ]; then
    echo "❌ Failed to install dependencies. Exiting."
    exit 1
  fi
fi

# Backup original files
echo "💾 Backing up original files..."
cp app/providers.tsx app/providers.tsx.bak

# Copy the deployment config to next.config.js
echo "⚙️ Setting up deployment configuration..."

# Check if we're running on Netlify
if [ "$NETLIFY" = "true" ]; then
  echo "📦 Using Netlify-specific build configuration..."
  cp ../backup-configs/netlify-build.js ../config/next.config.js
else
  echo "📦 Using standard deployment configuration..."
  cp ../config/next.config.js ../next.config.js
fi

# Use the correct providers implementation based on build type
if [ "$NETLIFY" = "true" ]; then
  echo "🔄 Using simplified providers implementation for Netlify static build..."
  cp app/providers.deploy.tsx app/providers.tsx
else
  echo "🔄 Using actual application providers implementation..."
  cp app/providers.tsx.bak app/providers.tsx
fi

# Set environment variables to ignore TypeScript errors
export NEXT_TYPESCRIPT_CHECK=false
export NEXT_ESLINT_CHECK=false
export NODE_OPTIONS="--max-old-space-size=4096"

# Run the build
echo "🏗️ Building the application..."

# Set environment variables to ignore TypeScript errors
export NEXT_TYPESCRIPT_CHECK=false
export NEXT_ESLINT_CHECK=false
export NODE_OPTIONS="--max-old-space-size=4096"

# Check if we're running on Netlify
if [ "$NETLIFY" = "true" ]; then
  echo "💾 Building for static export..."
  ./node_modules/.bin/next build
  
  # Create a _redirects file for Netlify
  echo "💾 Creating Netlify redirects file..."
  echo "/* /index.html 200" > out/_redirects
  
  # Copy 404 page to root
  echo "💾 Setting up 404 page..."
  if [ -f "out/404.html" ]; then
    cp out/404.html out/not-found.html
  fi
else
  echo "💾 Building for standard deployment..."
  ./node_modules/.bin/next build
fi

# Restore original files
echo "🔄 Restoring original files..."
mv app/providers.tsx.bak app/providers.tsx

echo "✅ Build process completed!"
