const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = (isAuthRequired = true) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (isAuthRequired) {
    const token = localStorage.getItem('tea_admin_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const api = {
  // Authentication
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.success && data.token) {
      localStorage.setItem('tea_admin_token', data.token);
    }
    return data;
  },
  
  logout: () => {
    localStorage.removeItem('tea_admin_token');
  },
  
  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    return handleResponse(res);
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('tea_admin_token');
  },
  
  // Student Public
  getStudentProfile: async (student_id) => {
    const res = await fetch(`${API_BASE}/students/profile/${student_id}`, {
      method: 'GET',
      headers: getHeaders(false)
    });
    return handleResponse(res);
  },
  
  // Student Admin CRUD
  getStudents: async (search = '') => {
    const res = await fetch(`${API_BASE}/students?search=${encodeURIComponent(search)}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    return handleResponse(res);
  },
  
  createStudent: async (studentData) => {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(studentData)
    });
    return handleResponse(res);
  },
  
  updateStudent: async (id, studentData) => {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(studentData)
    });
    return handleResponse(res);
  },
  
  deleteStudent: async (id) => {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    return handleResponse(res);
  },
  
  // Tea Distributions & Payments
  distributeTea: async (student_id, quantity, unit_price = 5.00) => {
    const res = await fetch(`${API_BASE}/transactions/distribute`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ student_id, quantity, unit_price })
    });
    return handleResponse(res);
  },
  
  recordPayment: async (student_id, amount) => {
    const res = await fetch(`${API_BASE}/transactions/payment`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ student_id, amount })
    });
    return handleResponse(res);
  },
  
  getTransactionLogs: async () => {
    const res = await fetch(`${API_BASE}/transactions/logs`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    return handleResponse(res);
  },
  
  // Inventory
  getInventory: async () => {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    return handleResponse(res);
  },
  
  addStock: async (quantity) => {
    const res = await fetch(`${API_BASE}/inventory/add`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ quantity })
    });
    return handleResponse(res);
  },
  
  // Dashboard Metrics & Manual Cron Execution
  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    return handleResponse(res);
  },
  
  triggerTestEmails: async () => {
    const res = await fetch(`${API_BASE}/dashboard/test-emails`, {
      method: 'POST',
      headers: getHeaders(true)
    });
    return handleResponse(res);
  }
};
