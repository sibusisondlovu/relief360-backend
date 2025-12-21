import express from 'express';
import { benefitController } from '../controllers/benefitController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/types';

const router = express.Router();
router.use(authenticate);

router.get('/', benefitController.getAll);
router.get('/:id', benefitController.getById);
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  benefitController.create
);
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  benefitController.update
);
router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  benefitController.delete
);

export default router;

