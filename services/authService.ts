// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

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

// ==================== SAVE USER TO LOCAL STORAGE ====================
export const saveUserToStorage = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// ==================== GET USER FROM LOCAL STORAGE ====================
export const getUserFromStorage = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// ==================== LOGOUT ====================
export const logout = () => {
  localStorage.removeItem('user');
};
