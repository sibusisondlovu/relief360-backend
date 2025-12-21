import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDb } from '../utils/mongo';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';
import { Document } from '../models/types';
import { ObjectId } from 'mongodb';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

export const documentController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const { applicationId, documentType } = req.query;

      const where: any = {};
      if (applicationId) where.applicationId = new ObjectId(applicationId as string);
      if (documentType) where.documentType = documentType;

      const documents = await getDb().collection<Document>('documents').find(where, {
        sort: { createdAt: -1 }
      }).toArray();

      // Transform _id to id
      const transformedDocuments = documents.map(doc => ({
        ...doc,
        id: doc._id?.toString(),
        _id: undefined,
        applicationId: doc.applicationId.toString()
      }));

      return res.json(transformedDocuments);
    } catch (error) {
      logger.error('Get documents error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const document = await getDb().collection<Document>('documents').findOne({ _id: new ObjectId(id) });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      return res.json({
        ...document,
        id: document._id?.toString(),
        _id: undefined,
        applicationId: document.applicationId.toString()
      });
    } catch (error) {
      logger.error('Get document error:', error);
      return res.status(500).json({ error: 'Internal server error' });
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

      const newDocument: Document = {
        applicationId: new ObjectId(applicationId),
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.path,
        documentType,
        uploadedBy: req.user!.id,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await getDb().collection<Document>('documents').insertOne(newDocument);
      newDocument._id = result.insertedId;

      return res.status(201).json({
        ...newDocument,
        id: newDocument._id?.toString(),
        _id: undefined,
        applicationId: newDocument.applicationId.toString()
      });
    } catch (error) {
      logger.error('Upload document error:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async download(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const document = await getDb().collection<Document>('documents').findOne({ _id: new ObjectId(id) });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const filePath = path.join(uploadDir, document.fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }

      return res.download(filePath, document.originalName);
    } catch (error) {
      logger.error('Download document error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async verify(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { verified } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const result = await getDb().collection<Document>('documents').findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            verified: verified === true,
            verifiedAt: verified === true ? new Date() : null,
            verifiedBy: verified === true ? req.user!.id : null,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json({ error: 'Document not found' });
      }

      return res.json({
        ...result,
        id: result._id?.toString(),
        _id: undefined,
        applicationId: result.applicationId.toString()
      });
    } catch (error) {
      logger.error('Verify document error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const document = await getDb().collection<Document>('documents').findOne({ _id: new ObjectId(id) });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete file from disk
      const filePath = path.join(uploadDir, document.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await getDb().collection<Document>('documents').deleteOne({ _id: new ObjectId(id) });

      return res.status(204).send();
    } catch (error) {
      logger.error('Delete document error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

