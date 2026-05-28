# Admin Setup - Complete ✓

## Admin Credentials

Auto-registered admin account ready to use:

```
Email:    rahul@gmail.com
Password: 12345678
```

## How It Works

1. **Frontend**: Only shows "Worker Portal" button
2. **Login Flow**: Both worker and admin login through the same login page
3. **Backend**: Automatically detects admin role and serves admin dashboard
4. **Database**: Admin credentials are stored and authenticated via backend API

## Login Instructions

1. Go to http://localhost:3000
2. Click "Worker Portal" button
3. Login with admin credentials:
   - Email: `rahul@gmail.com`
   - Password: `12345678`
4. Admin Dashboard will load automatically (auto-detected from role)

## Backend API

**Login Endpoint:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "rahul@gmail.com",
  "password": "12345678"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 7,
    "name": "Rahul Admin",
    "email": "rahul@gmail.com",
    "role": "ADMIN"
  }
}
```

## Database

- **Host**: MySQL on localhost
- **User**: Auto-registered in `users` table
- **Role**: ADMIN (auto-assigned)
- **Table**: `arti_db.users`

## Features Enabled

✓ Admin dashboard access
✓ Member management
✓ Attendance control
✓ Salary management (admins only)
✓ Inventory management
✓ Project management
✓ Full worker management capabilities

No admin signup page needed - everything is handled via backend.
