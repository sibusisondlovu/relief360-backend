import express from 'express';
import { integrationController } from '../controllers/integrationController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/types';

const router = express.Router();
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.MANAGER));

router.post('/verify-id', integrationController.verifyId);
router.post('/municipal-sync', integrationController.syncMunicipal);
router.get('/logs', integrationController.getLogs);

export default router;


