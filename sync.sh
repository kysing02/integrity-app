#!/bin/bash

# --- AUTOMATIC PATH CONFIGURATION ---
# This finds the folder where this script is currently sitting (Dev folder)
DEV_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)

# This assumes the stable folder is a sibling to the dev folder
# Example: /home/user/project-dev and /home/user/project-stable
STABLE_DIR="$(dirname "$DEV_DIR")/integrity-stable"

# Stop script if any command fails
set -e

echo "------------------------------------------"
echo "🔄 PHASE 1: Syncing Dev to Main"
echo "------------------------------------------"
cd "$DEV_DIR"

# Ensure we are on dev branch
git checkout dev

# 1. Save and Push Dev
git add .
git commit -m "Update from dev: $(date +'%Y-%m-%d %H:%M')" || echo "No changes to commit"
git push origin dev

# 2. Merge Dev into Main
echo "🔀 Merging into 'main'..."
git checkout main
git pull origin main
git merge dev -m "Merge dev into main"
git push origin main

# 3. Return to Dev
git checkout dev

echo ""
echo "------------------------------------------"
echo "🚀 PHASE 2: Deploying to Stable"
echo "------------------------------------------"

# Check if stable directory exists before moving
if [ -d "$STABLE_DIR" ]; then
    cd "$STABLE_DIR"
    
    # Sync folder with GitHub Main
    git fetch origin main
    git reset --hard origin/main
    
    # Production Update
    npm install
    npm run build
    
    # Restart background process
    # This will try to restart, and if it's not running, it will start it
    pm2 restart integrity-stable || pm2 start npm --name "integrity-stable" -- start
    
    echo "✅ SUCCESS! Stable version updated."
else
    echo "⚠️  STABLE_DIR not found at $STABLE_DIR"
    echo "Skipping Phase 2. Code pushed to GitHub main successfully."
fi