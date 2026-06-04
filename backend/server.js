import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurations and database
import sequelize from './config/db.js';
import { Admin, Student, Transaction, Payment, Inventory } from './models/index.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';

// Utilities & Services
import { initScheduler, runMonthlyDuesEmailJob } from './utils/cron.js';
import { protectAdmin } from './middleware/authMiddleware.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

// Routes registration
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/inventory', inventoryRoutes);

// @desc    Get dashboard reports statistics
// @route   GET /api/dashboard/stats
// @access  Private (Admin Only)
app.get('/api/dashboard/stats', protectAdmin, async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalTeaDistributed = await Transaction.sum('quantity') || 0;
    const totalRevenue = await Transaction.sum('total_amount') || 0;
    const totalCollected = await Payment.sum('amount') || 0;
    const totalOutstandingDue = Number(totalRevenue) - Number(totalCollected);

    // Fetch all transactions and payments to construct database-dialect independent monthly stats (last 6 months)
    const distributions = await Transaction.findAll({
      attributes: ['total_amount', 'created_at']
    });

    const payments = await Payment.findAll({
      attributes: ['amount', 'created_at']
    });

    // In-memory monthly aggregation for database portability
    const monthlyData = {};

    // Get last 6 months list
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthYear = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyData[monthYear] = { month: monthYear, distributed: 0, collected: 0 };
    }

    distributions.forEach(d => {
      const date = new Date(d.created_at);
      const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyData[monthYear]) {
        monthlyData[monthYear].distributed += parseFloat(d.total_amount);
      }
    });

    payments.forEach(p => {
      const date = new Date(p.created_at);
      const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyData[monthYear]) {
        monthlyData[monthYear].collected += parseFloat(p.amount);
      }
    });

    const chartStats = Object.values(monthlyData);

    res.json({
      success: true,
      stats: {
        total_students: totalStudents,
        total_tea_distributed: totalTeaDistributed,
        total_revenue: totalRevenue,
        total_collected: totalCollected,
        total_outstanding_due: totalOutstandingDue
      },
      monthly_stats: chartStats
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving statistics' });
  }
});

// @desc    Trigger monthly email billing job manually for verification
// @route   POST /api/dashboard/test-emails
// @access  Private (Admin Only)
app.post('/api/dashboard/test-emails', protectAdmin, async (req, res) => {
  try {
    const result = await runMonthlyDuesEmailJob();
    res.json(result);
  } catch (error) {
    console.error('Error triggering manual email run:', error);
    res.status(500).json({ success: false, message: 'Server error running email job' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Database sync and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Authenticate and sync models
    await sequelize.authenticate();
    console.log('[Database] Connected successfully.');

    await sequelize.sync(); // Auto-creates tables if they do not exist
    console.log('[Database] Models synchronized.');

    // Seed default Admin if no admin exists
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      await Admin.create({
        name: 'Department Admin',
        email: 'admin@tea.edu',
        password: 'adminpassword123'
      });
      console.log('[Database Seed] Default Admin created (admin@tea.edu / adminpassword123)');
    }

    // Seed initial Inventory if empty
    const inventoryCount = await Inventory.count();
    if (inventoryCount === 0) {
      await Inventory.create({
        stock_added: 0,
        stock_used: 0,
        stock_remaining: 0
      });
      console.log('[Database Seed] Initial Tea Inventory of 0 bags added.');
    }

    // Start Cron scheduler
    initScheduler();

    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  } catch (error) {
    console.error('[Server] Critical Initialization Failure:', error);
    process.exit(1);
  }
};

startServer();
