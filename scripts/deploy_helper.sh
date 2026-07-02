#!/usr/bin/env bash
# ==============================================================================
# KiaBiyu Budget Tracker — Interactive Git Commit & Deploy CLI
# ==============================================================================
set -euo pipefail

# Text colors for beautiful terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${PURPLE}===================================================${NC}"
echo -e "${PURPLE}   🌌 KiaBiyu Budget Tracker — Deployment Helper   ${NC}"
echo -e "${PURPLE}===================================================${NC}"

# Ensure we are inside a Git repository
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not a git repository!${NC}"
    exit 1
fi

# 1. Fetch existing branches
echo -e "\n${BLUE}🔍 Scanning local Git branches...${NC}"

# Ensure development branch is listed as an option even if it doesn't exist locally yet
default_branches=("main" "development")
existing_branches=()

# Read other local branches
while IFS= read -r branch; do
    clean_branch=$(echo "$branch" | sed 's/^[ *]*//')
    if [[ "$clean_branch" != "main" && "$clean_branch" != "development" && -n "$clean_branch" ]]; then
        existing_branches+=("$clean_branch")
    fi
done < <(git branch)

# Combine branches into a master selection menu
all_branches=("${default_branches[@]}" "${existing_branches[@]}")

echo -e "${BLUE}👉 Choose target branch to push and deploy:${NC}"
for i in "${!all_branches[@]}"; do
    echo -e "  $((i+1))) ${CYAN}${all_branches[i]}${NC}"
done

# Prompt for selection
read -p "Enter number (1-${#all_branches[@]}): " selection_idx

# Validate selection
if ! [[ "$selection_idx" =~ ^[0-9]+$ ]] || [ "$selection_idx" -lt 1 ] || [ "$selection_idx" -gt "${#all_branches[@]}" ]; then
    echo -e "${RED}❌ Invalid selection. Exiting.${NC}"
    exit 1
fi

TARGET_BRANCH="${all_branches[$((selection_idx-1))]}"
echo -e "${GREEN}✓ Selected Target Branch: ${TARGET_BRANCH}${NC}"

# Ensure branch exists, if not, offer to create it
if ! git show-ref --verify --quiet "refs/heads/${TARGET_BRANCH}"; then
    echo -e "${YELLOW}⚠️ Branch '${TARGET_BRANCH}' does not exist locally. Creating it...${NC}"
    git checkout -b "${TARGET_BRANCH}"
else
    git checkout "${TARGET_BRANCH}"
fi

# 2. Analyze modified/untracked files for commit message draft
echo -e "\n${BLUE}🔍 Analyzing changes to generate a Conventional Commit message...${NC}"

# Get modified and untracked files
changed_files=$(git status --porcelain | awk '{print $2}')

if [ -z "$changed_files" ]; then
    echo -e "${YELLOW}⚠️ No modifications found. Everything is up to date!${NC}"
    exit 0
fi

# Basic automatic conventional commit classifier
commit_type="feat"
scope="ui"
desc="update application layout and settings"

# Analyze files to suggest a realistic scope/type
if echo "$changed_files" | grep -q "Settings.jsx"; then
    scope="settings"
    desc="refine appearance preferences and theme toggle"
elif echo "$changed_files" | grep -q "History.jsx"; then
    scope="history"
    desc="optimize history chart and label contrast"
elif echo "$changed_files" | grep -q "Transactions.jsx"; then
    scope="transactions"
    desc="add family view spender attribution option"
elif echo "$changed_files" | grep -q ".env" || echo "$changed_files" | grep -q ".gitignore"; then
    commit_type="chore"
    scope="security"
    desc="improve credential protection and ignore rules"
fi

draft_message="${commit_type}(${scope}): ${desc}"

echo -e "${YELLOW}💡 Suggested Commit Message:${NC}"
echo -e "   👉 ${GREEN}${draft_message}${NC}"

read -p "Accept suggestion? [Y/n]: " accept_suggest
accept_suggest=${accept_suggest:-"y"}

FINAL_COMMIT_MSG=""
if [[ "$accept_suggest" =~ ^[Yy]$ ]]; then
    FINAL_COMMIT_MSG="$draft_message"
else
    read -p "Enter custom commit message (following 'type(scope): message'): " custom_msg
    FINAL_COMMIT_MSG="$custom_msg"
fi

# Double check that we have a commit message
if [ -z "$FINAL_COMMIT_MSG" ]; then
    echo -e "${RED}❌ Commit message cannot be empty. Aborting.${NC}"
    exit 1
fi

# 3. Add, Commit, and Push
echo -e "\n${BLUE}📦 Committing changes...${NC}"
git add .
git commit -m "$FINAL_COMMIT_MSG"

echo -e "\n${BLUE}🚀 Pushing changes to remote repository (${TARGET_BRANCH})...${NC}"
# Use --set-upstream if pushing a branch for the first time
if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
    git push --set-upstream origin "${TARGET_BRANCH}"
else
    git push origin "${TARGET_BRANCH}"
fi

echo -e "\n${GREEN}🎉 Successfully committed and pushed to '${TARGET_BRANCH}'!${NC}"
echo -e "${GREEN}   Message: ${FINAL_COMMIT_MSG}${NC}"
