#!/bin/bash

# Start MongoDB with Replica Set Configuration

echo "Starting MongoDB with replica set..."

# Stop any existing MongoDB instances
killall mongod 2>/dev/null
sleep 2

# Start MongoDB with replica set
~/mongodb/bin/mongod \
  --dbpath ~/mongodb-data \
  --logpath ~/mongodb-logs/mongo.log \
  --replSet rs0 \
  --fork

echo "Waiting for MongoDB to start..."
sleep 5

# Initialize replica set using mongosh if available, otherwise use mongo
if command -v mongosh &> /dev/null; then
    mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})" --quiet
elif [ -f ~/mongodb/bin/mongo ]; then
    ~/mongodb/bin/mongo --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})" --quiet
else
    echo "⚠️  Cannot find mongosh or mongo client. Please initialize replica set manually:"
    echo "   Connect to MongoDB and run: rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
fi

echo ""
echo "Waiting for replica set to be ready..."
sleep 5

echo "✅ MongoDB started with replica set configuration"
echo ""
echo "Check status with: pgrep -x mongod"

