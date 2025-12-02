const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Users = require('../models/sql/users');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const TOKEN_NAME = process.env.TOKEN_NAME || 'retailiq_token';

function safeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

module.exports = {
  signup: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // normalize errors to { field, msg }
        const payload = errors.array().map((e) => ({ field: e.param, msg: e.msg }));
        return res.status(400).json({ errors: payload });
      }

      const { firstname, lastname, email, password, phone } = req.body;

      // check for existing
      const byEmail = await Users.findByEmail(email);
      if (byEmail) return res.status(409).json({ errors: [{ field: 'email', msg: 'Email already registered' }] });

      if (phone) {
        const byPhone = await Users.findByPhone(phone);
        if (byPhone) return res.status(409).json({ errors: [{ field: 'phone', msg: 'Phone already registered' }] });
      }

      const hashed = await bcrypt.hash(password, 10);

      const newUser = await Users.createUser({ firstname, lastname, email, password: hashed, phone });

      // generate token
      const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

      // set cookie
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie(TOKEN_NAME, token, {
        httpOnly: true,
        secure: !!isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({ user: safeUser(newUser) });
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

      const { identifier, password } = req.body; // identifier can be email or phone

      const user = await Users.findByEmailOrPhone(identifier);
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

      return res.json({ user: safeUser(user) });
    } catch (err) {
      console.error('login error', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  me: async (req, res) => {
    try {
      // auth middleware sets req.user
      const user = await Users.findById(req.user.userId);
      return res.json({ user: safeUser(user) });
    } catch (err) {
      console.error('me error', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  logout: async (req, res) => {
    try {
      // Clear cookie
      res.clearCookie(TOKEN_NAME, { httpOnly: true, sameSite: 'lax' });
      return res.json({ ok: true });
    } catch (err) {
      console.error('logout error', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },
};
