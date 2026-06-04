import express from 'express';
import {
  distributeTea,
  recordPayment,
  getTransactionLogs
} from '../controllers/transactionController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/distribute', protectAdmin, distributeTea);
router.post('/payment', protectAdmin, recordPayment);
router.get('/logs', protectAdmin, getTransactionLogs);

export default router;
