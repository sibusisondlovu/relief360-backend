import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController';
import { validate } from '../middleware/validator';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/login',
  authRateLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ]),
  authController.login
);

router.post(
  '/register',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('role').optional().isIn(['ADMIN', 'MANAGER', 'CLERK', 'REVIEWER', 'VIEWER']),
  ]),
  authController.register
);

router.post('/refresh', authController.refreshToken);

export default router;

