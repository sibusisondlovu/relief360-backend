# ✅ MongoDB Setup Complete!

## What's Been Done

1. ✅ **MongoDB Installed**: MongoDB v8.0.0 at `~/mongodb/`
2. ✅ **MongoDB Running**: Server is running with replica set `rs0`
3. ✅ **Database Created**: `indigent_management` database
4. ✅ **Schema Pushed**: All Prisma models created in MongoDB
5. ✅ **Database Seeded**: Default users created

## Default Login Credentials

- **Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / manager123  
- **Clerk**: clerk@example.com / clerk123

## MongoDB Management

### Start MongoDB
```bash
~/mongodb/bin/mongod --dbpath ~/mongodb-data --logpath ~/mongodb-logs/mongo.log --replSet rs0 --fork
```

### Stop MongoDB
```bash
killall mongod
```

### Check Status
```bash
pgrep -x mongod && echo "Running" || echo "Not running"
```

## Start the Application

```bash
cd "/Users/mashudu/Indigent Management/backend"

# Load nvm (Node.js 18)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18

# Start the server
npm run dev
```

The backend will run on `http://localhost:3001`

## Start the Frontend

In a new terminal:

```bash
cd "/Users/mashudu/Indigent Management/frontend"
npm install  # If not done yet
npm run dev
```

The frontend will run on `http://localhost:3000`

## Environment Variables

The `.env` file is configured with:
- `DATABASE_URL="mongodb://localhost:27017/indigent_management"`
- Other required settings

## Next Steps

1. Start MongoDB (if not running): Use the command above
2. Start backend: `npm run dev` in backend directory
3. Start frontend: `npm run dev` in frontend directory
4. Login at http://localhost:3000 with one of the default users

## Troubleshooting

If MongoDB stops, restart it with the start command above.
The replica set (rs0) is already configured, so it will work immediately.

