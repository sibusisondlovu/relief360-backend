#!/bin/bash

# MongoDB Local Installation Script
# This script downloads and installs MongoDB Community Edition directly

set -e

echo "=========================================="
echo "MongoDB Local Installation"
echo "=========================================="
echo ""

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" == "x86_64" ]; then
    ARCH_TYPE="x86_64"
elif [ "$ARCH" == "arm64" ]; then
    ARCH_TYPE="arm64"
else
    echo "❌ Unsupported architecture: $ARCH"
    exit 1
fi

MONGO_VERSION="7.0.26"
INSTALL_DIR="/usr/local/mongodb"
DATA_DIR="/usr/local/var/mongodb"
LOG_DIR="/usr/local/var/log/mongodb"

echo "Architecture: $ARCH_TYPE"
echo "MongoDB Version: $MONGO_VERSION"
echo ""

# Check if already installed
if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/bin/mongod" ]; then
    echo "✅ MongoDB appears to be already installed at $INSTALL_DIR"
    read -p "Do you want to reinstall? (y/N): " REINSTALL
    if [[ ! $REINSTALL =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "📥 Downloading MongoDB..."
echo ""

# Download MongoDB
if [ "$ARCH_TYPE" == "arm64" ]; then
    DOWNLOAD_URL="https://fastdl.mongodb.org/osx/mongodb-macos-arm64-${MONGO_VERSION}.tgz"
else
    DOWNLOAD_URL="https://fastdl.mongodb.org/osx/mongodb-macos-x86_64-${MONGO_VERSION}.tgz"
fi

echo "Download URL: $DOWNLOAD_URL"
echo ""

if command -v curl &> /dev/null; then
    curl -L -o mongodb.tgz "$DOWNLOAD_URL"
elif command -v wget &> /dev/null; then
    wget -O mongodb.tgz "$DOWNLOAD_URL"
else
    echo "❌ Neither curl nor wget found. Please install one of them."
    exit 1
fi

if [ ! -f mongodb.tgz ]; then
    echo "❌ Download failed. Please download manually from:"
    echo "   https://www.mongodb.com/try/download/community"
    echo ""
    echo "   Then extract and move to $INSTALL_DIR"
    exit 1
fi

echo "✅ Download complete"
echo ""

echo "📦 Extracting..."
tar -xzf mongodb.tgz
EXTRACTED_DIR=$(ls -d mongodb-macos-* | head -1)

echo "✅ Extraction complete"
echo ""

echo "📁 Installing to $INSTALL_DIR..."
sudo mkdir -p "$INSTALL_DIR"
sudo rm -rf "$INSTALL_DIR"/*
sudo cp -R "$EXTRACTED_DIR"/* "$INSTALL_DIR"/

echo "✅ Installation complete"
echo ""

# Create data and log directories
echo "📁 Creating data and log directories..."
sudo mkdir -p "$DATA_DIR"
sudo mkdir -p "$LOG_DIR"
sudo chown $(whoami) "$DATA_DIR"
sudo chown $(whoami) "$LOG_DIR"

echo "✅ Directories created"
echo ""

# Add to PATH
echo "🔧 Adding to PATH..."
SHELL_RC="$HOME/.zshrc"
if [ -f "$HOME/.bash_profile" ]; then
    SHELL_RC="$HOME/.bash_profile"
fi

if ! grep -q "$INSTALL_DIR/bin" "$SHELL_RC" 2>/dev/null; then
    echo "" >> "$SHELL_RC"
    echo "# MongoDB" >> "$SHELL_RC"
    echo "export PATH=\"$INSTALL_DIR/bin:\$PATH\"" >> "$SHELL_RC"
    echo "✅ Added to $SHELL_RC"
    echo "   Please run: source $SHELL_RC"
else
    echo "✅ Already in PATH"
fi

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Reload your shell configuration:"
echo "   source $SHELL_RC"
echo ""
echo "2. Start MongoDB:"
echo "   mongod --dbpath $DATA_DIR --logpath $LOG_DIR/mongo.log --fork"
echo ""
echo "3. Or create a launchd service (recommended):"
echo "   See: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/#run-mongodb-community-edition-as-a-macos-service"
echo ""
echo "4. Verify installation:"
echo "   mongod --version"
echo "   mongosh --version"
echo ""

# Cleanup
cd - > /dev/null
rm -rf "$TEMP_DIR"


