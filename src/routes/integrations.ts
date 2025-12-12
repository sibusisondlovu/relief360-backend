import { Router } from 'express';
import { integrationController } from '../controllers/integrationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.post('/verify-id', integrationController.verifyId);
router.post('/municipal-sync', integrationController.syncMunicipal);
router.get('/logs', integrationController.getLogs);

export default router;

