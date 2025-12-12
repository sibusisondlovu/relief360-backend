import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { logger } from '../utils/logger';

export const benefitController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { applicationId, status } = req.query;

      const where: any = {};
      if (applicationId) where.applicationId = applicationId as string;
      if (status) where.status = status;

      const benefits = await prisma.benefit.findMany({
        where,
        include: {
          application: {
            select: {
              id: true,
              applicationNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(benefits);
    } catch (error) {
      logger.error('Get benefits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const benefit = await prisma.benefit.findUnique({
        where: { id },
        include: {
          application: true,
        },
      });

      if (!benefit) {
        return res.status(404).json({ error: 'Benefit not found' });
      }

      res.json(benefit);
    } catch (error) {
      logger.error('Get benefit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const benefitData = req.body;

      // Verify application is approved
      const application = await prisma.application.findUnique({
        where: { id: benefitData.applicationId },
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (application.status !== 'APPROVED') {
        return res.status(400).json({ error: 'Application must be approved to assign benefits' });
      }

      const benefit = await prisma.benefit.create({
        data: {
          ...benefitData,
          startDate: new Date(benefitData.startDate),
          endDate: benefitData.endDate ? new Date(benefitData.endDate) : null,
        },
        include: {
          application: true,
        },
      });

      res.status(201).json(benefit);
    } catch (error) {
      logger.error('Create benefit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const benefit = await prisma.benefit.update({
        where: { id },
        data: {
          ...updateData,
          startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
          endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        },
      });

      res.json(benefit);
    } catch (error) {
      logger.error('Update benefit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.benefit.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      logger.error('Delete benefit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

