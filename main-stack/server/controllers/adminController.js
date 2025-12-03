const db = require('../config/db');
const Categories = require('../models/sql/categories');

function normalizeCount(row) {
  if (!row) return 0;
  return Number(row.count || row['COUNT(*)'] || Object.values(row)[0] || 0);
}

exports.overview = async (req, res) => {
  try {
    // basic metrics
    const totalOrdersRow = await db('customer_orders').count('id as count').first();
    const totalSuppliersRow = await db('suppliers').count('id as count').first();
    const totalCustomersRow = await db('users').where('role', 'customer').count('id as count').first();

    const metrics = {
      totalOrders: normalizeCount(totalOrdersRow),
      totalSuppliers: normalizeCount(totalSuppliersRow),
      totalCustomers: normalizeCount(totalCustomersRow),
    };

    // recent activities: get latest entries from customer_orders, supply_orders, feedbacks
    const custOrders = await db('customer_orders')
      .select('id', 'order_no as title', 'total_amount as value', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(6);

    const supplyOrders = await db('supply_orders')
      .select('id', 'order_no as title', 'total_amount as value', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(6);

    const feedbacks = await db('feedbacks')
      .select('id', 'message as title', db.raw("NULL as value"), 'created_at')
      .orderBy('created_at', 'desc')
      .limit(6);

    // combine and sort by created_at
    const combined = [
      ...custOrders.map((r) => ({ type: 'customer_order', id: r.id, title: r.title, value: r.value, created_at: r.created_at })),
      ...supplyOrders.map((r) => ({ type: 'supply_order', id: r.id, title: r.title, value: r.value, created_at: r.created_at })),
      ...feedbacks.map((r) => ({ type: 'feedback', id: r.id, title: r.title, value: null, created_at: r.created_at })),
    ];

    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const activities = combined.slice(0, 8);

    return res.json({ metrics, activities });
  } catch (err) {
    console.error('admin overview error', err);
    return res.status(500).json({ message: 'Failed to load admin overview' });
  }
}

// Categories CRUD
exports.listCategories = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;

    const categories = await Categories.listAll(limit, offset);
    const total = await Categories.count();

    return res.json({ categories, total, limit, offset });
  } catch (err) {
    console.error('list categories error', err);
    return res.status(500).json({ message: 'Failed to load categories' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category with same name already exists
    const existing = await db('categories').where({ name: name.trim() }).first();
    if (existing) {
      return res.status(409).json({ errors: [{ field: 'name', msg: 'Category name already exists' }] });
    }

    const category = await Categories.create({ name, description });
    return res.status(201).json({ category });
  } catch (err) {
    console.error('create category error', err);
    if (err.message.includes('Name is required')) {
      return res.status(400).json({ errors: [{ field: 'name', msg: err.message }] });
    }
    return res.status(500).json({ message: 'Failed to create category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!id) {
      return res.status(400).json({ errors: [{ field: 'id', msg: 'Category ID required' }] });
    }

    const category = await Categories.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if new name conflicts with existing category (but not itself)
    if (name && name.trim() !== category.name) {
      const existing = await db('categories').where({ name: name.trim() }).first();
      if (existing) {
        return res.status(409).json({ errors: [{ field: 'name', msg: 'Category name already exists' }] });
      }
    }

    const updated = await Categories.update(id, { name, description });
    return res.json({ category: updated });
  } catch (err) {
    console.error('update category error', err);
    return res.status(500).json({ message: 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ errors: [{ field: 'id', msg: 'Category ID required' }] });
    }

    const category = await Categories.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const deleted = await Categories.delete(id);
    if (deleted) {
      return res.json({ message: 'Category deleted successfully' });
    } else {
      return res.status(500).json({ message: 'Failed to delete category' });
    }
  } catch (err) {
    console.error('delete category error', err);
    return res.status(500).json({ message: 'Failed to delete category' });
  }
},

  exports.getUsers = async (req, res) => {

    try {
      // fetch the users list where role is customer
      const users = await db('users').where('role', 'customer').select('id', 'firstname', 'lastname', 'email', 'phone', 'created_at');
      // fetch the users count where role is customer
      const usersCount = await db('users').where('role', 'customer').count('id as count').first();

      return res.json({
        users, metrics: {
          totalUsers: normalizeCount(usersCount)
        }
      })
    }
    catch (err) {
      console.err("failed to fetch users", err);
      return res.status(500).json({ message: "Internal server error" })
    }
  }