// API Configuration
const envApiBase = import.meta.env.VITE_API_BASE_URL;
const isBrowser = typeof window !== 'undefined';
const STORAGE_KEY = 'current_user';

export const API_BASE_URL = envApiBase || (isBrowser && window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

// ==================== AUTH SIGNUP ====================
export const signupUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// ==================== AUTH LOGIN ====================
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const checkUserEmail = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Email validation failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async ({ email, newPassword }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Reset password failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// ==================== SAVE USER TO LOCAL STORAGE ====================
export const saveUserToStorage = (user) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

// ==================== GET USER FROM LOCAL STORAGE ====================
export const getUserFromStorage = () => {
  const user = localStorage.getItem(STORAGE_KEY);
  return user ? JSON.parse(user) : null;
};

// ==================== LOGOUT ====================
export const logout = () => {
  localStorage.removeItem(STORAGE_KEY);
};
