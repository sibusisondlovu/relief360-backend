import { Router } from 'express';
import { body } from 'express-validator';
import { consentController } from '../controllers/consentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();
router.use(authenticate);

router.get('/', consentController.getAll);
router.get('/:id', consentController.getById);
router.post(
  '/',
  validate([
    body('applicationId').optional().isUUID(),
    body('consentType').isIn(['DATA_PROCESSING', 'DATA_SHARING', 'MARKETING', 'RESEARCH']),
    body('granted').isBoolean(),
    body('purpose').notEmpty(),
    body('legalBasis').notEmpty(),
  ]),
  consentController.create
);
router.put('/:id/revoke', consentController.revoke);

export default router;

