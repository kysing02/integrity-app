#!/bin/bash

# --- AUTOMATIC PATH CONFIGURATION ---
DEV_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
STABLE_DIR="$(dirname "$DEV_DIR")/integrity-stable"

# Stop script if any command fails
set -e

# --- 1. GET COMMIT MESSAGE ---
# Capture the first argument as the message
COMMIT_MSG=$1

# Fallback if no message is provided
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update: $(date +'%Y-%m-%d %H:%M')"
fi

echo "------------------------------------------"
echo "🔄 PHASE 1: Syncing Dev to Main"
echo "Message: $COMMIT_MSG"
echo "------------------------------------------"

cd "$DEV_DIR"

# Ensure we are on dev branch
git checkout dev

# OPTIONAL: Pre-deployment check
# echo "🧪 Running build check in Dev..."
# npm run build 

# 1. Save and Push Dev
git add .
git commit -m "$COMMIT_MSG" || echo "No changes to commit"
git push origin dev

# 2. Merge Dev into Main
echo "🔀 Merging into 'main'..."
git checkout main
git pull origin main
git merge dev -m "Merge dev into main: $COMMIT_MSG"
git push origin main

# 3. Return to Dev
git checkout dev

echo ""
echo "------------------------------------------"
echo "🚀 PHASE 2: Deploying to Stable"
echo "------------------------------------------"

# Check if stable directory exists
if [ -d "$STABLE_DIR" ]; then
    cd "$STABLE_DIR"
    
    # Sync folder with GitHub Main
    git fetch origin main
    git reset --hard origin/main
    
    # Production Update
    npm install
    npm run build
    
    # Restart background process
    # Tries to restart; if it's the first time, it starts it.
    pm2 restart integrity-stable || pm2 start npm --name "integrity-stable" -- start
    
    echo "✅ SUCCESS! Stable version updated."
else
    echo "⚠️  STABLE_DIR not found at $STABLE_DIR"
    echo "Skipping Phase 2. Code pushed to GitHub main successfully."
fi