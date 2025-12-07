const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPEmail, sendOTPSMS, isOTPValid } = require('../services/otpService');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const TOKEN_NAME = process.env.TOKEN_NAME || 'retailiq_token';

function safeUser(user) {
  if (!user) return null;
  const { password, otp, otpGeneratedAt, ...rest } = user;
  return rest;
}

module.exports = {
  // signup controller
  signup: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const payload = errors.array().map((e) => ({ field: e.param, msg: e.msg }));
        return res.status(400).json({ errors: payload });
      }

      const { firstname, lastname, email, password, phone, role, address } = req.body;

      // check for existing email
      const byEmail = await db('users').where({ email }).first();
      if (byEmail) {
        return res
          .status(409)
          .json({ errors: [{ field: 'email', msg: 'Email already registered' }] });
      }

      // check for existing phone
      if (phone) {
        const byPhone = await db('users').where({ phone }).first();
        if (byPhone) {
          return res
            .status(409)
            .json({ errors: [{ field: 'phone', msg: 'Phone already registered' }] });
        }
      }

      const hashed = await bcrypt.hash(password, 10);

      // Use a transaction so user + supplier are consistent
      const newUser = await db.transaction(async (trx) => {
        // Insert new user
        const [id] = await trx('users').insert({
          firstname,
          lastname,
          email,
          password: hashed,
          phone,
          role: role || 'customer', // fallback if role isn't provided
        });

        const createdUser = await trx('users').where({ id }).first();

        // If role is supplier, create supplier row
        if (createdUser.role === 'supplier') {
          // address is NOT NULL in suppliers table, so make sure you pass it from frontend
          await trx('suppliers').insert({
            cust_id: createdUser.id,
            name: `${createdUser.firstname} ${createdUser.lastname}`,
            email: createdUser.email,
            phone: createdUser.phone,
            address: address, // must be provided in req.body for suppliers
            // other fields use defaults (is_active, rating, etc.)
          });
        }

        return createdUser;
      });

      // generate token
      const token = jwt.sign(
        { userId: newUser.id, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // set cookie
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie(TOKEN_NAME, token, {
        httpOnly: true,
        secure: !!isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({ user: safeUser(newUser), token });
    } catch (err) {
      console.error('signup error', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  login: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const payload = errors.array().map((e) => ({ field: e.param, msg: e.msg }));
        return res.status(400).json({ errors: payload });
      }

      const { identifier, password } = req.body;

      // Find user by email or phone
      const user = await db('users')
        .where(function () {
          this.where('email', identifier).orWhere('phone', identifier);
        })
        .first();

      if (!user) return res.status(401).json({ errors: [{ field: 'identifier', msg: 'Invalid credentials' }] });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ errors: [{ field: 'password', msg: 'Invalid credentials' }] });

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      const isProd = process.env.NODE_ENV === 'production';
      res.cookie(TOKEN_NAME, token, {
        httpOnly: true,
        secure: !!isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ user: safeUser(user), token });
    } catch (err) {
      console.error('login error', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  me: async (req, res) => {
    try {
      const user = await db('users').where({ id: req.user.userId }).first();
      return res.json({ user: safeUser(user) });
    } catch (err) {
      console.error('me error', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  logout: async (req, res) => {
    try {
      res.clearCookie(TOKEN_NAME, { httpOnly: true, sameSite: 'lax' });
      return res.json({ ok: true });
    } catch (err) {
      console.error('logout error', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  // Forgot password: Step 1 - Request OTP
  forgotPassword: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const payload = errors.array().map((e) => ({ field: e.param, msg: e.msg }));
        return res.status(400).json({ errors: payload });
      }

      const { identifier, channel } = req.body;

      const user = await db('users')
        .where(function () {
          this.where('email', identifier).orWhere('phone', identifier);
        })
        .first();

      if (!user) {
        return res.status(404).json({ errors: [{ field: 'identifier', msg: 'User not found' }] });
      }

      // Generate OTP
      const otp = generateOTP();
      const otpGeneratedAt = new Date();

      // Store OTP in database
      await db('users').where({ id: user.id }).update({ otp, otpGeneratedAt });

      // Send OTP via selected channel
      try {
        if (channel === 'email') {
          await sendOTPEmail(user.email, otp, user.firstname);
        } else if (channel === 'sms') {
          if (!user.phone) {
            return res.status(400).json({ errors: [{ field: 'channel', msg: 'No phone number on file' }] });
          }
          await sendOTPSMS(user.phone, otp);
        } else {
          return res.status(400).json({ errors: [{ field: 'channel', msg: 'Invalid channel' }] });
        }
      } catch (sendErr) {
        console.error('OTP send error:', sendErr);
        await db('users').where({ id: user.id }).update({ otp: null, otpGeneratedAt: null });
        return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
      }

      return res.json({ message: `OTP sent to your ${channel}` });
    } catch (err) {
      console.error('forgot password error', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  // Forgot password: Step 2 - Verify OTP
  verifyOTP: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const payload = errors.array().map((e) => ({ field: e.param, msg: e.msg }));
        return res.status(400).json({ errors: payload });
      }

      const { identifier, otp } = req.body;

      const user = await db('users')
        .where(function () {
          this.where('email', identifier).orWhere('phone', identifier);
        })
        .first();

      if (!user) {
        return res.status(404).json({ errors: [{ field: 'identifier', msg: 'User not found' }] });
      }

      // Check if OTP matches
      if (!user.otp || user.otp !== otp) {
        return res.status(401).json({ errors: [{ field: 'otp', msg: 'Invalid OTP' }] });
      }

      // Check if OTP is still valid (10 minutes)
      if (!isOTPValid(user.otpGeneratedAt)) {
        await db('users').where({ id: user.id }).update({ otp: null, otpGeneratedAt: null });
        return res.status(401).json({ errors: [{ field: 'otp', msg: 'OTP expired' }] });
      }

      // Generate a temporary token for password reset (valid for 5 minutes)
      const resetToken = jwt.sign({ userId: user.id, type: 'reset' }, JWT_SECRET, { expiresIn: '5m' });

      return res.json({ resetToken });
    } catch (err) {
      console.error('verify otp error', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  // Forgot password: Step 3 - Reset Password
  resetPassword: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const payload = errors.array().map((e) => ({ field: e.param, msg: e.msg }));
        return res.status(400).json({ errors: payload });
      }

      const { resetToken, newPassword } = req.body;

      // Verify reset token
      let decoded;
      try {
        decoded = jwt.verify(resetToken, JWT_SECRET);
      } catch (jwtErr) {
        return res.status(401).json({ errors: [{ field: 'resetToken', msg: 'Invalid or expired reset token' }] });
      }

      if (decoded.type !== 'reset') {
        return res.status(401).json({ errors: [{ field: 'resetToken', msg: 'Invalid token type' }] });
      }

      const user = await db('users').where({ id: decoded.userId }).first();
      if (!user) {
        return res.status(404).json({ errors: [{ field: 'resetToken', msg: 'User not found' }] });
      }

      // Hash new password
      const hashed = await bcrypt.hash(newPassword, 10);

      // Update password and clear OTP
      await db('users').where({ id: user.id }).update({ password: hashed, otp: null, otpGeneratedAt: null });

      return res.json({ message: 'Password reset successfully' });
    } catch (err) {
      console.error('reset password error', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },
};
