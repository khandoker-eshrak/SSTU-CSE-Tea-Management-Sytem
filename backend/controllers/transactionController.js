import { Student, Transaction, Payment, Inventory, sequelize } from '../models/index.js';

// Record tea bag distribution (Admin only)
export const distributeTea = async (req, res) => {
  const { student_id, quantity, unit_price = 5.00 } = req.body;

  if (!student_id || !quantity) {
    return res.status(400).json({ success: false, message: 'Student ID and Quantity are required' });
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
  }

  const dbTransaction = await sequelize.transaction();

  try {
    // 1. Verify student exists
    const student = await Student.findOne({ where: { student_id }, transaction: dbTransaction });
    if (!student) {
      await dbTransaction.rollback();
      return res.status(404).json({ success: false, message: 'Student not found with this ID' });
    }

    // 2. Check inventory
    const latestStock = await Inventory.findOne({
      order: [['created_at', 'DESC']],
      transaction: dbTransaction
    });

    const currentStock = latestStock ? latestStock.stock_remaining : 0;
    if (currentStock < qty) {
      await dbTransaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient tea stock! Current remaining stock is ${currentStock} bags, but tried to distribute ${qty} bags.`
      });
    }

    // 3. Create tea transaction record (total_amount calculated in beforeValidate hook)
    const teaTransaction = await Transaction.create({
      student_id,
      quantity: qty,
      unit_price: parseFloat(unit_price)
    }, { transaction: dbTransaction });

    // 4. Update inventory
    await Inventory.create({
      stock_added: 0,
      stock_used: qty,
      stock_remaining: currentStock - qty
    }, { transaction: dbTransaction });

    await dbTransaction.commit();

    res.status(201).json({
      success: true,
      message: 'Tea distribution recorded successfully',
      transaction: teaTransaction
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error('Error recording tea distribution:', error);
    res.status(500).json({ success: false, message: 'Server error recording distribution' });
  }
};

// Record payment (Admin only)
export const recordPayment = async (req, res) => {
  const { student_id, amount } = req.body;

  if (!student_id || !amount) {
    return res.status(400).json({ success: false, message: 'Student ID and Amount are required' });
  }

  const payAmt = parseFloat(amount);
  if (isNaN(payAmt) || payAmt <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
  }

  try {
    // Verify student exists
    const student = await Student.findOne({ where: { student_id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found with this ID' });
    }

    // Create payment record
    const payment = await Payment.create({
      student_id,
      amount: payAmt
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, message: 'Server error recording payment' });
  }
};

// View combined transaction logs (Admin only)
export const getTransactionLogs = async (req, res) => {
  try {
    // Get all transactions
    const distributions = await Transaction.findAll({
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'department', 'batch']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Get all payments
    const payments = await Payment.findAll({
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'department', 'batch']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Merge logs
    const logs = [
      ...distributions.map(d => ({
        id: `dist-${d.id}`,
        type: 'distribution',
        student_id: d.student_id,
        student_name: d.student ? d.student.name : 'Unknown',
        department: d.student ? d.student.department : 'N/A',
        batch: d.student ? d.student.batch : 'N/A',
        quantity: d.quantity,
        rate: d.unit_price,
        amount: d.total_amount,
        date: d.created_at
      })),
      ...payments.map(p => ({
        id: `pay-${p.id}`,
        type: 'payment',
        student_id: p.student_id,
        student_name: p.student ? p.student.name : 'Unknown',
        department: p.student ? p.student.department : 'N/A',
        batch: p.student ? p.student.batch : 'N/A',
        quantity: null,
        rate: null,
        amount: p.amount,
        date: p.created_at
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    console.error('Error fetching transaction logs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching logs' });
  }
};
