import { Router } from 'express';
import { body, query } from 'express-validator';
import { applicationController } from '../controllers/applicationController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { UserRole } from '../models/types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all applications with filters
router.get(
  '/',
  validate([
    query('status').optional().isIn(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'SUSPENDED']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  applicationController.getAll
);

// Get application by ID
router.get('/:id', applicationController.getById);

// Create new application
router.post(
  '/',
  validate([
    body('idNumber').notEmpty().isLength({ min: 13, max: 13 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('dateOfBirth').isISO8601(),
    body('gender').isIn(['MALE', 'FEMALE', 'OTHER']),
    body('contactNumber').notEmpty(),
    body('address').notEmpty(),
    body('municipality').notEmpty(),
    body('householdSize').isInt({ min: 1 }),
    body('monthlyIncome').isFloat({ min: 0 }),
    body('monthlyExpenses').isFloat({ min: 0 }),
  ]),
  applicationController.create
);

// Update application
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.CLERK),
  applicationController.update
);

// Submit for review
router.post(
  '/:id/submit',
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.CLERK),
  applicationController.submitForReview
);

// Review application
router.post(
  '/:id/review',
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.REVIEWER),
  validate([
    body('status').isIn(['APPROVED', 'REJECTED']),
    body('notes').optional(),
  ]),
  applicationController.review
);

// Run means test
router.post(
  '/:id/means-test',
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.REVIEWER),
  applicationController.runMeansTest
);

// Delete application (soft delete)
router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  applicationController.delete
);

export default router;

