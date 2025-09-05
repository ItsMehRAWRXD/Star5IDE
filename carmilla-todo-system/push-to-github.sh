#!/bin/bash

echo "╔════════════════════════════════════════════════╗"
echo "║     Push Carmilla Todo System to GitHub       ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check if git is configured
if [ -z "$(git config user.name)" ] || [ -z "$(git config user.email)" ]; then
    echo "Setting up git config..."
    echo "Please enter your GitHub username:"
    read github_username
    echo "Please enter your GitHub email:"
    read github_email
    
    git config user.name "$github_username"
    git config user.email "$github_email"
fi

echo ""
echo "Creating new repository on GitHub..."
echo ""
echo "Option 1: Create a new public repository"
echo "Option 2: Use an existing repository"
echo ""
echo "Enter your choice (1 or 2):"
read choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "Enter the name for your new repository (e.g., carmilla-todo-system):"
    read repo_name
    
    echo ""
    echo "To create the repository, you need to:"
    echo "1. Go to https://github.com/new"
    echo "2. Repository name: $repo_name"
    echo "3. Make it public"
    echo "4. DO NOT initialize with README, .gitignore, or license"
    echo "5. Click 'Create repository'"
    echo ""
    echo "Once created, enter your GitHub username:"
    read github_user
    
    # Set up remote
    git remote add origin "https://github.com/$github_user/$repo_name.git"
    
else
    echo ""
    echo "Enter your GitHub username:"
    read github_user
    echo "Enter your repository name:"
    read repo_name
    
    # Set up remote
    git remote add origin "https://github.com/$github_user/$repo_name.git"
fi

echo ""
echo "Ready to push to: https://github.com/$github_user/$repo_name"
echo ""
echo "Pushing to GitHub..."

# Change to main branch (GitHub default)
git branch -M main

# Push to GitHub
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "Your repository is now available at:"
    echo "https://github.com/$github_user/$repo_name"
    echo ""
    echo "To clone it elsewhere:"
    echo "git clone https://github.com/$github_user/$repo_name.git"
else
    echo ""
    echo "❌ Push failed. Please check your credentials and try again."
    echo ""
    echo "If you haven't set up GitHub authentication, you may need to:"
    echo "1. Create a personal access token at https://github.com/settings/tokens"
    echo "2. Use the token as your password when prompted"
    echo ""
    echo "Or use SSH:"
    echo "git remote set-url origin git@github.com:$github_user/$repo_name.git"
fi