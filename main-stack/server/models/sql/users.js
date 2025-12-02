const db = require('../../config/db');

module.exports = {
  createUser: async (data) => {
    const [id] = await db('users').insert(data);
    const user = await db('users').where({ id }).first();
    return user;
  },

  findByEmail: async (email) => {
    if (!email) return null;
    return db('users').where({ email }).first();
  },

  findByPhone: async (phone) => {
    if (!phone) return null;
    return db('users').where({ phone }).first();
  },

  findByEmailOrPhone: async (identifier) => {
    if (!identifier) return null;
    return db('users')
      .where(function () {
        this.where('email', identifier).orWhere('phone', identifier);
      })
      .first();
  },

  findById: async (id) => {
    return db('users').where({ id }).first();
  },
};
