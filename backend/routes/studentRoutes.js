import express from 'express';
import {
  getStudents,
  getStudentByStudentId,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/studentController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for a student to lookup their own profile
router.get('/profile/:student_id', getStudentByStudentId);

// Protected admin routes for CRUD operations
router.get('/', protectAdmin, getStudents);
router.post('/', protectAdmin, createStudent);
router.put('/:id', protectAdmin, updateStudent);
router.delete('/:id', protectAdmin, deleteStudent);

export default router;
