import sequelize from '../config/db.js';
import Admin from './admin.js';
import Student from './student.js';
import Transaction from './transaction.js';
import Payment from './payment.js';
import Inventory from './inventory.js';

// Setup relationships using student_id
Student.hasMany(Transaction, {
  foreignKey: 'student_id',
  sourceKey: 'student_id',
  as: 'transactions',
  onDelete: 'CASCADE'
});

Transaction.belongsTo(Student, {
  foreignKey: 'student_id',
  targetKey: 'student_id',
  as: 'student'
});

Student.hasMany(Payment, {
  foreignKey: 'student_id',
  sourceKey: 'student_id',
  as: 'payments',
  onDelete: 'CASCADE'
});

Payment.belongsTo(Student, {
  foreignKey: 'student_id',
  targetKey: 'student_id',
  as: 'student'
});

export {
  sequelize,
  Admin,
  Student,
  Transaction,
  Payment,
  Inventory
};
