#!/bin/bash

# Simple static build script for Netlify deployment
echo "🚀 Starting static build for Netlify..."

# Create output directory
mkdir -p out

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create a simple static HTML file that will serve as the SPA entry point
echo "📝 Creating static HTML entry point..."
cat > out/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEDA Pay Merchant Portal</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      color: #333;
    }
    .container {
      max-width: 800px;
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #2563eb;
    }
    p {
      font-size: 1.2rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>NEDA Pay Merchant Portal</h1>
    <p>Welcome to the NEDA Pay Merchant Portal. We're currently working on deploying the full application.</p>
    <p>In the meantime, you can access the application locally by running:</p>
    <pre>npm run dev</pre>
    <a href="https://github.com/0xMgwan/NedaPay" class="button">View on GitHub</a>
  </div>
</body>
</html>
EOL

# Create a _redirects file for Netlify
echo "📝 Creating Netlify redirects file..."
cat > out/_redirects << 'EOL'
/*    /index.html   200
EOL

echo "✅ Static build completed!"
