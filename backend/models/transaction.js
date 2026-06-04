import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Transaction = sequelize.define('Transaction', {
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 5.00
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // only track created_at
  hooks: {
    beforeValidate: (transaction) => {
      if (transaction.quantity && transaction.unit_price) {
        transaction.total_amount = transaction.quantity * transaction.unit_price;
      }
    }
  }
});

export default Transaction;
