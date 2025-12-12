# MongoDB Setup Status

## ✅ Completed Steps

1. **MongoDB Installed**: MongoDB v8.0.0 is installed at `~/mongodb/`
2. **MongoDB Running**: MongoDB server is running successfully
3. **Database Directories Created**:
   - Data directory: `~/mongodb-data`
   - Log directory: `~/mongodb-logs`
4. **Environment Configuration**: `.env` file created with:
   ```
   DATABASE_URL="mongodb://localhost:27017/indigent_management"
   ```

## ⚠️ Current Issue

Node.js has a compatibility issue with macOS 11. The installed Node.js was built for macOS 13.5, causing library conflicts.

## 🔧 Next Steps to Complete Setup

### Option 1: Fix Node.js (Recommended)

Install a Node.js version compatible with macOS 11:

```bash
# Using nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc
nvm install 18
nvm use 18

# Or using Homebrew with a compatible version
brew install node@18
```

### Option 2: Use npx directly (if available)

```bash
cd "/Users/mashudu/Indigent Management/backend"

# Try using npx directly
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### Option 3: Use Docker for Node.js

If Docker is working, you could run the backend in a container.

## 📋 Once Node.js is Fixed

After fixing Node.js, run these commands:

```bash
cd "/Users/mashudu/Indigent Management/backend"

# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run prisma:generate

# 3. Push schema to MongoDB
npm run prisma:push

# 4. Seed the database
npm run prisma:seed

# 5. Start the server
npm run dev
```

## 🚀 MongoDB Management Commands

### Start MongoDB
```bash
~/mongodb/bin/mongod --dbpath ~/mongodb-data --logpath ~/mongodb-logs/mongo.log --fork
```

### Stop MongoDB
```bash
killall mongod
```

### Check MongoDB Status
```bash
pgrep -x mongod && echo "MongoDB is running" || echo "MongoDB is not running"
```

### View MongoDB Logs
```bash
tail -f ~/mongodb-logs/mongo.log
```

### Connect to MongoDB Shell
```bash
# If mongosh is available
mongosh mongodb://localhost:27017/indigent_management

# Or use mongo (older client)
~/mongodb/bin/mongo mongodb://localhost:27017/indigent_management
```

## ✅ Verification

To verify MongoDB is working:

```bash
# Check if MongoDB is running
pgrep -x mongod

# Check MongoDB version
~/mongodb/bin/mongod --version

# Test connection (if mongosh is available)
mongosh --eval "db.adminCommand('ping')"
```

## 📝 Notes

- MongoDB is installed in your home directory: `~/mongodb/`
- No sudo required for this installation
- Database will be created automatically when Prisma pushes the schema
- Default connection: `mongodb://localhost:27017/indigent_management`

