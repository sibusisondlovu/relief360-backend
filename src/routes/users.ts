import express from 'express';
import { userController } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/types';

const router = express.Router();
router.use(authenticate);

router.get('/', authorize(UserRole.ADMIN, UserRole.MANAGER), userController.getAll);
router.get('/:id', userController.getById);
router.post('/',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  userController.create
);
router.put('/:id', userController.update);
router.post('/:id/change-password', userController.changePassword);
router.put('/:id/toggle-status', userController.toggleStatus);
router.delete('/:id', authorize(UserRole.ADMIN), userController.delete);

export default router;
