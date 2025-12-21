import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDb } from '../utils/mongo';
import { logger } from '../utils/logger';
import { Benefit, Application } from '../models/types';
import { ObjectId } from 'mongodb';

export const benefitController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { applicationId, status } = req.query;

      const where: any = {};
      if (applicationId) where.applicationId = new ObjectId(applicationId as string);
      if (status) where.status = status;

      const benefits = await getDb().collection<Benefit>('benefits').aggregate([
        { $match: where },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'applications',
            localField: 'applicationId',
            foreignField: '_id',
            as: 'application'
          }
        },
        { $unwind: '$application' },
        {
          $project: {
            _id: 1,
            benefitType: 1,
            amount: 1,
            status: 1,
            startDate: 1,
            endDate: 1,
            createdAt: 1,
            updatedAt: 1,
            applicationId: 1,
            application: {
              _id: 1,
              id: { $toString: '$application._id' },
              applicationNumber: 1,
              firstName: 1,
              lastName: 1
            }
          }
        }
      ]).toArray();

      const transformedBenefits = benefits.map(b => ({
        ...b,
        id: b._id.toString(),
        _id: undefined,
        applicationId: b.applicationId.toString(),
        application: { ...b.application, _id: undefined }
      }));

      return res.json(transformedBenefits);
    } catch (error) {
      logger.error('Get benefits error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const benefit = await getDb().collection<Benefit>('benefits').aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'applications',
            localField: 'applicationId',
            foreignField: '_id',
            as: 'application'
          }
        },
        { $unwind: '$application' }
      ]).next(); // Use next() for single doc

      if (!benefit) {
        return res.status(404).json({ error: 'Benefit not found' });
      }

      return res.json({
        ...benefit,
        id: benefit._id.toString(),
        _id: undefined,
        applicationId: benefit.applicationId.toString(),
        application: { ...benefit.application, id: benefit.application._id.toString(), _id: undefined }
      });
    } catch (error) {
      logger.error('Get benefit error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const benefitData = req.body;

      // Verify application is approved
      const application = await getDb().collection<Application>('applications').findOne({ _id: new ObjectId(benefitData.applicationId) });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (application.status !== 'APPROVED') {
        return res.status(400).json({ error: 'Application must be approved to assign benefits' });
      }

      const newBenefit: Benefit = {
        ...benefitData,
        applicationId: new ObjectId(benefitData.applicationId),
        startDate: new Date(benefitData.startDate),
        endDate: benefitData.endDate ? new Date(benefitData.endDate) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await getDb().collection<Benefit>('benefits').insertOne(newBenefit);
      newBenefit._id = result.insertedId;

      return res.status(201).json({
        ...newBenefit,
        id: result.insertedId.toString(),
        _id: undefined,
        applicationId: newBenefit.applicationId.toString(),
        application: { ...application, id: application._id?.toString(), _id: undefined }
      });
    } catch (error) {
      logger.error('Create benefit error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const updateFields = {
        ...updateData,
        updatedAt: new Date()
      };

      if (updateData.startDate) updateFields.startDate = new Date(updateData.startDate);
      if (updateData.endDate) updateFields.endDate = new Date(updateData.endDate);
      // Remove undefined/nulls if any logic needed, but Mongo handles direct update
      delete updateFields.id;

      const result = await getDb().collection<Benefit>('benefits').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json({ error: 'Benefit not found' });
      }

      return res.json({
        ...result,
        id: result._id?.toString(),
        _id: undefined,
        applicationId: result.applicationId.toString()
      });
    } catch (error) {
      logger.error('Update benefit error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      await getDb().collection<Benefit>('benefits').deleteOne({
        _id: new ObjectId(id)
      });

      return res.status(204).send();
    } catch (error) {
      logger.error('Delete benefit error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

