# 🔑 Admin Login Credentials

All admin accounts are registered and ready to use!

## Admin Accounts

| Email | Password | Role |
|-------|----------|------|
| rahul@gmail.com | 12345678 | ADMIN |
| admin@arti.com | admin123456 | ADMIN |
| manager@arti.com | manager1234 | ADMIN |
| site@arti.com | site12345678 | ADMIN |
| super@arti.com | super123456 | ADMIN |

## How to Login

1. Open http://localhost:3000
2. See "Worker Portal" button (Admin section removed from UI)
3. Click "Worker Portal"
4. Enter any admin email + password from the table above
5. **Admin Dashboard loads automatically!**

## Backend API

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@arti.com",
  "password": "admin123456"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 8,
    "name": "Admin One",
    "email": "admin@arti.com",
    "role": "ADMIN"
  }
}
```

## Frontend Features

✓ Only "Worker Portal" button visible (Admin button removed)
✓ Both workers and admins login through same page
✓ Backend auto-detects role and routes correctly:
  - **ADMIN** → Admin Dashboard (members, attendance, salary, inventory, projects)
  - **MEMBER** → Worker Dashboard

## Key Points

- ✅ All admin emails pre-registered in database
- ✅ Frontend shows only worker portal
- ✅ Admin login works via backend credentials
- ✅ No signup needed for admins - all auto-registered
- ✅ Role-based routing on frontend

**Status: Ready to Use!** 🚀
