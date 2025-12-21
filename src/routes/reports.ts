import express from 'express';
import { reportController } from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/types';

const router = express.Router();
router.use(authenticate);

router.get('/dashboard', reportController.getDashboard);
router.get('/applications', reportController.getApplicationReport);
router.get('/benefits', reportController.getBenefitReport);
router.get('/statistics', reportController.getStatistics);
router.get('/export', authorize(UserRole.ADMIN, UserRole.MANAGER), reportController.exportData);

export default router;
