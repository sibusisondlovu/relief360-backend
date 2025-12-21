import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../utils/mongo';
import { logger } from '../utils/logger';
import { User } from '../models/types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user: User) => {
  return jwt.sign(
    { id: user._id?.toString(), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const normalizedEmail = email.toLowerCase().trim();

      const user = await getDb().collection<User>('users').findOne({ email: normalizedEmail });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      await getDb().collection<User>('users').updateOne(
        { _id: user._id },
        { $set: { lastLoginAt: new Date() } }
      );

      const token = generateToken(user);

      return res.json({
        token,
        user: {
          id: user._id?.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      const existingUser = await getDb().collection<User>('users').findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser: User = {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || 'CLERK',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await getDb().collection<User>('users').insertOne(newUser);

      // Add _id back to user object for response
      newUser._id = result.insertedId;

      const token = generateToken(newUser);

      return res.status(201).json({
        token,
        user: {
          id: newUser._id?.toString(),
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async refreshToken(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Token required' });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const { ObjectId } = await import('mongodb');

      const user = await getDb().collection<User>('users').findOne({ _id: new ObjectId(decoded.id) });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      const newToken = generateToken(user);

      return res.json({ token: newToken });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  },
};

