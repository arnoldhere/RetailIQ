# Forgot Password OTP Feature - Setup Guide

This guide explains how to set up and test the forgot password feature with OTP verification via email (Gmail) and SMS (Twilio).

## Overview

The forgot password system includes three steps:

1. **Request OTP** - User enters email/phone and selects delivery method (email or SMS)
2. **Verify OTP** - User enters the 6-digit OTP (valid for 10 minutes, auto-deletes from DB after expiry)
3. **Reset Password** - User sets a new password using a temporary reset token

## Backend Setup

### 1. Database Migration

Run the updated DDL script to add OTP columns to the users table:

```sql
ALTER TABLE users ADD COLUMN otp VARCHAR(10) NULL;
ALTER TABLE users ADD COLUMN otpGeneratedAt TIMESTAMP NULL;
```

Or if using the full setup, the `db_setup_ddl.sql` already includes these columns.

### 2. Environment Variables

Copy `.env.example` → `.env` and add the following:

```env
# Gmail (for email OTP)
GMAIL_EMAIL=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password

# Twilio (for SMS OTP, optional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Gmail Setup (Email OTP)

1. Enable 2FA on your Google Account
2. Generate an **App Password** (16 characters) at https://myaccount.google.com/apppasswords
3. Use the app password in `GMAIL_APP_PASSWORD` (not your regular password)

#### Twilio Setup (SMS OTP)

1. Sign up at https://www.twilio.com
2. Get your Account SID, Auth Token, and a Twilio phone number
3. Add credentials to `.env`

### 3. Install Dependencies

```bash
cd server
npm install
```

This installs `nodemailer` (email) and `twilio` (SMS).

### 4. Backend API Endpoints

All endpoints are under `/api/auth`:

#### POST `/api/auth/forgot-password`
Request OTP for password reset.

**Request body:**
```json
{
  "identifier": "user@example.com",
  "channel": "email"
}
```

- `identifier`: user's email or phone
- `channel`: "email" or "sms"

**Response:**
```json
{
  "message": "OTP sent to your email"
}
```

---

#### POST `/api/auth/verify-otp`
Verify the OTP entered by user.

**Request body:**
```json
{
  "identifier": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "resetToken": "eyJhbGciOi..."
}
```

The `resetToken` is valid for 5 minutes and must be used immediately.

---

#### POST `/api/auth/reset-password`
Update password using the reset token.

**Request body:**
```json
{
  "resetToken": "eyJhbGciOi...",
  "newPassword": "NewSecurePass123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

---

## Frontend Setup

### 1. Install Client Dependencies

```bash
cd client
npm install
```

### 2. Pages Added

- `/auth/forgot-password` - Request OTP form
- `/auth/verify-otp` - Verify OTP with countdown timer
- `/auth/reset-password` - Set new password

### 3. Features

✅ **Request OTP Page:**
- Input email or phone
- Choose delivery method (email/SMS)
- Validation and error messages
- Link back to login

✅ **Verify OTP Page:**
- 6-digit OTP input (auto-format, numbers only)
- 10-minute countdown timer (red warning at < 60s)
- Resend OTP option if expired
- Auto-disable verify button if OTP expires

✅ **Reset Password Page:**
- New password input (min 8 chars)
- Password confirmation
- Validation on match
- Redirect to login after success

---

## Testing the Flow

### Using cURL (or Postman)

1. **Request OTP (Email):**
   ```bash
   curl -i -X POST http://localhost:8888/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"identifier":"user@example.com","channel":"email"}'
   ```

2. **Verify OTP:**
   ```bash
   curl -i -X POST http://localhost:8888/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"identifier":"user@example.com","otp":"123456"}'
   ```

3. **Reset Password:**
   ```bash
   curl -i -X POST http://localhost:8888/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"resetToken":"<resetToken_from_step2>","newPassword":"NewPassword123"}'
   ```

### Manual Testing in Browser

1. Go to `http://localhost:5173/auth/forgot-password`
2. Enter email/phone and select delivery method
3. Click "Send OTP"
4. Check email/SMS for 6-digit code
5. Enter code and click "Verify OTP"
6. Enter new password and confirm
7. Click "Reset Password"
8. Login with new credentials

---

## Error Handling

### Backend Errors

- **User not found:** 404 with message "User not found"
- **Invalid OTP:** 401 with message "Invalid OTP"
- **OTP expired:** 401 with message "OTP expired" (clears from DB)
- **Invalid reset token:** 401 with message "Invalid or expired reset token"
- **Email/SMS send failed:** 500 with message "Failed to send OTP"

### Frontend Error Display

All errors are shown as Chakra UI toast notifications with:
- Error title
- Detailed error message from server
- Red color scheme
- Auto-dismiss after 3 seconds

---

## Security Notes

1. **OTP Validity:** 10 minutes (configurable in `services/otpService.js`)
2. **Reset Token Validity:** 5 minutes (configurable in `controllers/authController.js`)
3. **Password Requirements:** Minimum 8 characters
4. **httpOnly Cookies:** Login cookies remain secure
5. **HTTPS in Production:** Always use HTTPS and set `secure: true` for cookies

---

## Optional Enhancements

1. **OTP Resend Logic:** Add rate limiting (e.g., max 3 resends per 30 min)
2. **SMS Fallback:** Allow switching from email to SMS mid-flow
3. **Email Notifications:** Send "password changed" confirmation email
4. **Audit Logging:** Log all password reset attempts
5. **Biometric Auth:** Add fingerprint/face ID as OTP alternative

---

## Troubleshooting

**Gmail: "Invalid credentials"**
- Ensure you're using the 16-character **App Password**, not your Gmail password
- Confirm 2FA is enabled on your Google account

**Twilio: "Invalid auth token"**
- Double-check Account SID and Auth Token in .env
- Ensure Twilio account is active and funded

**OTP not arriving**
- Check server logs for send errors: `npm run start` in server folder
- Verify email/phone is correct in user database
- Test Twilio/Gmail credentials separately

**Reset token expired**
- Users have 5 minutes to reset password after OTP verification
- If expired, restart from "Request OTP" page

---

## Database Management (Optional)

To manually clear expired OTPs (for testing or cleanup):

```sql
DELETE FROM users WHERE otpGeneratedAt IS NOT NULL AND otpGeneratedAt < DATE_SUB(NOW(), INTERVAL 10 MINUTE);
```

This deletes any OTPs older than 10 minutes.

---

That's it! The forgot password feature is now fully integrated with responsive UI, proper error handling, and multi-channel OTP delivery.
