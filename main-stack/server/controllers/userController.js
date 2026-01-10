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

// Return supplier record for logged-in supplier
exports.getSupplierProfile = async (req, res) => {
    try {
        const user = req.user;
        const supplier = await db('suppliers').where({ cust_id: user.id }).first();
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
        const user = req.user;
        const supplier = await db('suppliers').where({ cust_id: user.id }).first();
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
        const [orderId] = await trx('supply_orders').insert({
            order_no,
            supplier_id: supplier.id,
            store_id,
            ordered_by: user.id,
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
                sendEmail(process.env.GMAIL_EMAIL, adminEmails, subject, html).catch(e=>console.error('notify admin failed', e));
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
        const user = req.user;
        const supplier = await db('suppliers').where({ cust_id: user.id }).first();
        if (!supplier) return res.status(404).json({ message: 'Supplier profile not found' });

        const limit = Math.min(parseInt(req.query.limit) || 20, 500);
        const offset = parseInt(req.query.offset) || 0;

        const q = db('supply_orders')
            .where('supply_orders.supplier_id', supplier.id)
            .select('supply_orders.*', 'stores.name as store_name')
            .leftJoin('stores', 'supply_orders.store_id', 'stores.id');

        const countRes = await q.clone().count({ count: 'supply_orders.id' }).first();
        const total = Number(countRes.count || 0);

        const orders = await q.orderBy('supply_orders.created_at', 'desc').limit(limit).offset(offset);
        return res.json({ orders, total, limit, offset });
    } catch (err) {
        console.error('supplierListOrders error', err);
        return res.status(500).json({ message: 'Failed to list supplier orders' });
    }
}
