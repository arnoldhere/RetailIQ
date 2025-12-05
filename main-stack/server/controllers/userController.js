const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getProductCategories = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 500);
        const offset = parseInt(req.query.offset) || 0;

        // const categories = await Categories.listAll(limit, offset);
        const categories = await db('categories').limit(limit).offset(offset).orderBy('created_at', 'desc');
        // const total = await Categories.count();
        const total = await db('categories').count('id as count').first();

        return res.json({ categories, total, limit, offset });
    } catch (err) {
        console.error('list categories error', err);
        return res.status(500).json({ message: 'Failed to load categories' });
    }
}

// exports.getWishlist = async (req, res) => {
//     try {
//         const wishlist = await db('customer_wishlist')
//         return res.json({ wishlist});
//     } catch (err) {
//         console.error('list categories error', err);
//         return res.status(500).json({ message: 'Failed to load categories' });
//     }
// }

exports.getMetrics = async (req, res) => {
    try {
        // basic metrics
        const totalOrdersRow = await db('customer_orders').count('id as count').first();
        const totalSuppliersRow = await db('suppliers').count('id as count').first();
        const totalCustomersRow = await db('users').where('role', 'customer').count('id as count').first();
        const totalProducts = await db('products').count('id as count').first();

        const metrics = {
            totalOrders: totalOrdersRow,
            totalSuppliers: totalSuppliersRow,
            totalCustomers: totalCustomersRow,
            totalProducts: totalProducts,
        };
        /*
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
        */
        return res.json({ metrics });
    } catch (err) {
        console.error('admin overview error', err);
        return res.status(500).json({ message: 'Failed to load admin overview' });
    }
}