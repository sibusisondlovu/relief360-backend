#!/bin/bash

# Database Setup Script for Indigent Management System
# This script helps set up the PostgreSQL database

echo "=========================================="
echo "Indigent Management - Database Setup"
echo "=========================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    echo ""
    echo "Please install PostgreSQL using one of these methods:"
    echo ""
    echo "Option 1: Using Homebrew (recommended for macOS):"
    echo "  brew install postgresql@14"
    echo "  brew services start postgresql@14"
    echo ""
    echo "Option 2: Download from PostgreSQL website:"
    echo "  https://www.postgresql.org/download/macosx/"
    echo ""
    echo "Option 3: Using Postgres.app:"
    echo "  https://postgresapp.com/"
    echo ""
    exit 1
fi

echo "✅ PostgreSQL is installed"
echo ""

# Get database connection details
read -p "Enter PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -p "Enter PostgreSQL password (press Enter if no password): " -s DB_PASSWORD
echo ""

read -p "Enter PostgreSQL host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter PostgreSQL port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Enter database name (default: indigent_management): " DB_NAME
DB_NAME=${DB_NAME:-indigent_management}

# Construct connection string
if [ -z "$DB_PASSWORD" ]; then
    DATABASE_URL="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
else
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
fi

echo ""
echo "Creating database: $DB_NAME"
echo ""

# Create database
export PGPASSWORD="$DB_PASSWORD"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "⚠️  Database '$DB_NAME' already exists."
    read -p "Do you want to drop and recreate it? (y/N): " RECREATE
    if [[ $RECREATE =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
        echo "Creating new database..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
        echo "✅ Database created successfully"
    else
        echo "Using existing database."
    fi
else
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
    echo "✅ Database created successfully"
fi

unset PGPASSWORD

# Update .env file
echo ""
echo "Updating .env file with database connection..."

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Created .env file from .env.example"
    else
        echo "DATABASE_URL=\"$DATABASE_URL\"" > .env
        echo "PORT=3001" >> .env
        echo "NODE_ENV=development" >> .env
        echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
        echo "JWT_EXPIRES_IN=7d" >> .env
        echo "MAX_FILE_SIZE=10485760" >> .env
        echo "UPLOAD_DIR=./uploads" >> .env
        echo "CORS_ORIGIN=http://localhost:3000" >> .env
        echo "DATA_RETENTION_DAYS=2555" >> .env
        echo "AUDIT_LOG_ENABLED=true" >> .env
        echo "Created new .env file"
    fi
fi

# Update DATABASE_URL in .env
if grep -q "DATABASE_URL=" .env; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
    else
        # Linux
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
    fi
else
    echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
fi

echo "✅ .env file updated"
echo ""
echo "=========================================="
echo "Next steps:"
echo "=========================================="
echo "1. Run migrations:"
echo "   npm run prisma:migrate"
echo ""
echo "2. Generate Prisma client:"
echo "   npm run prisma:generate"
echo ""
echo "3. Seed the database:"
echo "   npm run prisma:seed"
echo ""
echo "4. Start the server:"
echo "   npm run dev"
echo ""

