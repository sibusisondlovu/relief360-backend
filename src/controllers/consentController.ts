import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDb } from '../utils/mongo';
import { logger } from '../utils/logger';
import { ConsentRecord } from '../models/types';
import { ObjectId } from 'mongodb';

export const consentController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { applicationId, userId } = req.query;

      const where: any = {};
      if (applicationId) where.applicationId = new ObjectId(applicationId as string);
      if (userId) where.userId = new ObjectId(userId as string);

      const consents = await getDb().collection<ConsentRecord>('consent_records').find(where, {
        sort: { createdAt: -1 }
      }).toArray();

      const transformedConsents = consents.map(c => ({
        ...c,
        id: c._id?.toString(),
        _id: undefined,
        applicationId: c.applicationId?.toString(),
        userId: c.userId?.toString()
      }));

      return res.json(transformedConsents);
    } catch (error) {
      logger.error('Get consents error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const consent = await getDb().collection<ConsentRecord>('consent_records').findOne({ _id: new ObjectId(id) });

      if (!consent) {
        return res.status(404).json({ error: 'Consent record not found' });
      }

      return res.json({
        ...consent,
        id: consent._id?.toString(),
        _id: undefined,
        applicationId: consent.applicationId?.toString(),
        userId: consent.userId?.toString()
      });
    } catch (error) {
      logger.error('Get consent error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { applicationId, consentType, granted, purpose, legalBasis } = req.body;

      const newConsent: ConsentRecord = {
        applicationId: applicationId ? new ObjectId(applicationId) : null,
        userId: req.user!.id ? new ObjectId(req.user!.id) : null,
        consentType,
        granted,
        grantedAt: granted ? new Date() : null,
        purpose,
        legalBasis,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await getDb().collection<ConsentRecord>('consent_records').insertOne(newConsent);
      newConsent._id = result.insertedId;

      return res.status(201).json({
        ...newConsent,
        id: newConsent._id?.toString(),
        _id: undefined,
        applicationId: newConsent.applicationId?.toString(),
        userId: newConsent.userId?.toString()
      });
    } catch (error) {
      logger.error('Create consent error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async revoke(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const result = await getDb().collection<ConsentRecord>('consent_records').findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            granted: false,
            revokedAt: new Date(),
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json({ error: 'Consent record not found' });
      }

      return res.json({
        ...result,
        id: result._id?.toString(),
        _id: undefined,
        applicationId: result.applicationId?.toString(),
        userId: result.userId?.toString()
      });
    } catch (error) {
      logger.error('Revoke consent error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

