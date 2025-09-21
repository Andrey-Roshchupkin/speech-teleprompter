#!/bin/bash

echo "🚀 Deploying to GitHub Pages..."

# Build the app
npm run build:prod

# Copy files to root
cp -r dist/* .

# Fix paths
sed -i '' 's|/speech-teleprompter/|/|g' index.html

# Commit and push
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
git push

echo "🎉 Deployment complete!"
echo "App: https://andrey-roshchupkin.github.io/speech-teleprompter/"
