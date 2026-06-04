import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  stock_added: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  stock_used: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  stock_remaining: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false // only track created_at
});

export default Inventory;
