import { Student, Transaction, Payment, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

// Get all students with their billing aggregates
export const getStudents = async (req, res) => {
  const { search } = req.query;

  try {
    let whereClause = {};
    if (search) {
      whereClause = {
        [Op.or]: [
          { student_id: { [Op.like]: `%${search}%` } },
          { name: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const students = await Student.findAll({
      attributes: [
        'id',
        'student_id',
        'name',
        'email',
        'department',
        'batch',
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(quantity), 0)
            FROM Transactions AS t
            WHERE t.student_id = Student.student_id
          )`),
          'total_tea_bags'
        ],
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(total_amount), 0)
            FROM Transactions AS t
            WHERE t.student_id = Student.student_id
          )`),
          'total_cost'
        ],
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(amount), 0)
            FROM Payments AS p
            WHERE p.student_id = Student.student_id
          )`),
          'total_paid'
        ],
        [
          sequelize.literal(`(
            COALESCE((SELECT SUM(total_amount) FROM Transactions AS t WHERE t.student_id = Student.student_id), 0) -
            COALESCE((SELECT SUM(amount) FROM Payments AS p WHERE p.student_id = Student.student_id), 0)
          )`),
          'due_amount'
        ]
      ],
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, count: students.length, students });
  } catch (error) {
    console.error('Error getting students:', error);
    res.status(500).json({ success: false, message: 'Server error fetching students' });
  }
};

// Get a single student by Student ID (For student profile search)
export const getStudentByStudentId = async (req, res) => {
  const { student_id } = req.params;

  try {
    const student = await Student.findOne({
      where: { student_id }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found with the given Student ID' });
    }

    // Run aggregates
    const totalTeaBags = await Transaction.sum('quantity', { where: { student_id } }) || 0;
    const totalCost = await Transaction.sum('total_amount', { where: { student_id } }) || 0;
    const totalPaid = await Payment.sum('amount', { where: { student_id } }) || 0;
    const dueAmount = Number(totalCost) - Number(totalPaid);

    // Fetch transaction logs (distributions & payments)
    const distributions = await Transaction.findAll({
      where: { student_id },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'quantity', 'unit_price', 'total_amount', 'created_at']
    });

    const payments = await Payment.findAll({
      where: { student_id },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'amount', 'created_at']
    });

    // Merge history and sort by date
    const history = [
      ...distributions.map(d => ({
        id: `dist-${d.id}`,
        type: 'distribution',
        quantity: d.quantity,
        rate: d.unit_price,
        amount: d.total_amount,
        date: d.created_at
      })),
      ...payments.map(p => ({
        id: `pay-${p.id}`,
        type: 'payment',
        quantity: null,
        rate: null,
        amount: p.amount,
        date: p.created_at
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      student: {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        department: student.department,
        batch: student.batch,
        total_tea_bags: totalTeaBags,
        total_cost: totalCost,
        total_paid: totalPaid,
        due_amount: dueAmount
      },
      history
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ success: false, message: 'Server error fetching student details' });
  }
};

// Create a new student (Admin only)
export const createStudent = async (req, res) => {
  const { student_id, name, email, department, batch } = req.body;

  try {
    if (!student_id || !name || !email || !department || !batch) {
      return res.status(400).json({ success: false, message: 'Please provide all student fields' });
    }

    // Check if student_id already exists
    const studentExists = await Student.findOne({ where: { student_id } });
    if (studentExists) {
      return res.status(400).json({ success: false, message: 'Student ID already exists' });
    }

    const student = await Student.create({
      student_id,
      name,
      email,
      department,
      batch
    });

    res.status(201).json({ success: true, message: 'Student created successfully', student });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, message: 'Server error creating student' });
  }
};

// Update student profile (Admin only)
export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, email, department, batch } = req.body;

  try {
    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.name = name || student.name;
    student.email = email || student.email;
    student.department = department || student.department;
    student.batch = batch || student.batch;

    await student.save();

    res.json({ success: true, message: 'Student profile updated successfully', student });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Server error updating student' });
  }
};

// Delete student profile (Admin only)
export const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await student.destroy();

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Server error deleting student' });
  }
};
