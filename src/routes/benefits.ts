import { Router } from 'express';
import { body } from 'express-validator';
import { benefitController } from '../controllers/benefitController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();
router.use(authenticate);

router.get('/', benefitController.getAll);
router.get('/:id', benefitController.getById);
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate([
    body('applicationId').notEmpty().isUUID(),
    body('benefitType').isIn(['WATER_REBATE', 'ELECTRICITY_REBATE', 'RATES_REBATE', 'WASTE_REMOVAL_REBATE', 'TRANSPORT_SUBSIDY', 'OTHER']),
    body('amount').isFloat({ min: 0 }),
    body('startDate').isISO8601(),
  ]),
  benefitController.create
);
router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  benefitController.update
);
router.delete(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  benefitController.delete
);

export default router;

