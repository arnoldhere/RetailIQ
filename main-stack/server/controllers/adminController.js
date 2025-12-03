const db = require('../config/db');

function normalizeCount(row) {
  if (!row) return 0;
  return Number(row.count || row['COUNT(*)'] || Object.values(row)[0] || 0);
}

module.exports = {
  overview: async (req, res) => {
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
  },
};
