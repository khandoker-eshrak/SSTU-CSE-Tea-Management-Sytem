import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colors for terminal logs
const RESET = '\x1b[0m';
const BLUE = '\x1b[34m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';

function log(prefix, color, data) {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line) {
      console.log(`${color}${prefix}${RESET} ${line}`);
    }
  });
}

// Start backend
const backendPath = path.join(__dirname, 'backend');
console.log('Starting backend server in:', backendPath);
const backend = spawn('npm.cmd', ['run', 'dev'], { cwd: backendPath, shell: true });

backend.stdout.on('data', (data) => log('[Backend]', BLUE, data));
backend.stderr.on('data', (data) => log('[Backend-Err]', RED, data));
backend.on('close', (code) => console.log(`Backend process exited with code ${code}`));

// Start frontend
const frontendPath = path.join(__dirname, 'frontend');
console.log('Starting frontend server in:', frontendPath);
const frontend = spawn('npm.cmd', ['run', 'dev'], { cwd: frontendPath, shell: true });

frontend.stdout.on('data', (data) => log('[Frontend]', GREEN, data));
frontend.stderr.on('data', (data) => log('[Frontend-Err]', RED, data));
frontend.on('close', (code) => console.log(`Frontend process exited with code ${code}`));

// Handle Ctrl+C or process exit to kill children
process.on('SIGINT', () => {
  console.log('\nStopping development servers...');
  backend.kill();
  frontend.kill();
  process.exit();
});
