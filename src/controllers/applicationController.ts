import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { logger } from '../utils/logger';
import { generateApplicationNumber } from '../utils/applicationNumber';
import { calculateMeansTest } from '../services/meansTestService';

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
        where.OR = [
          { applicationNumber: { contains: search as string, mode: 'insensitive' } },
          { idNumber: { contains: search as string, mode: 'insensitive' } },
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [applications, total] = await Promise.all([
        prisma.application.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { [sortBy as string]: sortOrder },
          include: {
            createdBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            reviewedBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            _count: {
              select: { documents: true, benefits: true, householdMembers: true },
            },
          },
        }),
        prisma.application.count({ where }),
      ]);

      res.json({
        data: applications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      logger.error('Get applications error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const application = await prisma.application.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          reviewedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          documents: true,
          benefits: true,
          householdMembers: true,
        },
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      res.json(application);
    } catch (error) {
      logger.error('Get application error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const applicationData = req.body;
      const userId = req.user!.id;

      const applicationNumber = await generateApplicationNumber();

      const application = await prisma.application.create({
        data: {
          ...applicationData,
          applicationNumber,
          createdById: userId,
          dateOfBirth: new Date(applicationData.dateOfBirth),
        },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      res.status(201).json(application);
    } catch (error) {
      logger.error('Create application error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const application = await prisma.application.findUnique({
        where: { id },
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (application.status === 'APPROVED' && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Cannot modify approved application' });
      }

      const updated = await prisma.application.update({
        where: { id },
        data: {
          ...updateData,
          dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined,
        },
      });

      res.json(updated);
    } catch (error) {
      logger.error('Update application error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async submitForReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const application = await prisma.application.findUnique({
        where: { id },
        include: { documents: true },
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (application.status !== 'PENDING') {
        return res.status(400).json({ error: 'Application already submitted' });
      }

      // Validate required documents
      const requiredDocs = ['ID_DOCUMENT', 'PROOF_OF_INCOME'];
      const hasRequiredDocs = requiredDocs.every(docType =>
        application.documents.some(doc => doc.documentType === docType && doc.verified)
      );

      if (!hasRequiredDocs) {
        return res.status(400).json({ error: 'Required documents missing or not verified' });
      }

      const updated = await prisma.application.update({
        where: { id },
        data: { status: 'UNDER_REVIEW' },
      });

      res.json(updated);
    } catch (error) {
      logger.error('Submit for review error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async review(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes, rejectionReason } = req.body;

      const application = await prisma.application.findUnique({
        where: { id },
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (application.status !== 'UNDER_REVIEW') {
        return res.status(400).json({ error: 'Application not under review' });
      }

      const updateData: any = {
        status,
        reviewedById: req.user!.id,
        reviewDate: new Date(),
        notes,
      };

      if (status === 'APPROVED') {
        updateData.approvalDate = new Date();
        updateData.expiryDate = new Date();
        updateData.expiryDate.setFullYear(updateData.expiryDate.getFullYear() + 1);
      } else if (status === 'REJECTED') {
        updateData.rejectionReason = rejectionReason;
      }

      const updated = await prisma.application.update({
        where: { id },
        data: updateData,
      });

      res.json(updated);
    } catch (error) {
      logger.error('Review application error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async runMeansTest(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const application = await prisma.application.findUnique({
        where: { id },
        include: { householdMembers: true },
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const meansTestResult = calculateMeansTest(application);

      const updated = await prisma.application.update({
        where: { id },
        data: {
          meansTestScore: meansTestResult.score,
          meansTestStatus: meansTestResult.status,
        },
      });

      res.json({
        application: updated,
        meansTest: meansTestResult,
      });
    } catch (error) {
      logger.error('Means test error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.application.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      logger.error('Delete application error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

