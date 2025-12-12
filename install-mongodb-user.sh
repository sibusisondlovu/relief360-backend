#!/bin/bash

# MongoDB User Installation Script (No sudo required)
# Installs MongoDB to user's home directory

set -e

echo "=========================================="
echo "MongoDB User Installation (No sudo)"
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
INSTALL_DIR="$HOME/mongodb"
DATA_DIR="$HOME/mongodb-data"
LOG_DIR="$HOME/mongodb-logs"

echo "Architecture: $ARCH_TYPE"
echo "MongoDB Version: $MONGO_VERSION"
echo "Install Directory: $INSTALL_DIR"
echo ""

# Check if already installed
if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/bin/mongod" ]; then
    echo "✅ MongoDB appears to be already installed at $INSTALL_DIR"
    read -p "Do you want to reinstall? (y/N): " REINSTALL
    if [[ ! $REINSTALL =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    rm -rf "$INSTALL_DIR"
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
mkdir -p "$INSTALL_DIR"
cp -R "$EXTRACTED_DIR"/* "$INSTALL_DIR"/

echo "✅ Installation complete"
echo ""

# Create data and log directories
echo "📁 Creating data and log directories..."
mkdir -p "$DATA_DIR"
mkdir -p "$LOG_DIR"

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
else
    echo "✅ Already in PATH"
fi

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "MongoDB installed to: $INSTALL_DIR"
echo ""
echo "Next steps:"
echo ""
echo "1. Reload your shell configuration:"
echo "   source $SHELL_RC"
echo ""
echo "2. Start MongoDB:"
echo "   $INSTALL_DIR/bin/mongod --dbpath $DATA_DIR --logpath $LOG_DIR/mongo.log --fork"
echo ""
echo "3. Or add this alias to your shell config:"
echo "   alias mongodb-start='$INSTALL_DIR/bin/mongod --dbpath $DATA_DIR --logpath $LOG_DIR/mongo.log --fork'"
echo "   alias mongodb-stop='killall mongod'"
echo ""
echo "4. Verify installation:"
echo "   $INSTALL_DIR/bin/mongod --version"
echo "   $INSTALL_DIR/bin/mongosh --version"
echo ""
echo "5. Update .env file:"
echo "   DATABASE_URL=\"mongodb://localhost:27017/indigent_management\""
echo ""

# Cleanup
cd - > /dev/null
rm -rf "$TEMP_DIR"


