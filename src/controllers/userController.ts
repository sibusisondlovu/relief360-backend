import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { logger } from '../utils/logger';

export const userController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(users);
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Don't allow users to change their own role
      if (id === req.user!.id && updateData.role) {
        return res.status(403).json({ error: 'Cannot change your own role' });
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      res.json(user);
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Don't allow users to delete themselves
      if (id === req.user!.id) {
        return res.status(403).json({ error: 'Cannot delete your own account' });
      }

      await prisma.user.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

