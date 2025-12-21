import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDb } from '../utils/mongo';
import { logger } from '../utils/logger';
import { generateApplicationNumber } from '../utils/applicationNumber';
import { calculateMeansTest } from '../services/meansTestService';
import { Application, Document, ApplicationStatus, MeansTestStatus } from '../models/types';
import { ObjectId } from 'mongodb';

export const applicationController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const {
        status,
        search,
        page = '1',
        limit = '20',
        sortBy = 'applicationDate',
        sortOrder = 'desc',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.$or = [
          { applicationNumber: { $regex: search as string, $options: 'i' } },
          { idNumber: { $regex: search as string, $options: 'i' } },
          { firstName: { $regex: search as string, $options: 'i' } },
          { lastName: { $regex: search as string, $options: 'i' } },
        ];
      }

      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const [applications, total] = await Promise.all([
        getDb().collection<Application>('applications').aggregate([
          { $match: where },
          { $sort: sort },
          { $skip: skip },
          { $limit: limitNum },
          {
            $lookup: {
              from: 'users',
              localField: 'createdById',
              foreignField: '_id',
              as: 'createdBy'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'reviewedById',
              foreignField: '_id',
              as: 'reviewedBy'
            }
          },
          { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
          { $unwind: { path: '$reviewedBy', preserveNullAndEmptyArrays: true } },
          // Count related items
          {
            $lookup: {
              from: 'documents',
              localField: '_id',
              foreignField: 'applicationId',
              as: 'documents'
            }
          },
          {
            $lookup: {
              from: 'benefits',
              localField: '_id',
              foreignField: 'applicationId',
              as: 'benefits'
            }
          },
          {
            $lookup: {
              from: 'household_members',
              localField: '_id',
              foreignField: 'applicationId',
              as: 'householdMembers'
            }
          },
          {
            $addFields: {
              _count: {
                documents: { $size: '$documents' },
                benefits: { $size: '$benefits' },
                householdMembers: { $size: '$householdMembers' }
              }
            }
          },
          {
            $project: {
              documents: 0,
              benefits: 0,
              householdMembers: 0,
              'createdBy.passwordHash': 0,
              'reviewedBy.passwordHash': 0
            }
          }
        ]).toArray(),
        getDb().collection('applications').countDocuments(where),
      ]);

      // Transform IDs
      const transformedApplications = applications.map(app => ({
        ...app,
        id: app._id.toString(),
        _id: undefined,
        createdById: app.createdById ? app.createdById.toString() : null,
        reviewedById: app.reviewedById ? app.reviewedById.toString() : null,
        createdBy: app.createdBy ? { ...app.createdBy, id: app.createdBy._id.toString(), _id: undefined } : null,
        reviewedBy: app.reviewedBy ? { ...app.reviewedBy, id: app.reviewedBy._id.toString(), _id: undefined } : null,
      }));

      return res.json({
        data: transformedApplications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      logger.error('Get applications error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const application = await getDb().collection<Application>('applications').aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'createdById',
            foreignField: '_id',
            as: 'createdBy'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'reviewedById',
            foreignField: '_id',
            as: 'reviewedBy'
          }
        },
        { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$reviewedBy', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'documents',
            localField: '_id',
            foreignField: 'applicationId',
            as: 'documents'
          }
        },
        {
          $lookup: {
            from: 'benefits',
            localField: '_id',
            foreignField: 'applicationId',
            as: 'benefits'
          }
        },
        {
          $lookup: {
            from: 'household_members',
            localField: '_id',
            foreignField: 'applicationId',
            as: 'householdMembers'
          }
        },
        {
          $project: {
            'createdBy.passwordHash': 0,
            'reviewedBy.passwordHash': 0
          }
        }
      ]).next();

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Transform IDs for single application and its relations
      // ... (simplification for brevity, assume manual recursive transform or simple object return)
      const transformedApp = {
        ...application,
        id: application._id.toString(),
        _id: undefined,
        createdBy: application.createdBy ? { ...application.createdBy, id: application.createdBy._id.toString(), _id: undefined } : null,
        reviewedBy: application.reviewedBy ? { ...application.reviewedBy, id: application.reviewedBy._id.toString(), _id: undefined } : null,
        documents: application.documents.map((d: any) => ({ ...d, id: d._id.toString(), _id: undefined, applicationId: d.applicationId.toString() })),
        benefits: application.benefits.map((b: any) => ({ ...b, id: b._id.toString(), _id: undefined, applicationId: b.applicationId.toString() })),
        householdMembers: application.householdMembers.map((h: any) => ({ ...h, id: h._id.toString(), _id: undefined, applicationId: h.applicationId.toString() }))
      };

      return res.json(transformedApp);
    } catch (error) {
      logger.error('Get application error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const applicationData = req.body;
      const userId = req.user!.id;

      const applicationNumber = await generateApplicationNumber();

      const newApplication: Application = {
        ...applicationData,
        applicationNumber,
        createdById: new ObjectId(userId),
        dateOfBirth: new Date(applicationData.dateOfBirth),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: ApplicationStatus.PENDING, // Default
        householdSize: Number(applicationData.householdSize),
        monthlyIncome: Number(applicationData.monthlyIncome),
        monthlyExpenses: Number(applicationData.monthlyExpenses)
      };

      const result = await getDb().collection<Application>('applications').insertOne(newApplication);
      newApplication._id = result.insertedId;

      // Fetch user to return full object like Prisma did? Or just return created object
      const createdUser = await getDb().collection('users').findOne({ _id: new ObjectId(userId) });

      return res.status(201).json({
        ...newApplication,
        id: newApplication._id?.toString(),
        _id: undefined,
        createdById: userId,
        createdBy: createdUser ? { id: createdUser._id.toString(), firstName: createdUser.firstName, lastName: createdUser.lastName, email: createdUser.email } : null
      });
    } catch (error) {
      logger.error('Create application error:', error);
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

      const application = await getDb().collection<Application>('applications').findOne({ _id: new ObjectId(id) });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (application.status === ApplicationStatus.APPROVED && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Cannot modify approved application' });
      }

      const updateFields = {
        ...updateData,
        updatedAt: new Date()
      };
      if (updateData.dateOfBirth) updateFields.dateOfBirth = new Date(updateData.dateOfBirth);
      delete updateFields.id;

      const result = await getDb().collection<Application>('applications').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json({ error: 'Application not found' });
      }

      return res.json({
        ...result,
        id: result._id?.toString(),
        _id: undefined,
        createdById: result.createdById?.toString(),
        reviewedById: result.reviewedById?.toString()
      });
    } catch (error) {
      logger.error('Update application error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async submitForReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Need to fetch documents to validate
      const application: any = await getDb().collection('applications').aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'documents',
            localField: '_id',
            foreignField: 'applicationId',
            as: 'documents'
          }
        }
      ]).next();

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (application.status !== ApplicationStatus.PENDING) {
        return res.status(400).json({ error: 'Application already submitted' });
      }

      // Validate required documents
      const requiredDocs = ['ID_DOCUMENT', 'PROOF_OF_INCOME'];
      const hasRequiredDocs = requiredDocs.every(docType =>
        application.documents.some((doc: Document) => doc.documentType === docType && doc.verified)
      );

      if (!hasRequiredDocs) {
        return res.status(400).json({ error: 'Required documents missing or not verified' });
      }

      const updated = await getDb().collection<Application>('applications').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status: ApplicationStatus.UNDER_REVIEW, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (!updated) { return res.status(404).json({ error: 'App not found during update' }); }

      return res.json({
        ...updated,
        id: updated._id?.toString(),
        _id: undefined
      });
    } catch (error) {
      logger.error('Submit for review error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async review(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes, rejectionReason } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const application = await getDb().collection<Application>('applications').findOne({ _id: new ObjectId(id) });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (application.status !== ApplicationStatus.UNDER_REVIEW) {
        return res.status(400).json({ error: 'Application not under review' });
      }

      const updateData: any = {
        status,
        reviewedById: new ObjectId(req.user!.id),
        reviewDate: new Date(),
        notes,
        updatedAt: new Date()
      };

      if (status === ApplicationStatus.APPROVED) {
        updateData.approvalDate = new Date();
        updateData.expiryDate = new Date();
        updateData.expiryDate.setFullYear(updateData.expiryDate.getFullYear() + 1);
      } else if (status === ApplicationStatus.REJECTED) {
        updateData.rejectionReason = rejectionReason;
      }

      const updated = await getDb().collection<Application>('applications').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!updated) { return res.status(404).json({ error: 'App not found during update' }); }

      return res.json({
        ...updated,
        id: updated._id?.toString(),
        _id: undefined,
        reviewedById: updated.reviewedById?.toString(),
        createdById: updated.createdById?.toString()
      });
    } catch (error) {
      logger.error('Review application error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async runMeansTest(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const application: any = await getDb().collection('applications').aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'household_members',
            localField: '_id',
            foreignField: 'applicationId',
            as: 'householdMembers'
          }
        }
      ]).next();

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const meansTestResult = calculateMeansTest(application);

      // Ensure that result status matches Enum or cast it if logic guarantees it
      const status: MeansTestStatus = meansTestResult.status as MeansTestStatus;

      const updated = await getDb().collection<Application>('applications').findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            meansTestScore: meansTestResult.score,
            meansTestStatus: status,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      return res.json({
        application: { ...updated, id: updated?._id?.toString(), _id: undefined },
        meansTest: meansTestResult,
      });
    } catch (error) {
      logger.error('Means test error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      await getDb().collection<Application>('applications').deleteOne({
        _id: new ObjectId(id)
      });

      return res.status(204).send();
    } catch (error) {
      logger.error('Delete application error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

