## Backend Authentication Structure

```
backend/
├── config/
│   └── db.js                    # MySQL connection
├── controllers/
│   └── authController.js        # Signup & Login logic
├── routes/
│   └── authRoutes.js            # Auth routes
├── server.js                    # Main server (updated)
├── package.json                 # Dependencies (updated with bcryptjs)
├── .env
├── .gitignore
└── schema.sql
```

---

## Quick Reference: authController.js

```javascript
// SIGNUP HANDLER
exports.signup = async (req, res) => {
  // 1. Validate input (name, email, password, confirmPassword)
  // 2. Check if email already exists
  // 3. Hash password using bcrypt.hash(password, 10)
  // 4. Insert user into MySQL users table
  // 5. Return { message, userId, email }
};

// LOGIN HANDLER
exports.login = async (req, res) => {
  // 1. Validate input (email, password)
  // 2. Query database for user by email
  // 3. Compare password using bcrypt.compare()
  // 4. Return user data (without password)
};
```

---

## Quick Reference: authRoutes.js

```javascript
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

module.exports = router;
```

---

## Frontend Service: authService.ts

```typescript
const API_BASE_URL = 'http://localhost:5000/api';

// SIGNUP
export const signupUser = async (userData) => {
  return fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  }).then(res => res.json());
};

// LOGIN
export const loginUser = async (credentials) => {
  return fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  }).then(res => res.json());
};

// STORAGE
export const saveUserToStorage = (user) => 
  localStorage.setItem('user', JSON.stringify(user));

export const getUserFromStorage = () => 
  JSON.parse(localStorage.getItem('user') || 'null');

export const logout = () => 
  localStorage.removeItem('user');
```

---

## Implementation Steps

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```

### 2. Database Setup
```bash
mysql -u root -p < schema.sql
```

### 3. Update Login.tsx
```tsx
import { loginUser, saveUserToStorage } from '../../services/authService';

// In handleSubmit:
const response = await loginUser({ email, password });
saveUserToStorage(response.user);
onLogin(response.user);
```

### 4. Update Signup.tsx
```tsx
import { signupUser } from '../../services/authService';

// In handleSignup:
const response = await signupUser({ name, email, password, confirmPassword });
onSwitchToLogin();
```

---

## API Test Examples

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "pass123",
    "confirmPassword": "pass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "pass123"
  }'
```

---

## Key Technologies

- **Express**: Web framework
- **bcryptjs**: Password hashing
- **MySQL**: Database
- **CORS**: Cross-origin requests
- **Fetch API**: Frontend HTTP calls

