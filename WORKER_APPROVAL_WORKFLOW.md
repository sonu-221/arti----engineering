# ✅ Worker Approval Workflow - ACTIVE

## How It Works

### 1. Worker Signup (Auto-Pending)
- Worker signs up with email and password
- **Status automatically set to: PENDING**
- Worker cannot access dashboard until admin approves

### 2. Worker Login (Shows Approval Page)
- Worker enters email + password
- Backend returns: `status: "PENDING"`
- Frontend shows **Approval Waiting Page**
- Worker sees message: "Awaiting Admin Approval"

### 3. Admin Approval
- Admin logs in with admin credentials
- Goes to "Members" section
- Finds pending worker
- Clicks "Approve" button
- Worker status changes to: **APPROVED**

### 4. Worker Gains Access
- Worker logs in again
- Status is now: **APPROVED**
- Worker Dashboard becomes accessible
- Full access to:
  - Attendance tracking
  - Salary slips
  - Project details
  - Account information

## Database Status Field

| Status | Meaning | Access |
|--------|---------|--------|
| PENDING | Awaiting admin approval | ❌ No access (approval page shown) |
| APPROVED | Admin approved | ✅ Full access |
| REJECTED | Admin rejected | ❌ No access |
| BLOCKED | Admin blocked | ❌ No access |

## Backend Response

**Before Approval:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 15,
    "name": "Test Worker",
    "email": "worker@test.com",
    "role": "MEMBER",
    "status": "PENDING"
  }
}
```

**After Admin Approval:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 15,
    "name": "Test Worker",
    "email": "worker@test.com",
    "role": "MEMBER",
    "status": "APPROVED"
  }
}
```

## Admin Accounts (Auto-Approved)

All admin accounts are automatically set to APPROVED:
- rahul@gmail.com
- admin@arti.com
- manager@arti.com
- site@arti.com
- super@arti.com

## Testing

### Create a Test Worker
```
Email: worker@test.com
Password: worker1234
```

### Login & See Approval Page
1. Go to http://localhost:3000
2. Click "Worker Portal"
3. Enter worker credentials
4. **Approval waiting page appears** ✓

### Admin Approves Worker
1. Login with: admin@arti.com / admin123456
2. Go to "Members" section
3. Find "Test Worker"
4. Click "Approve"

### Worker Gets Access
1. Worker logs in again
2. Dashboard loads ✓

## Summary
✅ Workers register with PENDING status
✅ Approval page shown until approved
✅ Admins can approve/reject workers
✅ Full workflow integrated end-to-end
