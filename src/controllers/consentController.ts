import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { logger } from '../utils/logger';

export const consentController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { applicationId, userId } = req.query;

      const where: any = {};
      if (applicationId) where.applicationId = applicationId as string;
      if (userId) where.userId = userId as string;

      const consents = await prisma.consentRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return res.json(consents);
    } catch (error) {
      logger.error('Get consents error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const consent = await prisma.consentRecord.findUnique({
        where: { id },
      });

      if (!consent) {
        return res.status(404).json({ error: 'Consent record not found' });
      }

      return res.json(consent);
    } catch (error) {
      logger.error('Get consent error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { applicationId, consentType, granted, purpose, legalBasis } = req.body;

      const consent = await prisma.consentRecord.create({
        data: {
          applicationId,
          userId: req.user!.id,
          consentType,
          granted,
          grantedAt: granted ? new Date() : null,
          purpose,
          legalBasis,
        },
      });

      return res.status(201).json(consent);
    } catch (error) {
      logger.error('Create consent error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async revoke(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const consent = await prisma.consentRecord.update({
        where: { id },
        data: {
          granted: false,
          revokedAt: new Date(),
        },
      });

      return res.json(consent);
    } catch (error) {
      logger.error('Revoke consent error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

