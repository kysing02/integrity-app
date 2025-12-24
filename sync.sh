#!/bin/bash

# --- AUTOMATIC PATH CONFIGURATION ---
DEV_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
STABLE_DIR="$(dirname "$DEV_DIR")/integrity-stable"

# Stop script if any command fails
set -e

# --- 1. GET COMMIT MESSAGE ---
COMMIT_MSG=$1
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update: $(date +'%Y-%m-%d %H:%M')"
fi

echo "------------------------------------------"
echo "🔄 PHASE 1: Syncing Dev to Main"
echo "Message: $COMMIT_MSG"
echo "------------------------------------------"

cd "$DEV_DIR"

# Standardize permissions for WSL/SourceTree
git config core.filemode false

# 1. Save and Push Dev
git checkout dev
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

if [ -d "$STABLE_DIR" ]; then
    cd "$STABLE_DIR"
    
    # Standardize permissions here too
    git config core.filemode false

    # 1. WIPE local "ghost" changes (like package-lock.json mods)
    git reset --hard HEAD
    git clean -fd
    
    # 2. Sync folder with GitHub Main
    git fetch origin main
    git reset --hard origin/main
    
    # 3. USE 'npm ci' (Clean Install) 
    # This prevents npm from modifying your lockfile during install
    echo "📦 Installing dependencies (Clean Install)..."
    npm ci
    
    # 4. Build
    echo "🏗️ Building Next.js project..."
    npm run build
    
    # 5. Restart background process
    pm2 restart integrity-stable || pm2 start npm --name "integrity-stable" -- start
    
    # 6. Final cleanup of any build-generated file changes
    git reset --hard HEAD

    echo "✅ SUCCESS! Stable version updated and running."
else
    echo "⚠️  STABLE_DIR not found at $STABLE_DIR"
    echo "Skipping Phase 2. Code pushed to GitHub main successfully."
fi