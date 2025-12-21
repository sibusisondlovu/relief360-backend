import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { getDb } from '../utils/mongo';
import { AuditLog } from '../models/types';
import { ObjectId } from 'mongodb';

export const auditLogger = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (process.env.AUDIT_LOG_ENABLED !== 'true') {
    return next();
  }

  const originalSend = res.send;


  res.send = function (body) {


    // Log asynchronously to avoid blocking response
    setImmediate(async () => {
      try {
        if (req.user && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          await getDb().collection<AuditLog>('audit_logs').insertOne({
            userId: new ObjectId(req.user.id),
            action: `${req.method} ${req.path}`,
            entityType: req.path.split('/')[2] || 'unknown',
            entityId: req.params.id || 'unknown',
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('user-agent'),
            changes: req.body ? JSON.parse(JSON.stringify(req.body)) : null,
            createdAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Audit logging error:', error);
      }
    });

    return originalSend.call(this, body);
  };

  next();
};

