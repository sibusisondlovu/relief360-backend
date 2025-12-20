#!/bin/bash

# Start Script for Indigent Management Backend

echo "=========================================="
echo "Starting Indigent Management Backend"
echo "=========================================="
echo ""

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node.js 18
nvm use 18

# Check if MongoDB is running
# if ! pgrep -x mongod > /dev/null; then
#     echo "⚠️  MongoDB is not running. Starting MongoDB..."
#     ~/mongodb/bin/mongod --dbpath ~/mongodb-data --logpath ~/mongodb-logs/mongo.log --replSet rs0 --fork
#     sleep 3
#     echo "✅ MongoDB started"
#     echo ""
# fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.template .env 2>/dev/null || echo "DATABASE_URL=\"mongodb://localhost:27017/indigent_management\"" > .env
    echo "✅ .env file created"
    echo ""
fi

echo "Starting backend server..."
echo ""

# Start the server
npm run dev

