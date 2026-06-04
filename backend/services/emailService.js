import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create log directory for emails if SMTP is not configured
const emailLogsDir = path.join(__dirname, '../logs/emails');
if (!fs.existsSync(emailLogsDir)) {
  fs.mkdirSync(emailLogsDir, { recursive: true });
}

// Check if SMTP is configured
const isSmtpConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

// Create nodemailer transporter if configured
const getTransporter = () => {
  if (isSmtpConfigured()) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
};

/**
 * Sends a tea bill due reminder to a student.
 * Falls back to logging to filesystem if SMTP is not configured.
 * @param {Object} student - Student database object with name, email, student_id, and due_amount
 */
export const sendDueReminder = async (student) => {
  const subject = 'Tea Bill Due Reminder';
  
  // Format the body exactly as requested
  const body = `Dear Student,

You currently have an outstanding tea bill.

Please clear your dues as soon as possible.

Thank you.

------------------------------------------------
Billing Details for ${student.name} (${student.student_id}):
Current Outstanding Due: ${parseFloat(student.due_amount).toFixed(2)} BDT
Email: ${student.email}
Department: ${student.department}
Batch: ${student.batch}
Date: ${new Date().toLocaleString()}
------------------------------------------------`;

  const transporter = getTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Tea Management System" <tea-billing@university.edu>',
        to: student.email,
        subject: subject,
        text: body
      });
      console.log(`[Email Service] Sent email to ${student.email}: ${info.messageId}`);
      return { success: true, method: 'smtp', messageId: info.messageId };
    } catch (error) {
      console.error(`[Email Service] Failed to send email to ${student.email}:`, error);
      // Fallback to file logging if SMTP fails
      return logEmailToFile(student, subject, body, true);
    }
  } else {
    // If SMTP is not configured, write to file log
    return logEmailToFile(student, subject, body, false);
  }
};

// Helper to log emails to local text files for development verification
const logEmailToFile = (student, subject, body, wasSmtpFailure) => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `${student.student_id}_${timestamp}.txt`;
  const filePath = path.join(emailLogsDir, filename);

  const logContent = `WAS_SMTP_FAILURE: ${wasSmtpFailure}\nTO: ${student.email}\nSUBJECT: ${subject}\n\n${body}`;

  fs.writeFileSync(filePath, logContent, 'utf-8');
  console.log(`[Email Service] ${wasSmtpFailure ? 'SMTP Failed' : 'SMTP Unconfigured'}. Logged email for ${student.email} to: ${filePath}`);
  return { success: true, method: 'file', path: filePath };
};
