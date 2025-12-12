#!/bin/bash

# Fix Node.js Compatibility Issue for macOS 11

echo "=========================================="
echo "Node.js Compatibility Fix"
echo "=========================================="
echo ""

# Check current Node.js
echo "Current Node.js location:"
which node
echo ""

# Option 1: Install nvm and use compatible Node.js version
if [ ! -s "$HOME/.nvm/nvm.sh" ]; then
    echo "📥 Installing nvm (Node Version Manager)..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    echo "✅ nvm installed"
    echo ""
fi

# Load nvm if it exists
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if command -v nvm &> /dev/null || [ -s "$NVM_DIR/nvm.sh" ]; then
    echo "📦 Installing Node.js 18 (compatible with macOS 11)..."
    nvm install 18
    nvm use 18
    nvm alias default 18
    
    echo ""
    echo "✅ Node.js 18 installed and activated"
    echo ""
    node --version
    npm --version
    echo ""
    echo "Add this to your ~/.zshrc:"
    echo 'export NVM_DIR="$HOME/.nvm"'
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"'
    echo ""
else
    echo "⚠️  nvm installation may have failed"
    echo ""
    echo "Alternative: Install Node.js via Homebrew"
    echo "  brew install node@18"
    echo ""
fi

