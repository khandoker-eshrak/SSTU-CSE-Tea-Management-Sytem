import express from 'express';
import { getInventory, addStock } from '../controllers/inventoryController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protectAdmin, getInventory);
router.post('/add', protectAdmin, addStock);

export default router;
