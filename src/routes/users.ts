import { Router } from 'express';
import { body } from 'express-validator';
import { userController } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), userController.getAll);
router.get('/:id', userController.getById);
router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate([
    body('firstName').optional().notEmpty(),
    body('lastName').optional().notEmpty(),
    body('role').optional().isIn(['ADMIN', 'MANAGER', 'CLERK', 'REVIEWER', 'VIEWER']),
    body('isActive').optional().isBoolean(),
  ]),
  userController.update
);
router.delete('/:id', authorize('ADMIN'), userController.delete);

export default router;

