import { MongoClient, Db } from 'mongodb';
import { logger } from './logger';

const url = process.env.DATABASE_URL || 'mongodb://localhost:27017/relief360';
const client = new MongoClient(url);

let db: Db;

export const connectToMongo = async () => {
    try {
        await client.connect();
        db = client.db();
        logger.info('✅ Connected to MongoDB');
    } catch (error) {
        logger.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

export const getDb = (): Db => {
    if (!db) {
        throw new Error('Database not initialized. Call connectToMongo first.');
    }
    return db;
};
