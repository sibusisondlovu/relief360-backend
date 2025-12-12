import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

export const documentController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { applicationId, documentType } = req.query;

      const where: any = {};
      if (applicationId) where.applicationId = applicationId as string;
      if (documentType) where.documentType = documentType;

      const documents = await prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      res.json(documents);
    } catch (error) {
      logger.error('Get documents error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const document = await prisma.document.findUnique({
        where: { id },
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      logger.error('Get document error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async upload(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { applicationId, documentType } = req.body;

      if (!applicationId || !documentType) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'applicationId and documentType required' });
      }

      const document = await prisma.document.create({
        data: {
          applicationId,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          filePath: req.file.path,
          documentType,
          uploadedBy: req.user!.id,
        },
      });

      res.status(201).json(document);
    } catch (error) {
      logger.error('Upload document error:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async download(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const document = await prisma.document.findUnique({
        where: { id },
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const filePath = path.join(uploadDir, document.fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }

      res.download(filePath, document.originalName);
    } catch (error) {
      logger.error('Download document error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async verify(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { verified } = req.body;

      const document = await prisma.document.update({
        where: { id },
        data: {
          verified: verified === true,
          verifiedAt: verified === true ? new Date() : null,
          verifiedBy: verified === true ? req.user!.id : null,
        },
      });

      res.json(document);
    } catch (error) {
      logger.error('Verify document error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const document = await prisma.document.findUnique({
        where: { id },
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete file from disk
      const filePath = path.join(uploadDir, document.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await prisma.document.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      logger.error('Delete document error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

