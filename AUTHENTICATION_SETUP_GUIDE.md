# Authentication Setup Guide

## Backend Authentication Implementation

### Files Created

#### 1. **controllers/authController.js**
Handles signup and login logic:

```javascript
// POST /api/auth/signup
- Validates input (name, email, password)
- Checks for duplicate email
- Hashes password using bcryptjs
- Stores user in MySQL database
- Returns user ID and email on success

// POST /api/auth/login
- Validates email and password
- Queries database for user
- Compares password hash with bcryptjs
- Returns user data (without password) on success
```

#### 2. **routes/authRoutes.js**
Express routes:

```javascript
POST /api/auth/signup  →  authController.signup
POST /api/auth/login   →  authController.login
```

### Backend Setup

#### Step 1: Install bcryptjs
```bash
cd backend
npm install bcryptjs
```

#### Step 2: Update package.json
Added dependency:
```json
"bcryptjs": "^2.4.3"
```

#### Step 3: Update server.js
Added route:
```javascript
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
```

---

## Frontend Integration

### Service File: authService.ts

Located at: `services/authService.ts`

#### Available Functions

```typescript
// Sign up new user
signupUser(userData) → Promise
  Input: { name, email, password, confirmPassword }
  Output: { message, userId, email }

// Login existing user
loginUser(credentials) → Promise
  Input: { email, password }
  Output: { message, user: { id, name, email } }

// Save user to localStorage
saveUserToStorage(user) → void

// Get user from localStorage
getUserFromStorage() → user | null

// Logout
logout() → void
```

### Example: Updating Login Component

```tsx
import { loginUser, saveUserToStorage } from '../../services/authService';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    const response = await loginUser({
      email: formData.email,
      password: formData.password,
    });

    saveUserToStorage(response.user);
    onLogin(response.user);
    setFormData({ email: '', password: '' });
  } catch (err: any) {
    setError(err.message || 'Login failed');
  } finally {
    setIsLoading(false);
  }
};
```

### Example: Updating Signup Component

```tsx
import { signupUser } from '../../services/authService';

const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setGeneralError('');

  try {
    if (formData.password !== formData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const response = await signupUser({
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    alert('Registration successful!');
    onSwitchToLogin();
  } catch (err: any) {
    setGeneralError(err.message || 'Signup failed');
  } finally {
    setIsLoading(false);
  }
};
```

---

## API Endpoints

### POST /api/auth/signup

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "userId": 1,
  "email": "john@example.com"
}
```

**Error Response (400):**
```json
{
  "error": "Email already registered"
}
```

### POST /api/auth/login

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid email or password"
}
```

---

## Security Features

✅ **Password Hashing**: Using bcryptjs with salt rounds = 10
✅ **Database Validation**: Checks for duplicate emails
✅ **Input Validation**: Email format and password requirements
✅ **CORS Enabled**: Allows frontend to communicate with backend
✅ **No Password Storage**: Password never returned in API response

---

## Testing Authentication

### Using Postman/Thunder Client

1. **Signup:**
   ```
   POST http://localhost:5000/api/auth/signup
   Content-Type: application/json
   
   {
     "name": "Test User",
     "email": "test@example.com",
     "password": "password123",
     "confirmPassword": "password123"
   }
   ```

2. **Login:**
   ```
   POST http://localhost:5000/api/auth/login
   Content-Type: application/json
   
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

---

## Database Schema

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Frontend Implementation Checklist

- [ ] Copy authService.ts to services folder
- [ ] Add imports to Login.tsx:
  ```tsx
  import { loginUser, saveUserToStorage } from '../../services/authService';
  ```
- [ ] Replace handleSubmit in Login.tsx
- [ ] Add imports to Signup.tsx:
  ```tsx
  import { signupUser } from '../../services/authService';
  ```
- [ ] Replace handleSignup in Signup.tsx
- [ ] Test signup and login with backend
- [ ] Verify user data saves to localStorage
- [ ] Test API calls with Network tab in DevTools

---

## Backend Implementation Checklist

- [ ] Run `npm install` in backend folder
- [ ] Create database: `mysql -u root -p < schema.sql`
- [ ] Start backend: `npm start`
- [ ] Test endpoints with Postman
- [ ] Verify password hashing in database
- [ ] Check CORS is enabled

---

## Troubleshooting

**Issue: "CORS error"**
- Ensure CORS middleware is in server.js
- Check frontend URL matches CORS settings

**Issue: "Database connection failed"**
- Verify MySQL is running
- Check database credentials in config/db.js
- Run schema.sql to create database and table

**Issue: "Email already registered"**
- Check if email exists in database
- Use a different email for signup

**Issue: "Invalid email or password"**
- Verify credentials are correct
- Check user exists in database
- Ensure password was hashed correctly

---

## Next Steps

1. ✅ Backend auth routes created
2. ✅ Frontend API service created
3. Next: Update Login and Signup components to use API
4. Next: Add JWT tokens for persistent authentication
5. Next: Add logout functionality
6. Next: Protect routes with auth middleware

