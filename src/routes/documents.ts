import { Router } from 'express';
import { documentController } from '../controllers/documentController';
import { authenticate, authorize } from '../middleware/auth';
import { upload as uploadMiddleware } from '../middleware/upload';
import { UserRole } from '../models/types';

const router = Router();
router.use(authenticate);



router.get('/', documentController.getAll);
router.get('/:id', documentController.getById);
router.get('/:id/download', documentController.download);
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.CLERK),
  uploadMiddleware.single('file'),
  documentController.upload
);
router.put(
  '/:id/verify',
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.REVIEWER),
  documentController.verify
);
router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  documentController.delete
);

export default router;
