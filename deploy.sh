#!/bin/bash

# SovereignOS Deployment Script
echo "🚀 Deploying SovereignOS to Vercel..."

# Clean build
echo "📦 Cleaning previous build..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies with force flag
echo "📥 Installing dependencies..."
npm install --force

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
