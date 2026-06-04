# Tea Management System ☕

A responsive full-stack Tea Management System designed for a university department to track tea bag distributions, student dues, payments, inventory stock, and generate monthly reports.

---

## Technical Stack
* **Backend REST API**: Node.js, Express, Sequelize ORM (supporting SQLite, MySQL, and PostgreSQL).
* **Frontend SPA**: React, Vite, Vanilla CSS variable styling (supporting dark mode, responsive layouts).
* **Database**: SQLite (default, zero-configuration local database) or PostgreSQL/MySQL.
* **Notifications**: Background scheduler (`node-cron`) + emailer (`nodemailer` with fallback to text log files).

---

## Credentials & Defaults
* **Default Admin Account**:
  * **Email**: `admin@tea.edu`
  * **Password**: `adminpassword123`
* **Default Inventory**: 100 tea bags seeded on startup.
* **Pricing**: 5 BDT per tea bag.

---

## Project Structure
```
d:\Tea Management
├── backend/                  # REST API Server
│   ├── config/db.js          # Database connector (Sequelize)
│   ├── controllers/          # Request handlers (auth, students, transactions, inventory)
│   ├── models/               # Relational schemas (Sequelize definitions)
│   ├── routes/               # Express endpoints router
│   ├── middleware/           # JWT security guards
│   ├── services/             # Email notification service
│   ├── utils/cron.js         # Month-end notification scheduler
│   ├── logs/emails/          # Mock folder logging emails in development
│   └── server.js             # API entrypoint, synchronization & seeding
├── frontend/                 # Client SPA Application
│   ├── src/
│   │   ├── pages/            # View components (Welcome, Student Profile, Admin panels)
│   │   ├── App.jsx           # Main routing & state
│   │   ├── api.js            # Axios-like API wrapper client
│   │   └── index.css         # Modern styling & theme tokens
│   └── index.html            # Web template mount
├── dev.js                    # Concurrent process manager
└── package.json              # Main runner config
```

---

## Local Development Startup

Since PowerShell script execution rules may block standard `.ps1` execution wrappers on some Windows environments, follow this script runner to launch the dev servers:

1. **Install Root and Child Dependencies**:
   ```powershell
   # Dependencies inside /backend and /frontend are already installed!
   # To verify or clean install:
   cd backend; npm.cmd install; cd ../frontend; npm.cmd install; cd ..
   ```

2. **Launch Both Development Servers Concurrently**:
   Run the following script from the root workspace directory (`d:\Tea Management`):
   ```powershell
   npm.cmd run dev
   ```
   * This spawns the backend server on **`http://localhost:5000`** and the Vite frontend server on **`http://localhost:5173`** concurrently.
   * Console outputs are prefixed with `[Backend]` and `[Frontend]`.

---

## REST Endpoints Overview

| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Authenticate admin, returns JWT | Public |
| **GET** | `/api/auth/me` | Retrieve current authenticated admin profile | Admin JWT |
| **GET** | `/api/students` | Get list of all students (supports query search) | Admin JWT |
| **GET** | `/api/students/profile/:student_id` | Public lookup of a student's billing dues | Public |
| **POST** | `/api/students` | Register a new student | Admin JWT |
| **PUT** | `/api/students/:id` | Update student profile details | Admin JWT |
| **DELETE** | `/api/students/:id` | Unregister a student (deletes dues) | Admin JWT |
| **POST** | `/api/transactions/distribute` | Record tea bags distribution (validates inventory) | Admin JWT |
| **POST** | `/api/transactions/payment` | Record a payment from a student | Admin JWT |
| **GET** | `/api/transactions/logs` | Retrieve combined ledger of transactions and payments | Admin JWT |
| **GET** | `/api/inventory` | View current remaining stock and stock cards | Admin JWT |
| **POST** | `/api/inventory/add` | Add stock (purchase) to the inventory | Admin JWT |
| **GET** | `/api/dashboard/stats` | Retrieve aggregate metrics and monthly stats chart details | Admin JWT |
| **POST** | `/api/dashboard/test-emails` | Trigger the billing email scheduler manually for audits | Admin JWT |
