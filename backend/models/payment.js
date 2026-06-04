import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'student_id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false // only track created_at
});

export default Payment;
