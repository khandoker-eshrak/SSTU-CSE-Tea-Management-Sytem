import cron from 'node-cron';
import { Student, sequelize } from '../models/index.js';
import { sendDueReminder } from '../services/emailService.js';

/**
 * Finds all students with due amount > 0 and sends due reminder emails.
 * @returns {Promise<Object>} Summary of results
 */
export const runMonthlyDuesEmailJob = async () => {
  console.log('[Cron Job] Starting monthly dues calculation and email notifications...');
  
  try {
    // Find all students with their outstanding due balances calculated via subqueries
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
            COALESCE((SELECT SUM(total_amount) FROM "Transactions" AS t WHERE t.student_id = "Student"."student_id"), 0) -
            COALESCE((SELECT SUM(amount) FROM "Payments" AS p WHERE p.student_id = "Student"."student_id"), 0)
          )`),
          'due_amount'
        ]
      ]
    });

    // Filter students who have outstanding due balances
    const studentsWithDues = students.filter(student => {
      const due = parseFloat(student.getDataValue('due_amount') || 0);
      return due > 0;
    });

    console.log(`[Cron Job] Found ${studentsWithDues.length} students with outstanding dues.`);

    const results = [];
    for (const student of studentsWithDues) {
      const studentData = {
        name: student.name,
        student_id: student.student_id,
        email: student.email,
        department: student.department,
        batch: student.batch,
        due_amount: student.getDataValue('due_amount')
      };
      
      const emailResult = await sendDueReminder(studentData);
      results.push({
        student_id: student.student_id,
        email: student.email,
        due: studentData.due_amount,
        ...emailResult
      });
    }

    console.log(`[Cron Job] Finished sending reminders. Sent: ${results.length}`);
    return {
      success: true,
      processed_count: students.length,
      sent_count: results.length,
      details: results
    };
  } catch (error) {
    console.error('[Cron Job] Error during monthly dues email reminders:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Setup cron schedule to run at 00:00 (midnight) on the 1st day of every month
export const initScheduler = () => {
  // '0 0 1 * *' represents: Minute=0, Hour=0, DayOfMonth=1, Month=*, DayOfWeek=*
  cron.schedule('0 0 1 * *', async () => {
    console.log('[Cron Job] Scheduled monthly dues cron triggered.');
    await runMonthlyDuesEmailJob();
  });
  console.log('[Cron Job] Monthly dues email notification scheduler initialized.');
};
