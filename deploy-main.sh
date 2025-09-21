#!/bin/bash

# Deploy script for GitHub Pages using main branch
echo "🚀 Starting deployment to GitHub Pages (main branch)..."

# Build the application
echo "📦 Building application..."
npm run build:prod

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Copy dist contents to root for GitHub Pages
    echo "📁 Copying build files to root..."
    cp -r dist/* .
    
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
