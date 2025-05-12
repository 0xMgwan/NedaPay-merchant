// This script ensures all necessary polyfills are installed for the Netlify build
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for necessary polyfills...');

const polyfills = [
  'crypto-browserify',
  'stream-browserify',
  'stream-http',
  'https-browserify',
  'os-browserify',
  'path-browserify'
];

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check if each polyfill is installed
const missingPolyfills = polyfills.filter(polyfill => {
  return !packageJson.dependencies[polyfill] && !packageJson.devDependencies[polyfill];
});

// Install missing polyfills
if (missingPolyfills.length > 0) {
  console.log(`📦 Installing missing polyfills: ${missingPolyfills.join(', ')}`);
  execSync(`npm install --save ${missingPolyfills.join(' ')}`, { stdio: 'inherit' });
  console.log('✅ Polyfills installed successfully');
} else {
  console.log('✅ All necessary polyfills are already installed');
}

// Create a _redirects file for Netlify
const redirectsPath = path.join(__dirname, 'public', '_redirects');
const redirectsDir = path.dirname(redirectsPath);

if (!fs.existsSync(redirectsDir)) {
  fs.mkdirSync(redirectsDir, { recursive: true });
}

fs.writeFileSync(redirectsPath, `
# Specific page redirects
/             /index.html                  200
/dashboard    /dashboard/index.html        200
/analytics    /analytics/index.html        200
/payment-link /payment-link/index.html     200
/withdraw-funds /withdraw-funds/index.html 200

# SPA fallback
/*           /index.html                   200
`);

console.log('📝 Created Netlify _redirects file');

console.log('🚀 Build preparation complete!');
