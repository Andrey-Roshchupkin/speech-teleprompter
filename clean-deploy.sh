#!/bin/bash

# Clean and deploy script for GitHub Pages
echo "🧹 Cleaning previous build files..."

# Remove only build artifacts, keep source files
rm -f favicon.ico
rm -rf assets

echo "📦 Building application..."
npm run build:prod

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Copy dist contents to root for GitHub Pages
    echo "📁 Copying build files to root..."
    cp -r dist/* .
    
    # Fix paths in index.html for GitHub Pages
    echo "🔧 Fixing paths in index.html..."
    sed -i '' 's|/speech-teleprompter/|/|g' index.html
    
    # Add all files
    git add .
    
    # Commit the build
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Push to main
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "🎉 Deployment successful!"
        echo "Your app should be available at: https://Andrey-Roshchupkin.github.io/speech-teleprompter/"
    else
        echo "❌ Deployment failed!"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi
