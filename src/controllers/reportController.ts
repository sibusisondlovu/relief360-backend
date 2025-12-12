import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { logger } from '../utils/logger';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const reportController = {
  async getDashboard(req: AuthRequest, res: Response) {
    try {
      const now = new Date();
      const startOfCurrentMonth = startOfMonth(now);
      const endOfCurrentMonth = endOfMonth(now);
      const startOfLastMonth = startOfMonth(subMonths(now, 1));
      const endOfLastMonth = endOfMonth(subMonths(now, 1));

      const [
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        currentMonthApplications,
        lastMonthApplications,
        totalBenefits,
        activeBenefits,
        totalAmount,
      ] = await Promise.all([
        prisma.application.count(),
        prisma.application.count({ where: { status: 'PENDING' } }),
        prisma.application.count({ where: { status: 'APPROVED' } }),
        prisma.application.count({ where: { status: 'REJECTED' } }),
        prisma.application.count({
          where: {
            applicationDate: {
              gte: startOfCurrentMonth,
              lte: endOfCurrentMonth,
            },
          },
        }),
        prisma.application.count({
          where: {
            applicationDate: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
        }),
        prisma.benefit.count(),
        prisma.benefit.count({ where: { status: 'ACTIVE' } }),
        prisma.benefit.aggregate({
          where: { status: 'ACTIVE' },
          _sum: { amount: true },
        }),
      ]);

      const applicationGrowth =
        lastMonthApplications > 0
          ? ((currentMonthApplications - lastMonthApplications) / lastMonthApplications) * 100
          : 0;

      res.json({
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications,
          currentMonth: currentMonthApplications,
          lastMonth: lastMonthApplications,
          growth: applicationGrowth,
        },
        benefits: {
          total: totalBenefits,
          active: activeBenefits,
          totalAmount: totalAmount._sum.amount || 0,
        },
      });
    } catch (error) {
      logger.error('Get dashboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getApplicationReport(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, status, municipality } = req.query;

      const where: any = {};

      if (startDate || endDate) {
        where.applicationDate = {};
        if (startDate) where.applicationDate.gte = new Date(startDate as string);
        if (endDate) where.applicationDate.lte = new Date(endDate as string);
      }

      if (status) where.status = status;
      if (municipality) where.municipality = municipality;

      const applications = await prisma.application.findMany({
        where,
        include: {
          createdBy: {
            select: { firstName: true, lastName: true },
          },
          reviewedBy: {
            select: { firstName: true, lastName: true },
          },
          _count: {
            select: { documents: true, benefits: true },
          },
        },
        orderBy: { applicationDate: 'desc' },
      });

      res.json(applications);
    } catch (error) {
      logger.error('Get application report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getBenefitReport(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, status, benefitType } = req.query;

      const where: any = {};

      if (startDate || endDate) {
        where.startDate = {};
        if (startDate) where.startDate.gte = new Date(startDate as string);
        if (endDate) where.startDate.lte = new Date(endDate as string);
      }

      if (status) where.status = status;
      if (benefitType) where.benefitType = benefitType;

      const benefits = await prisma.benefit.findMany({
        where,
        include: {
          application: {
            select: {
              applicationNumber: true,
              firstName: true,
              lastName: true,
              idNumber: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
      });

      const totalAmount = benefits.reduce(
        (sum, benefit) => sum + Number(benefit.amount),
        0
      );

      res.json({
        benefits,
        summary: {
          total: benefits.length,
          totalAmount,
        },
      });
    } catch (error) {
      logger.error('Get benefit report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getStatistics(req: AuthRequest, res: Response) {
    try {
      const { period = 'month' } = req.query;

      // Get status distribution
      const statusDistribution = await prisma.application.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      // Get benefit type distribution
      const benefitTypeDistribution = await prisma.benefit.groupBy({
        by: ['benefitType'],
        _count: { id: true },
        _sum: { amount: true },
      });

      // Get monthly trends (MongoDB aggregation)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const monthlyTrends = await prisma.application.aggregateRaw({
        pipeline: [
          {
            $match: {
              applicationDate: {
                $gte: twelveMonthsAgo,
              },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$applicationDate' },
                month: { $month: '$applicationDate' },
              },
              count: { $sum: 1 },
            },
          },
          {
            $sort: {
              '_id.year': 1,
              '_id.month': 1,
            },
          },
          {
            $project: {
              _id: 0,
              month: {
                $dateToString: {
                  format: '%Y-%m',
                  date: {
                    $dateFromParts: {
                      year: '$_id.year',
                      month: '$_id.month',
                      day: 1,
                    },
                  },
                },
              },
              count: 1,
            },
          },
        ],
      });

      const trends = (monthlyTrends as any[]).map((item: any) => ({
        month: item.month,
        count: item.count,
      }));

      res.json({
        statusDistribution,
        benefitTypeDistribution,
        monthlyTrends: trends,
      });
    } catch (error) {
      logger.error('Get statistics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async exportData(req: AuthRequest, res: Response) {
    try {
      const { type, format = 'json' } = req.query;

      if (type === 'applications') {
        const applications = await prisma.application.findMany({
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
            reviewedBy: { select: { firstName: true, lastName: true } },
            documents: true,
            benefits: true,
            householdMembers: true,
          },
        });

        if (format === 'csv') {
          // Convert to CSV (simplified)
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
          // CSV conversion would go here
          res.json(applications);
        } else {
          res.json(applications);
        }
      } else {
        res.status(400).json({ error: 'Invalid export type' });
      }
    } catch (error) {
      logger.error('Export data error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

