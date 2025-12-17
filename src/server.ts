import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { rateLimiter } from './middleware/rateLimiter';
import { auditLogger } from './middleware/auditLogger';

// Routes
import authRoutes from './routes/auth';
import applicationRoutes from './routes/applications';
import documentRoutes from './routes/documents';
import benefitRoutes from './routes/benefits';
import reportRoutes from './routes/reports';
import userRoutes from './routes/users';
import consentRoutes from './routes/consent';
import integrationRoutes from './routes/integrations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Health check (Moved to top for debugging)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Audit logging
app.use(auditLogger);



// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/benefits', benefitRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/integrations', integrationRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;

