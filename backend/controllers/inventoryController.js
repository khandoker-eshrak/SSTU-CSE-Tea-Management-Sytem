import { Inventory } from '../models/index.js';

// Get current inventory status & logs (Admin only)
export const getInventory = async (req, res) => {
  try {
    // 1. Get latest stock remaining
    const latest = await Inventory.findOne({
      order: [['created_at', 'DESC']]
    });

    const currentStock = latest ? latest.stock_remaining : 0;
    const totalPurchased = await Inventory.sum('stock_added') || 0;
    const totalDistributed = await Inventory.sum('stock_used') || 0;

    // 2. Get history logs
    const logs = await Inventory.findAll({
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      current_stock: currentStock,
      total_purchased: totalPurchased,
      total_distributed: totalDistributed,
      logs
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, message: 'Server error fetching inventory' });
  }
};

// Add stock to inventory (Admin only)
export const addStock = async (req, res) => {
  const { quantity } = req.body;

  if (!quantity) {
    return res.status(400).json({ success: false, message: 'Quantity is required' });
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
  }

  try {
    // Get latest stock remaining to calculate new balance
    const latest = await Inventory.findOne({
      order: [['created_at', 'DESC']]
    });

    const currentStock = latest ? latest.stock_remaining : 0;
    const newStockRemaining = currentStock + qty;

    const record = await Inventory.create({
      stock_added: qty,
      stock_used: 0,
      stock_remaining: newStockRemaining
    });

    res.status(201).json({
      success: true,
      message: 'Tea stock added successfully',
      inventory: record
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({ success: false, message: 'Server error adding stock' });
  }
};
