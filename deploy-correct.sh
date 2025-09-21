#!/bin/bash

echo "🚀 Deploying to GitHub Pages..."

# Build the app
npm run build:prod

# Copy files to root
cp -r dist/* .

# Fix paths for GitHub Pages - remove leading slash
sed -i '' 's|href="/assets/|href="./assets/|g' index.html
sed -i '' 's|src="/assets/|src="./assets/|g' index.html

# Commit and push
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
git push

echo "🎉 Deployment complete!"
echo "App: https://andrey-roshchupkin.github.io/speech-teleprompter/"
