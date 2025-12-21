import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDb } from '../utils/mongo';
import { logger } from '../utils/logger';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Application, Benefit } from '../models/types';


export const reportController = {
  async getDashboard(_req: AuthRequest, res: Response) {
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
        totalAmountResult,
      ] = await Promise.all([
        getDb().collection('applications').countDocuments(),
        getDb().collection('applications').countDocuments({ status: 'PENDING' }),
        getDb().collection('applications').countDocuments({ status: 'APPROVED' }),
        getDb().collection('applications').countDocuments({ status: 'REJECTED' }),
        getDb().collection('applications').countDocuments({
          applicationDate: {
            $gte: startOfCurrentMonth,
            $lte: endOfCurrentMonth,
          },
        }),
        getDb().collection('applications').countDocuments({
          applicationDate: {
            $gte: startOfLastMonth,
            $lte: endOfLastMonth,
          },
        }),
        getDb().collection('benefits').countDocuments(),
        getDb().collection('benefits').countDocuments({ status: 'ACTIVE' }),
        getDb().collection('benefits').aggregate([
          { $match: { status: 'ACTIVE' } },
          { $group: { _id: null, sum: { $sum: '$amount' } } }
        ]).toArray(),
      ]);

      const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].sum : 0;

      const applicationGrowth =
        lastMonthApplications > 0
          ? ((currentMonthApplications - lastMonthApplications) / lastMonthApplications) * 100
          : 0;

      return res.json({
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
          totalAmount: totalAmount || 0,
        },
      });
    } catch (error) {
      logger.error('Get dashboard error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getApplicationReport(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, status, municipality } = req.query;

      const where: any = {};

      if (startDate || endDate) {
        where.applicationDate = {};
        if (startDate) where.applicationDate.$gte = new Date(startDate as string);
        if (endDate) where.applicationDate.$lte = new Date(endDate as string);
      }

      if (status) where.status = status;
      if (municipality) where.municipality = municipality;

      const applications = await getDb().collection<Application>('applications').aggregate([
        { $match: where },
        { $sort: { applicationDate: -1 } },
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
        // Simplified structure for report
        {
          $project: {
            applicationNumber: 1,
            applicationDate: 1,
            status: 1,
            firstName: 1,
            lastName: 1,
            idNumber: 1,
            municipality: 1,
            ward: 1,
            createdBy: { firstName: 1, lastName: 1 },
            reviewedBy: { firstName: 1, lastName: 1 },
          }
        }
      ]).toArray();

      return res.json(applications);
    } catch (error) {
      logger.error('Get application report error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getBenefitReport(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, status, benefitType } = req.query;

      const where: any = {};

      if (startDate || endDate) {
        where.startDate = {};
        if (startDate) where.startDate.$gte = new Date(startDate as string);
        if (endDate) where.startDate.$lte = new Date(endDate as string);
      }

      if (status) where.status = status;
      if (benefitType) where.benefitType = benefitType;

      const benefits = await getDb().collection<Benefit>('benefits').aggregate([
        { $match: where },
        { $sort: { startDate: -1 } },
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
            benefitType: 1,
            amount: 1,
            status: 1,
            startDate: 1,
            endDate: 1,
            application: {
              applicationNumber: 1,
              firstName: 1,
              lastName: 1,
              idNumber: 1
            }
          }
        }
      ]).toArray();

      const totalAmount = benefits.reduce(
        (sum, benefit) => sum + Number(benefit.amount),
        0
      );

      return res.json({
        benefits,
        summary: {
          total: benefits.length,
          totalAmount,
        },
      });
    } catch (error) {
      logger.error('Get benefit report error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getStatistics(_req: AuthRequest, res: Response) {
    try {
      // Get status distribution
      const statusDistribution = await getDb().collection('applications').aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).toArray();

      // Get benefit type distribution
      const benefitTypeDistribution = await getDb().collection('benefits').aggregate([
        {
          $group: {
            _id: '$benefitType',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]).toArray();

      // Get monthly trends (MongoDB aggregation)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const monthlyTrends = await getDb().collection('applications').aggregate([
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
      ]).toArray();

      return res.json({
        statusDistribution: statusDistribution.reduce((acc: any, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        benefitTypeDistribution,
        monthlyTrends,
      });
    } catch (error) {
      logger.error('Get statistics error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async exportData(req: AuthRequest, res: Response) {
    try {
      const { type, format = 'json' } = req.query;

      if (type === 'applications') {
        const applications = await getDb().collection('applications').aggregate([
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
          }
        ]).toArray();

        // Transform IDs
        const transformedApplications = applications.map(app => ({
          ...app,
          id: app._id.toString(),
          _id: undefined,
          createdById: app.createdById?.toString(),
          reviewedById: app.reviewedById?.toString(),
          createdBy: app.createdBy ? { ...app.createdBy, _id: undefined, id: app.createdBy._id.toString() } : null,
          reviewedBy: app.reviewedBy ? { ...app.reviewedBy, _id: undefined, id: app.reviewedBy._id.toString() } : null,
        }));

        if (format === 'csv') {
          // Convert to CSV (simplified)
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
          // CSV conversion would go here
          return res.json(transformedApplications);
        } else {
          return res.json(transformedApplications);
        }
      } else {
        return res.status(400).json({ error: 'Invalid export type' });
      }
    } catch (error) {
      logger.error('Export data error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

