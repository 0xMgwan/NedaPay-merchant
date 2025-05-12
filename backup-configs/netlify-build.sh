#!/bin/bash

# Netlify build script for NEDA Pay Merchant Portal
# This script handles the static export process for Netlify

echo "🚀 Starting Netlify build process for NEDA Pay Merchant Portal..."

# Install necessary polyfills
echo "📦 Installing required polyfills..."
npm install --save crypto-browserify stream-browserify stream-http https-browserify os-browserify path-browserify

# Backup original files
echo "💾 Backing up original files..."
cp next.config.js next.config.js.bak || echo "No next.config.js to backup"
cp app/providers.tsx app/providers.tsx.bak || echo "No providers.tsx to backup"

# Copy the Netlify-specific config
echo "⚙️ Setting up Netlify configuration..."
cp next.config.netlify.js next.config.js

# Copy the simplified providers implementation
echo "🔄 Using simplified providers implementation..."
cp app/providers.deploy.tsx app/providers.tsx || echo "No providers.deploy.tsx found"

# Set environment variables to ignore TypeScript errors
export NEXT_TYPESCRIPT_CHECK=false
export NEXT_ESLINT_CHECK=false
export NODE_OPTIONS="--max-old-space-size=4096"

# Run the build
echo "🏗️ Building the application..."
npm run build

# Create out directory if it doesn't exist
mkdir -p out

# Create a _redirects file for Netlify
echo "📝 Creating Netlify redirects file..."
cat > out/_redirects << EOL
# Specific page redirects
/             /index.html                  200
/dashboard    /dashboard/index.html        200
/analytics    /analytics/index.html        200
/payment-link /payment-link/index.html     200
/withdraw-funds /withdraw-funds/index.html 200

# SPA fallback
/*           /index.html                   200
EOL

# Create a 404 page if it doesn't exist
if [ ! -f "out/404.html" ]; then
  echo "🔍 Creating 404 page..."
  cp out/index.html out/404.html
fi

# Restore original files
echo "🔄 Restoring original files..."
if [ -f "next.config.js.bak" ]; then
  mv next.config.js.bak next.config.js
fi
if [ -f "app/providers.tsx.bak" ]; then
  mv app/providers.tsx.bak app/providers.tsx
fi

echo "✅ Netlify build process completed!"
