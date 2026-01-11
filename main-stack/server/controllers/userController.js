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

exports.getMetrics = async (req, res) => {
    try {
        // basic metrics
        const totalOrdersRow = await db('customer_orders').count('id as count').first();
        const totalSuppliersRow = await db('suppliers').count('id as count').first();
        const totalCustomersRow = await db('users').where('role', 'customer').count('id as count').first();
        const totalProducts = await db('products').count('id as count').first();

        const metrics = [{
            totalOrders: totalOrdersRow,
            totalSuppliers: totalSuppliersRow,
            totalCustomers: totalCustomersRow,
            totalProducts: totalProducts,
        }];
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

exports.getAboutus = async (req, res) => {
    try {
        const totalCustomersRow = await db('users').where('role', 'customer').count('id as count').first();
        const totalProducts = await db('products').count('id as count').first();
        const totalSuppliersRow = await db('suppliers').count('id as count').first();
        const totalStoresRow = await db('stores').count('id as count').first();

        const stats = {
            totalCustomers: totalCustomersRow,
            totalProducts: totalProducts,
            totalSuppliers: totalSuppliersRow,
            totalStores: totalStoresRow,
        }
        return res.json({ stats });

    } catch (error) {
        console.error('About us pagee error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

exports.editProfile = async (req, res) => {
    try {
        console.log(req.body);
        const { firstname, lastname, email, phone, address, name } = req.body;
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ message: 'Missing user id' });
        }

        const user = await db('users').where('id', id).first();
        if (!user) return res.status(404).json({ message: "User not found... Invalid authentication" });

        // Build update payload only with provided fields
        const payload = {};
        if (firstname !== undefined) payload.firstname = firstname;
        if (lastname !== undefined) payload.lastname = lastname;
        if (email !== undefined) payload.email = email;
        if (phone !== undefined) payload.phone = phone;
        if (address !== undefined) payload.address = address;

        if (Object.keys(payload).length > 0) {
            await db('users').where('id', id).update(payload);
        }

        // If user is supplier and name provided, update suppliers table as well
        if (user.role === 'supplier' && name !== undefined) {
            await db('suppliers').where('cust_id', id).update({ name: name.trim() });
        }

        return res.json({ message: "Profile updated sucessfully.." })
    } catch (error) {
        console.error('Profile update failed..', error);
        return res.status(500).json({ message: 'Failed to update profile' });
    }
}

// Helper to resolve supplier from token (supports supplierId or linked userId)
async function resolveSupplierFromReq(req) {
    if (req.user && req.user.supplierId) {
        return await db('suppliers').where({ id: req.user.supplierId }).first();
    }
    if (req.user && req.user.userId) {
        return await db('suppliers').where({ cust_id: req.user.userId }).first();
    }
    return null;
}

// Return supplier record for logged-in supplier
exports.getSupplierProfile = async (req, res) => {
    try {
        const supplier = await resolveSupplierFromReq(req);
        if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });
        return res.json({ supplier });
    } catch (err) {
        console.error('get supplier profile error', err);
        return res.status(500).json({ message: 'Failed to load supplier profile' });
    }
}

// Supplier: create a supply order (request to supply product(s) to a store)
exports.supplierCreateSupplyOrder = async (req, res) => {
    const trx = await db.transaction();
    try {
        const supplier = await resolveSupplierFromReq(req);
        if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });

        const { store_id, items, deliver_at } = req.body;
        if (!store_id || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'store_id and items array required' });

        // Validate products & compute totals
        let total = 0;
        for (const it of items) {
            if (!it.product_id || !it.qty || !it.cost) {
                await trx.rollback();
                return res.status(400).json({ message: 'Each item requires product_id, qty and cost' });
            }
            total += Number(it.qty) * Number(it.cost);
        }

        const order_no = `SO-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
        const orderedBy = req.user && req.user.userId ? req.user.userId : null;
        const [orderId] = await trx('supply_orders').insert({
            order_no,
            supplier_id: supplier.id,
            store_id,
            ordered_by: orderedBy,
            status: 'pending',
            total_amount: total,
            deliver_at: deliver_at || null,
        });

        // insert items
        for (const it of items) {
            await trx('supply_order_items').insert({
                supply_order_id: orderId,
                product_id: it.product_id,
                qty: it.qty,
                cost: it.cost,
                total_amount: Number(it.qty) * Number(it.cost),
            });
        }

        // notify admins (best-effort)
        try {
            const admins = await trx('users').where('role', 'admin').select('email');
            const adminEmails = admins.map(a => a.email).filter(Boolean).join(',');
            if (adminEmails) {
                const subject = `New supply order request ${order_no}`;
                const html = `<p>Supplier ${supplier.name || supplier.cust_id} placed a supply request (${order_no}).</p>`;
                const sendEmail = require('../services/mailService');
                sendEmail(process.env.GMAIL_EMAIL, adminEmails, subject, html).catch(e => console.error('notify admin failed', e));
            }
        } catch (e) {
            console.error('notify admins error', e);
        }

        await trx.commit();
        const created = await db('supply_orders').where('id', orderId).first();
        return res.json({ order: created });
    } catch (err) {
        await trx.rollback();
        console.error('supplierCreateSupplyOrder error', err);
        return res.status(500).json({ message: 'Failed to create supply order' });
    }
}

// Supplier: list own supply orders
exports.supplierListOrders = async (req, res) => {
    try {
        const supplier = await resolveSupplierFromReq(req);
        if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });

        const limit = Math.min(parseInt(req.query.limit) || 20, 500);
        const offset = parseInt(req.query.offset) || 0;

        // Base filter
        const baseQuery = db('supply_orders')
            .where('supply_orders.supplier_id', supplier.id);

        // Total count (clean, no select pollution)
        const countRes = await baseQuery.clone().count({ count: 'supply_orders.id' }).first();
        const total = Number(countRes.count || 0);

        // Actual data query
        const orders = await baseQuery
            .clone()
            .select('supply_orders.*', 'stores.name as store_name')
            .leftJoin('stores', 'supply_orders.store_id', 'stores.id')
            .orderBy('supply_orders.created_at', 'desc')
            .limit(limit)
            .offset(offset);

        return res.json({ orders, total, limit, offset });

    } catch (err) {
        console.error('supplierListOrders error', err);
        return res.status(500).json({ message: 'Failed to list supplier orders' });
    }
};


// Supplier: get single supply order details (items & payments)
exports.supplierGetOrder = async (req, res) => {
    try {
        const supplier = await resolveSupplierFromReq(req);
        if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });

        const { id } = req.params;
        const order = await db('supply_orders')
            .where({ id, supplier_id: supplier.id })
            .select('supply_orders.*', 'stores.name as store_name')
            .leftJoin('stores', 'supply_orders.store_id', 'stores.id')
            .first();
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const items = await db('supply_order_items').where({ supply_order_id: id }).leftJoin('products', 'supply_order_items.product_id', 'products.id').select('supply_order_items.*', 'products.name as product_name');
        const payments = await db('supply_payments').where({ supply_order_id: id }).orderBy('payment_date', 'desc');

        return res.json({ order, items, payments });
    } catch (err) {
        console.error('supplierGetOrder error', err);
        return res.status(500).json({ message: 'Failed to load order' });
    }
}

// Update supplier profile (for suppliers authenticated from suppliers table or linked users)
exports.updateSupplierProfile = async (req, res) => {
    try {
        const supplier = await resolveSupplierFromReq(req);
        if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });

        const { name, email, phone, address, password } = req.body;
        const payload = {};
        if (name !== undefined) payload.name = name.trim();
        if (email !== undefined) payload.email = email.trim();
        if (phone !== undefined) payload.phone = phone.trim();
        if (address !== undefined) payload.address = address;

        // Validate uniqueness for email/phone among suppliers (exclude self)
        if (payload.email) {
            const existing = await db('suppliers').where('email', payload.email).andWhereNot('id', supplier.id).first();
            if (existing) return res.status(409).json({ message: 'Email already in use' });
        }
        if (payload.phone) {
            const existing = await db('suppliers').where('phone', payload.phone).andWhereNot('id', supplier.id).first();
            if (existing) return res.status(409).json({ message: 'Phone already in use' });
        }

        // If password provided, hash and update
        if (password !== undefined && password && password.length >= 8) {
            const bcrypt = require('bcryptjs');
            const hashed = await bcrypt.hash(password, 10);
            payload.password = hashed;
        }

        if (Object.keys(payload).length > 0) {
            await db('suppliers').where({ id: supplier.id }).update(payload);
        }

        const updated = await db('suppliers').where({ id: supplier.id }).first();
        delete updated.password;
        return res.json({ supplier: updated });
    } catch (err) {
        console.error('update supplier profile error', err);
        return res.status(500).json({ message: 'Failed to update profile' });
    }
}
