import { Router } from 'express';
import multer from 'multer';
import { documentController } from '../controllers/documentController';
import { authenticate, authorize } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

const router = Router();
router.use(authenticate);

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  },
});

router.get('/', documentController.getAll);
router.get('/:id', documentController.getById);
router.get('/:id/download', documentController.download);
router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'CLERK'),
  upload.single('file'),
  documentController.upload
);
router.put(
  '/:id/verify',
  authorize('ADMIN', 'MANAGER', 'REVIEWER'),
  documentController.verify
);
router.delete(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  documentController.delete
);

export default router;

