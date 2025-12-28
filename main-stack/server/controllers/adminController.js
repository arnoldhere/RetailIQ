const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const emailService = require("../services/mailService")

// media products dir
const MEDIA_PRODUCTS_DIR = path.join(__dirname, '..', 'media', 'products');
if (!fs.existsSync(MEDIA_PRODUCTS_DIR)) {
  fs.mkdirSync(MEDIA_PRODUCTS_DIR, { recursive: true });
}

function normalizeCount(row) {
  if (!row) return 0;
  return Number(row.count || row['COUNT(*)'] || Object.values(row)[0] || 0);
}

function normalizeImages(images) {
  if (!images) return [];

  // If it’s already an array (in case knex or MySQL JSON type returns real array)
  if (Array.isArray(images)) return images;

  // If it’s an object, you might want to wrap or convert it; for now just return as is
  if (typeof images === 'object') return images;

  if (typeof images === 'string') {
    const trimmed = images.trim();

    // Looks like JSON? Try to parse it
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        // fall through to string fallback
      }
    }

    // Not JSON: treat as a single image URL / data URL
    return [trimmed];
  }

  return [];
}

/**
 * Save base64 data URLs to disk and return an array of relative paths.
 * Expected input items like: "data:image/png;base64,AAAA..."
 */
async function saveBase64Images(images, productName) {
  if (!images || !Array.isArray(images)) return [];

  const safeName = (productName || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const savedPaths = [];

  for (let i = 0; i < images.length; i++) {
    const src = images[i];
    if (typeof src !== 'string') continue;

    // Expect "data:image/xxx;base64,...."
    const match = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      console.warn('Skipping invalid image string at index', i);
      continue;
    }

    const mimeType = match[1]; // e.g. "image/png"
    const base64Data = match[2];
    const ext = mimeType.split('/')[1] || 'png';

    const filename = `${safeName}-${Date.now()}-${i}.${ext}`;
    const absolutePath = path.join(MEDIA_PRODUCTS_DIR, filename);

    await fs.promises.writeFile(absolutePath, base64Data, 'base64');

    // relative path to serve later via /media static
    const relativePath = `media/products/${filename}`;
    savedPaths.push(relativePath);
  }

  return savedPaths;
}

exports.overview = async (req, res) => {
  try {
    // basic metrics
    const totalOrdersRow = await db('customer_orders').count('id as count').first();
    const totalSuppliersRow = await db('suppliers').count('id as count').first();
    const totalCustomersRow = await db('users').where('role', 'customer').count('id as count').first();
    const totalProductsRow = await db('products').count('id as count').first();


    const metrics = {
      totalOrders: normalizeCount(totalOrdersRow),
      totalSuppliers: normalizeCount(totalSuppliersRow),
      totalCustomers: normalizeCount(totalCustomersRow),
      totalProducts: normalizeCount(totalProductsRow),
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

exports.listCategories = async (req, res) => {
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
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category with same name already exists
    const existing = await db('categories').where({ name: name.trim() }).first();
    if (existing) {
      return res.status(409).json({ errors: [{ field: 'name', msg: 'Category name already exists' }] });
    }

    // const category = await Categories.create({ name, description });
    const category = await db('categories').insert({ name: name.trim(), description }).returning('*').then(rows => rows[0]);
    return res.status(201).json({ category });
  } catch (err) {
    console.error('create category error', err);
    if (err.message.includes('Name is required')) {
      return res.status(400).json({ errors: [{ field: 'name', msg: err.message }] });
    }
    return res.status(500).json({ message: 'Failed to create category' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, supplier_id, cost_price, sell_price, stock_available } = req.body;

    // 1) Load existing product
    const existing = await db('products').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Start from existing images in DB
    let imagesArray = existing.images ? normalizeImages(existing.images) : [];

    // 2) Handle incoming images (files / base64 / JSON)
    if (req.files && req.files.length) {
      // New uploaded files replace existing (or you can choose to append)
      imagesArray = req.files.map((f) => `media/products/${f.filename}`);
    } else if (typeof req.body.images !== 'undefined') {
      // Something was explicitly sent in body for images
      let incoming = req.body.images;

      if (typeof incoming === 'string' && incoming.trim().length) {
        try {
          incoming = JSON.parse(incoming);
        } catch (e) {
          // leave as string
        }
      }

      // If incoming contains base64 data URIs, save them to disk
      if (Array.isArray(incoming) && incoming.some((it) => typeof it === 'string' && it.startsWith('data:image'))) {
        const saved = await saveBase64Images(incoming, name || existing.name);
        imagesArray = saved; // or [...imagesArray, ...saved] if you want to append
      } else {
        // Normalize JSON/strings/etc
        imagesArray = normalizeImages(incoming);
      }
    }
    // else: no images field in body and no files => keep existing imagesArray as-is

    // 3) Validation
    const finalName = (name ?? existing.name).trim();
    if (!finalName) {
      return res.status(400).json({ errors: [{ field: 'name', msg: 'Product name is required' }] });
    }

    const finalSellPrice = sell_price ?? existing.sell_price;
    if (!finalSellPrice) {
      return res.status(400).json({ errors: [{ field: 'sell_price', msg: 'Selling price is required' }] });
    }

    if (!Array.isArray(imagesArray)) {
      return res.status(400).json({ errors: [{ field: 'images', msg: 'Images must be an array' }] });
    }
    if (imagesArray.length > 5) {
      return res.status(400).json({ errors: [{ field: 'images', msg: 'Maximum 5 images allowed' }] });
    }

    // Optional: check for duplicate name (exclude self)
    if (finalName !== existing.name) {
      const nameClash = await db('products').where({ name: finalName }).andWhereNot({ id }).first();
      if (nameClash) {
        return res.status(409).json({ errors: [{ field: 'name', msg: 'Product name already exists' }] });
      }
    }

    // 4) Perform update
    await db('products')
      .where({ id })
      .update({
        name: finalName,
        description: description ?? existing.description,
        category_id: category_id ?? existing.category_id,
        supplier_id: supplier_id ?? existing.supplier_id,
        cost_price: cost_price ?? existing.cost_price,
        sell_price: finalSellPrice,
        stock_available: stock_available ?? existing.stock_available,
        images: imagesArray && imagesArray.length ? JSON.stringify(imagesArray) : JSON.stringify([]),
      });

    const updated = await db('products').where({ id }).first();
    const formatted = {
      ...updated,
      images: updated.images ? JSON.parse(updated.images) : [],
    };

    return res.json({ product: formatted });
  } catch (err) {
    console.error('update product error', err);
    return res.status(500).json({ message: 'Failed to update product' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ errors: [{ field: 'id', msg: 'Category ID required' }] });
    }

    // const category = await Categories.findById(id);
    const category = await db('categories').where({ id }).first();
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // const deleted = await Categories.delete(id);
    const deleted = await db('categories').where({ id }).del();
    if (deleted) {
      return res.json({ message: 'Category deleted successfully' });
    } else {
      return res.status(500).json({ message: 'Failed to delete category' });
    }
  } catch (err) {
    console.error('delete category error', err);
    return res.status(500).json({ message: 'Failed to delete category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    // Validation
    if (!id) {
      return res.status(400).json({ message: 'Category ID is required' });
    }
    if (!name && !description) {
      return res.status(400).json({
        message: 'At least one field (name or description) is required',
      });
    }

    // Check if category exists
    const existingCategory = await db('categories')
      .where({ id })
      .first();

    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    // Prepare update payload
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;

    // Perform update
    await db('categories')
      .where({ id })
      .update(updateData);

    return res.status(200).json({
      message: 'Category updated successfully',
      data: {
        id,
        ...updateData,
      },
    });
  } catch (error) {
    // Handle duplicate category name
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Category name already exists',
      });
    }

    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
}

exports.getUsers = async (req, res) => {

  try {
    // fetch the users list where role is customer
    const users = await db('users').select('id', 'firstname', 'lastname', 'email', 'phone', 'created_at', 'is_active');
    // fetch the users count where role is customer
    const usersCount = await db('users').count('id as count').first();

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

exports.getFeedbacks = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;

    let query = db('feedbacks')
      .join('users', 'feedbacks.cust_id', 'users.id')
      .select('feedbacks.id', 'feedbacks.message', 'feedbacks.created_at', 'users.firstname as firstname', 'users.lastname as lastname', 'users.email as user_email');

    if (search) {
      query = query.where(function () {
        this.where('users.firstname', 'like', `%${search}%`)
          .orWhere('users.lastname', 'like', `%${search}%`)
          .orWhere('users.email', 'like', `%${search}%`)
          .orWhere('feedbacks.message', 'like', `%${search}%`);
      });
    }

    const countQuery = query.clone();
    const countResult = await countQuery
      .clearSelect()
      .clearOrder()
      .count({ count: 'feedbacks.id' })
      .first();

    const total = Number(countResult.count || 0);

    const feedbacks = await query
      .orderBy('feedbacks.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return res.json({ feedbacks, total, limit, offset });
  } catch (err) {
    console.error('get feedbacks error', err);
    return res.status(500).json({ message: 'Failed to load feedbacks' });
  }
}

exports.listSuppliers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;

    let query = db('suppliers').select('*');

    if (search) {
      query = query.where(function () {
        this.where('name', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`)
          .orWhere('phone', 'like', `%${search}%`);
      });
    }

    const countQuery = query.clone();
    const countResult = await countQuery
      .clearSelect()
      .clearOrder()
      .count({ count: 'suppliers.id' })
      .first();

    const total = Number(countResult.count || 0);

    const suppliers = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return res.json({ suppliers, total, limit, offset });
  } catch (err) {
    console.error('list suppliers error', err);
    return res.status(500).json({ message: 'Failed to load suppliers' });
  }
};

// Update supplier (and linked user record)
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, name, email, phone, is_active } = req.body;

    const existing = await db('suppliers').where({ id }).first();
    if (!existing) return res.status(404).json({ message: 'Supplier not found' });

    // Update supplier table
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (email !== undefined) updatePayload.email = email.trim();
    if (phone !== undefined) updatePayload.phone = phone.trim();
    if (is_active !== undefined) updatePayload.is_active = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';

    await db('suppliers').where({ id }).update(updatePayload);

    // Update linked user
    if (existing.cust_id) {
      const userPayload = {};
      if (firstname !== undefined) userPayload.firstname = firstname.trim();
      if (lastname !== undefined) userPayload.lastname = lastname.trim();
      if (email !== undefined) userPayload.email = email.trim();
      if (phone !== undefined) userPayload.phone = phone.trim();
      if (Object.keys(userPayload).length > 0) await db('users').where({ id: existing.cust_id }).update(userPayload);
    }

    const updated = await db('suppliers').where({ id }).first();
    return res.json({ supplier: updated });
  } catch (err) {
    console.error('update supplier error', err);
    return res.status(500).json({ message: 'Failed to update supplier' });
  }
}

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await db('suppliers').where({ id }).first();
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    // Check for supply orders
    const orderCount = await db('supply_orders').where({ supplier_id: id }).count('id as count').first();
    if (Number(orderCount.count || 0) > 0) {
      return res.status(400).json({ message: 'Cannot delete supplier with associated supply orders. Deactivate instead.' });
    }

    // Delete supplier and optionally delete linked user if desired
    await db.transaction(async (trx) => {
      await trx('suppliers').where({ id }).del();
      if (supplier.cust_id) {
        await trx('users').where({ id: supplier.cust_id }).del();
      }
    });

    return res.json({ message: 'Supplier deleted' });
  } catch (err) {
    console.error('delete supplier error', err);
    return res.status(500).json({ message: 'Failed to delete supplier' });
  }
}

exports.createSupplier = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { firstname, lastname, email, phone, password } = req.body;

    // Validation
    if (!firstname || !firstname.trim()) {
      return res.status(400).json({ errors: [{ field: 'firstname', msg: 'First name is required' }] });
    }
    if (!lastname || !lastname.trim()) {
      return res.status(400).json({ errors: [{ field: 'lastname', msg: 'Last name is required' }] });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ errors: [{ field: 'email', msg: 'Valid email is required' }] });
    }
    if (!phone || phone.length < 7) {
      return res.status(400).json({ errors: [{ field: 'phone', msg: 'Valid phone is required' }] });
    }
    // Allow admin to omit password; default to '12345678' if not provided or too short
    const rawPassword = password && password.length >= 8 ? password : '12345678';

    // Check if email already exists
    const existingEmail = await db('users').where({ email }).first();
    if (existingEmail) {
      return res.status(409).json({ errors: [{ field: 'email', msg: 'Email already exists' }] });
    }

    // Check if phone already exists
    const existingPhone = await db('users').where({ phone }).first();
    if (existingPhone) {
      return res.status(409).json({ errors: [{ field: 'phone', msg: 'Phone already exists' }] });
    }

    // Hash password (use rawPassword defaulted earlier)
    const hashed = await bcrypt.hash(rawPassword, 10);

    // Create user and supplier in transaction
    const result = await db.transaction(async (trx) => {
      // 1. Insert user with role='supplier'
      const [userId] = await trx('users').insert({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: hashed,
        role: 'supplier',
      });

      // 2. Insert supplier record
      await trx('suppliers').insert({
        cust_id: userId,
        name: `${firstname.trim()} ${lastname.trim()}`,
        email: email.trim(),
        phone: phone.trim(),
        is_active: true,
      });

      // Return created user (without password)
      const user = await trx('users').where({ id: userId }).first();
      return user;
    });

    // Format response (exclude password)
    const safeUser = { ...result };
    delete safeUser.password;
    delete safeUser.otp;
    delete safeUser.otpGeneratedAt;

    // send welcome email with credentials (try/catch to avoid failing the request)
    (async () => {
      try {
        if (safeUser.email) {
          const from = process.env.GMAIL_EMAIL || 'no-reply@example.com';
          const to = safeUser.email;
          const sub = `Welcome to RetailIQ!`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Welcome to RetailIQ</h2>
              <p>Hi ${safeUser.firstname},</p>
              <p>Your supplier account has been created by an administrator.</p>
              <p><strong>Login email:</strong> ${safeUser.email}</p>
              <p><strong>Temporary password:</strong> ${req.body.password || '12345678'}</p>
              <p>Please log in and change your password immediately.</p>
              <hr/>
              <p style="font-size: 12px; color: #666;">RetailIQ - Smart Retail Analytics Platform</p>
            </div>
          `;
          await emailService(from, to, sub, html);
        }
      } catch (mailErr) {
        console.error('failed to send supplier welcome email', mailErr);
      }
    })();

    return res.status(201).json({
      message: 'Supplier created successfully',
      supplier: safeUser,
    });
  } catch (err) {
    console.error('create supplier error', err);
    return res.status(500).json({ message: 'Failed to create supplier' });
  }
};

// ------------------- STORE MANAGERS (store_owner) MANAGEMENT -------------------

/**
 * List store managers with pagination, search, sort
 */
exports.listStoreManagers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;
    const sort = req.query.sort || 'created_at';
    const order = (req.query.order || 'desc').toUpperCase();

    const validSortFields = ['created_at', 'firstname', 'lastname', 'email'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortCol = `users.${sortField}`;
    const orderDir = order === 'DESC' ? 'desc' : 'asc';

    let query = db('users').select('id', 'firstname', 'lastname', 'email', 'phone', 'created_at', 'is_active').where('role', 'store_manager');

    if (search) {
      query = query.where(function () {
        this.where('firstname', 'like', `%${search}%`)
          .orWhere('lastname', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`)
          .orWhere('phone', 'like', `%${search}%`);
      });
    }

    const countQuery = query.clone();
    const countResult = await countQuery.clearSelect().clearOrder().count({ count: 'users.id' }).first();
    const total = Number(countResult.count || 0);

    const managers = await query.orderBy(sortCol, orderDir).limit(limit).offset(offset);

    return res.json({ managers, total, limit, offset });
  } catch (err) {
    console.error('list store managers error', err);
    return res.status(500).json({ message: 'Failed to load store managers' });
  }
}

/**
 * Simple list of store managers (id/name) for select dropdowns
 */
exports.listStoreManagersSimple = async (req, res) => {
  try {
    const onlyActive = req.query.active === '1' || req.query.active === 'true';
    let query = db('users').select('id', 'firstname', 'lastname').where('role', 'store_manager');
    if (onlyActive) query = query.andWhere('is_active', true);
    const list = await query.orderBy('firstname', 'asc');
    const formatted = list.map((r) => ({ id: r.id, name: `${r.firstname} ${r.lastname}` }));
    return res.json({ managers: formatted });
  } catch (err) {
    console.error('list store managers simple error', err);
    return res.status(500).json({ message: 'Failed to load store managers' });
  }
}

/**
 * Create a new store manager (admin action)
 */
exports.createStoreManager = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { firstname, lastname, email, phone, password } = req.body;

    if (!firstname || !firstname.trim()) return res.status(400).json({ errors: [{ field: 'firstname', msg: 'First name is required' }] });
    if (!lastname || !lastname.trim()) return res.status(400).json({ errors: [{ field: 'lastname', msg: 'Last name is required' }] });
    if (!email || !email.includes('@')) return res.status(400).json({ errors: [{ field: 'email', msg: 'Valid email is required' }] });
    if (!phone || phone.length < 7) return res.status(400).json({ errors: [{ field: 'phone', msg: 'Valid phone is required' }] });

    // Check uniqueness
    const existingEmail = await db('users').where({ email }).first();
    if (existingEmail) return res.status(409).json({ errors: [{ field: 'email', msg: 'Email already exists' }] });
    const existingPhone = await db('users').where({ phone }).first();
    if (existingPhone) return res.status(409).json({ errors: [{ field: 'phone', msg: 'Phone already exists' }] });

    const rawPassword = password && password.length >= 8 ? password : '12345678';
    const hashed = await bcrypt.hash(rawPassword, 10);

    const userId = await db.transaction(async (trx) => {
      const [id] = await trx('users').insert({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: hashed,
        role: 'store_manager',
        is_active: true,
      });
      return id;
    });

    const user = await db('users').where({ id: userId }).first();
    const safeUser = { ...user };
    delete safeUser.password; delete safeUser.otp; delete safeUser.otpGeneratedAt;

    // send welcome email
    (async () => {
      try {
        if (safeUser.email) {
          const from = process.env.GMAIL_EMAIL || 'no-reply@example.com';
          const to = safeUser.email;
          const sub = `Welcome to RetailIQ as Store Manager`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Welcome to RetailIQ</h2>
              <p>Hi ${safeUser.firstname},</p>
              <p>Your store manager account has been created by an administrator.</p>
              <p><strong>Login email:</strong> ${safeUser.email}</p>
              <p><strong>Temporary password:</strong> ${rawPassword}</p>
              <p>Please log in and change your password immediately.</p>
              <hr/>
              <p style="font-size: 12px; color: #666;">RetailIQ - Smart Retail Analytics Platform</p>
            </div>
          `;
          await emailService(from, to, sub, html);
        }
      } catch (mailErr) {
        console.error('failed to send store manager welcome email', mailErr);
      }
    })();

    return res.status(201).json({ message: 'Store manager created successfully', manager: safeUser });
  } catch (err) {
    console.error('create store manager error', err);
    return res.status(500).json({ message: 'Failed to create store manager' });
  }
}

/**
 * Update a store manager
 */
exports.updateStoreManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, email, phone, is_active } = req.body;

    const existing = await db('users').where({ id, role: 'store_manager' }).first();
    if (!existing) return res.status(404).json({ message: 'Store manager not found' });

    // email/phone uniqueness checks
    if (email && email !== existing.email) {
      const clash = await db('users').where({ email }).andWhereNot({ id }).first();
      if (clash) return res.status(409).json({ errors: [{ field: 'email', msg: 'Email already exists' }] });
    }
    if (phone && phone !== existing.phone) {
      const clash = await db('users').where({ phone }).andWhereNot({ id }).first();
      if (clash) return res.status(409).json({ errors: [{ field: 'phone', msg: 'Phone already exists' }] });
    }

    const payload = {};
    if (firstname !== undefined) payload.firstname = firstname.trim();
    if (lastname !== undefined) payload.lastname = lastname.trim();
    if (email !== undefined) payload.email = email.trim();
    if (phone !== undefined) payload.phone = phone.trim();
    if (is_active !== undefined) payload.is_active = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';

    await db('users').where({ id }).update(payload);
    const updated = await db('users').where({ id }).first();
    delete updated.password; delete updated.otp; delete updated.otpGeneratedAt;

    return res.json({ manager: updated });
  } catch (err) {
    console.error('update store manager error', err);
    return res.status(500).json({ message: 'Failed to update store manager' });
  }
}

/**
 * Delete a store manager (only if not owning stores or referenced records)
 */
exports.deleteStoreManager = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db('users').where({ id, role: 'store_manager' }).first();
    if (!user) return res.status(404).json({ message: 'Store manager not found' });

    // Check if manager owns stores
    const storeCount = await db('stores').where({ owner_id: id }).count('id as count').first();
    if (Number(storeCount.count || 0) > 0) {
      return res.status(400).json({ message: 'Cannot delete manager: they own one or more stores. Reassign or delete stores first.' });
    }

    await db('users').where({ id }).del();
    return res.json({ message: 'Store manager deleted' });
  } catch (err) {
    console.error('delete store manager error', err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ message: 'Cannot delete manager: referenced by other records.' });
    }
    return res.status(500).json({ message: 'Failed to delete store manager' });
  }
}

exports.listCustomerOrders = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;
    const status = req.query.status;
    const sort = req.query.sort || 'created_at';
    const order = (req.query.order || 'desc').toUpperCase();

    // Validate sort field
    const validSortFields = ['created_at', 'total_amount', 'order_no', 'status', 'payment_status'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortCol = `customer_orders.${sortField}`;
    const orderDir = order === 'DESC' ? 'desc' : 'asc';

    let query = db('customer_orders')
      .select(
        'customer_orders.*',
        'users.firstname',
        'users.lastname',
        'users.email as customer_email',
        'stores.name as store_name'
      )
      .leftJoin('users', 'customer_orders.cust_id', 'users.id')
      .leftJoin('stores', 'customer_orders.store_id', 'stores.id');

    if (search) {
      query = query.where(function () {
        this.where('customer_orders.order_no', 'like', `%${search}%`)
          .orWhere('users.firstname', 'like', `%${search}%`)
          .orWhere('users.lastname', 'like', `%${search}%`)
          .orWhere('users.email', 'like', `%${search}%`);
      });
    }

    if (status) {
      query = query.where('customer_orders.status', status);
    }

    const countQuery = query.clone();
    const countResult = await countQuery
      .clearSelect()
      .clearOrder()
      .count({ count: 'customer_orders.id' })
      .first();

    const total = Number(countResult.count || 0);

    const orders = await query
      .orderBy(sortCol, orderDir)
      .limit(limit)
      .offset(offset);

    return res.json({ orders, total, limit, offset });
  } catch (err) {
    console.error('list customer orders error', err);
    return res.status(500).json({ message: 'Failed to load customer orders' });
  }
};

// Get single order details (items + metadata)
exports.getCustomerOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db('customer_orders')
      .where({ id })
      .first();

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const items = await db('customer_order_items')
      .select(
        'customer_order_items.*',
        'products.name as product_name',
        'products.images as product_images',
        'users.firstname as customer_firstname',
        'users.lastname as customer_lastname'
      )
      .join(
        'products',
        'customer_order_items.product_id',
        'products.id'
      )
      .join(
        'customer_orders',
        'customer_order_items.customer_order_id',
        'customer_orders.id'
      )
      .join(
        'users',
        'customer_orders.cust_id',
        'users.id'
      )
      .where('customer_order_items.customer_order_id', id);


    return res.json({ order, items });
  } catch (err) {
    console.error('get order details error', err);
    return res.status(500).json({ message: 'Failed to load order details' });
  }
}

// Update order status and notify customer
exports.updateCustomerOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'processing', 'completed', 'cancelled', 'returned', 'shipped'];

    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const order = await db('customer_orders').where({ id }).first();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await db('customer_orders').where({ id }).update({ status });

    // Notify customer if email exists
    if (order.cust_id) {
      const user = await db('users').where({ id: order.cust_id }).first();
      if (user && user.email) {
        const from = process.env.GMAIL_EMAIL || 'no-reply@example.com';
        const to = user.email;
        const sub = `Your order ${order.order_no} status updated to ${status}`;
        const html = `
          <p>Hi ${user.firstname},</p>
          <p>Your order <strong>${order.order_no}</strong> status has been updated to <strong>${status}</strong>.</p>
          <p>Thank you for shopping with RetailIQ.</p>
        `;
        try {
          await emailService(from, to, sub, html);
        } catch (mailErr) {
          console.error('failed to send order status email', mailErr);
        }
      }
    }

    return res.json({ message: 'Order status updated', status });
  } catch (err) {
    console.error('update order status error', err);
    return res.status(500).json({ message: 'Failed to update order status' });
  }
}

// Deactivate user and send notification email
exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db('users').where({ id }).first();
    if (!user) return res.status(404).json({ message: 'User not found' });

    await db('users').where({ id }).update({ is_active: false });

    // send deactivation email
    if (user.email) {
      const from = process.env.GMAIL_EMAIL || 'no-reply@example.com';
      const to = user.email;
      const sub = `Your RetailIQ account has been deactivated`;
      const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p style="color: #666; font-size: 14px;">Hi ${user.firstName},</p>
          <p style="color: #666; font-size: 14px;">
        <p>Your account has been deactivated by our support team. If you believe this is a mistake, please contact support.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            RetailIQ - Smart Retail Analytics Platform
          </p>
        </div>
      </div>
    `;
      try {
        await emailService(from, to, sub, html);
      } catch (mailErr) {
        console.error('failed to send deactivation email', mailErr);
      }
    }

    return res.json({ message: 'User deactivated' });
  } catch (err) {
    console.error('deactivate user error', err);
    return res.status(500).json({ message: 'Failed to deactivate user' });
  }
}

// Reactivate user and notify
exports.reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db('users').where({ id }).first();
    if (!user) return res.status(404).json({ message: 'User not found' });

    await db('users').where({ id }).update({ is_active: true });

    if (user.email) {
      const from = process.env.GMAIL_EMAIL || 'no-reply@example.com';
      const to = user.email;
      const sub = `Your RetailIQ account has been reactivated`;
      const html = `
        <p>Hi ${user.firstname},</p>
        <p>Your account has been reactivated. You can now log in again.</p>
      `;
      try {
        await emailService(from, to, sub, html);
      } catch (mailErr) {
        console.error('failed to send reactivation email', mailErr);
      }
    }

    return res.json({ message: 'User reactivated' });
  } catch (err) {
    console.error('reactivate user error', err);
    return res.status(500).json({ message: 'Failed to reactivate user' });
  }
}

exports.listSupplierOrders = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;
    const status = req.query.status;

    let query = db('supply_orders')
      .select(
        'supply_orders.*',
        'suppliers.name as supplier_name',
        'suppliers.email as supplier_email',
        'stores.name as store_name',
        'users.firstname as ordered_by_firstname',
        'users.lastname as ordered_by_lastname'
      )
      .leftJoin('suppliers', 'supply_orders.supplier_id', 'suppliers.id')
      .leftJoin('stores', 'supply_orders.store_id', 'stores.id')
      .leftJoin('users', 'supply_orders.ordered_by', 'users.id');

    if (search) {
      query = query.where(function () {
        this.where('supply_orders.order_no', 'like', `%${search}%`)
          .orWhere('suppliers.name', 'like', `%${search}%`)
          .orWhere('stores.name', 'like', `%${search}%`);
      });
    }

    if (status) {
      query = query.where('supply_orders.status', status);
    }

    const countQuery = query.clone();
    const countResult = await countQuery
      .clearSelect()
      .clearOrder()
      .count({ count: 'supply_orders.id' })
      .first();

    const total = Number(countResult.count || 0);

    const orders = await query
      .orderBy('supply_orders.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return res.json({ orders, total, limit, offset });
  } catch (err) {
    console.error('list supplier orders error', err);
    return res.status(500).json({ message: 'Failed to load supplier orders' });
  }
};

exports.listProducts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const categoryId = req.query.category_id;
    const search = req.query.search;
    const sort = req.query.sort || 'created_at';
    const order = (req.query.order || 'desc').toUpperCase();

    // Validate sort field
    const validSortFields = ['name', 'sell_price', 'cost_price', 'created_at', 'stock_available'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortCol = sortField === 'price' || sortField === 'sell_price' ? 'products.sell_price' : `products.${sortField}`;
    const orderDir = order === 'DESC' ? 'desc' : 'asc';

    let query = db('products')
      .select(
        'products.id',
        'products.name',
        'products.description',
        'products.category_id',
        'products.supplier_id',
        'products.cost_price',
        'products.sell_price',
        'products.stock_available',
        'products.images',
        'products.created_at',
        'categories.name as category_name'
      )
      .leftJoin('categories', 'products.category_id', 'categories.id');

    // Apply filters
    if (categoryId) {
      query = query.where('products.category_id', categoryId);
    }
    if (search) {
      query = query.where('products.name', 'like', `%${search}%`);
    }

    // Count total before pagination
    const countQuery = query.clone();
    const countResult = await countQuery
      .clearSelect()
      .clearOrder()
      .count({ count: 'products.id' })
      .first();

    const total = Number(countResult.count || 0);

    // Apply sorting and pagination
    const products = await query
      .orderBy(sortCol, orderDir)
      .limit(limit)
      .offset(offset);

    // Parse images JSON for each product
    const formattedProducts = products.map((p) => ({
      ...p,
      images: normalizeImages(p.images),
    }));

    return res.json({ products: formattedProducts, total, limit, offset });
  } catch (err) {
    console.error('list products error', err);
    return res.status(500).json({ message: 'Failed to load products' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, category_id, supplier_id, cost_price, sell_price, stock_available } = req.body;

    // assemble images array from either uploaded files, base64 payloads, or JSON in body
    let imagesArray = [];
    if (req.files && req.files.length) {
      imagesArray = req.files.map((f) => `media/products/${f.filename}`);
    } else {
      let incoming = req.body.images;
      if (typeof incoming === 'string' && incoming.trim().length) {
        try {
          incoming = JSON.parse(incoming);
        } catch (e) {
          // leave as string
        }
      }

      if (Array.isArray(incoming) && incoming.some((it) => typeof it === 'string' && it.startsWith('data:image'))) {
        const saved = await saveBase64Images(incoming, name);
        imagesArray = imagesArray.concat(saved);
      } else {
        imagesArray = normalizeImages(incoming);
      }
    }

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ errors: [{ field: 'name', msg: 'Product name is required' }] });
    }
    if (!sell_price) {
      return res.status(400).json({ errors: [{ field: 'sell_price', msg: 'Selling price is required' }] });
    }
    if (!Array.isArray(imagesArray)) {
      return res.status(400).json({ errors: [{ field: 'images', msg: 'Images must be an array' }] });
    }
    if (imagesArray.length > 5) {
      return res.status(400).json({ errors: [{ field: 'images', msg: 'Maximum 5 images allowed' }] });
    }

    // Check if product name already exists
    const existing = await db('products').where({ name: name.trim() }).first();
    if (existing) {
      return res.status(409).json({ errors: [{ field: 'name', msg: 'Product name already exists' }] });
    }

    // Insert and then fetch the inserted row (MySQL-friendly)
    const insertPayload = {
      name: name.trim(),
      description: description || null,
      category_id: category_id || null,
      supplier_id: supplier_id || null,
      cost_price: cost_price || 0,
      sell_price,
      stock_available: stock_available || 0,
      images: JSON.stringify(imagesArray || []),
    };

    const [insertedId] = await db('products').insert(insertPayload);
    const product = await db('products').where({ id: insertedId }).first();

    const formatted = {
      ...product,
      images: product && product.images ? normalizeImages(product.images) : [],
    };

    return res.status(201).json({ product: formatted });
  } catch (err) {
    console.error('create product error', err);
    return res.status(500).json({ message: 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, supplier_id, cost_price, sell_price, stock_available } = req.body;

    if (!id) {
      return res.status(400).json({ errors: [{ field: 'id', msg: 'Product ID required' }] });
    }

    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // assemble images array similar to create
    let imagesArray;
    if (req.files && req.files.length) {
      imagesArray = req.files.map((f) => `media/products/${f.filename}`);
    } else {
      let incoming = req.body.images;
      if (typeof incoming === 'string' && incoming.trim().length) {
        try {
          incoming = JSON.parse(incoming);
        } catch (e) {
          // ignore parse error
        }
      }

      if (Array.isArray(incoming) && incoming.some((it) => typeof it === 'string' && it.startsWith('data:image'))) {
        const saved = await saveBase64Images(incoming, name || product.name);
        imagesArray = saved;
      } else if (incoming !== undefined) {
        imagesArray = normalizeImages(incoming);
      }
      // else imagesArray stays undefined -> means do not change images
    }

    // Validation
    if (name && !name.trim()) {
      return res.status(400).json({ errors: [{ field: 'name', msg: 'Product name cannot be empty' }] });
    }
    if (imagesArray !== undefined && !Array.isArray(imagesArray)) {
      return res.status(400).json({ errors: [{ field: 'images', msg: 'Images must be an array' }] });
    }
    if (imagesArray && imagesArray.length > 5) {
      return res.status(400).json({ errors: [{ field: 'images', msg: 'Maximum 5 images allowed' }] });
    }

    // Check name uniqueness (excluding current product)
    if (name && name.trim() !== product.name) {
      const existing = await db('products').where({ name: name.trim() }).andWhereNot({ id }).first();
      if (existing) {
        return res.status(409).json({ errors: [{ field: 'name', msg: 'Product name already exists' }] });
      }
    }

    // Build update payload
    const updatePayload = {
      name: name !== undefined ? (name ? name.trim() : name) : product.name,
      description: description !== undefined ? description : product.description,
      category_id: category_id !== undefined ? category_id : product.category_id,
      supplier_id: supplier_id !== undefined ? supplier_id : product.supplier_id,
      cost_price: cost_price !== undefined ? cost_price : product.cost_price,
      sell_price: sell_price !== undefined ? sell_price : product.sell_price,
      stock_available: stock_available !== undefined ? stock_available : product.stock_available,
      images: imagesArray !== undefined ? JSON.stringify(imagesArray) : product.images,
    };

    // Perform update
    const updatedCount = await db('products').where({ id }).update(updatePayload);

    if (!updatedCount) {
      return res.status(500).json({ message: 'Failed to update product' });
    }

    // Fetch the updated product
    const updated = await db('products').where({ id }).first();
    const formatted = {
      ...updated,
      images: updated.images ? normalizeImages(updated.images) : [],
    };

    return res.json({ product: formatted });
  } catch (err) {
    console.error('update product error', err);
    return res.status(500).json({ message: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ errors: [{ field: 'id', msg: 'Product ID required' }] });
    }

    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const deleted = await db('products').where({ id }).del();
    if (deleted) {
      return res.json({ message: 'Product deleted successfully' });
    } else {
      return res.status(500).json({ message: 'Failed to delete product' });
    }
  } catch (err) {
    console.error('delete product error', err);
    return res.status(500).json({ message: 'Failed to delete product' });
  }
}

exports.sendAssuranceEmail = async (req, res) => {

  try {
    const id = req.params.id;
    console.log(`feedback id is ${id}`);

    //fetch single feedback by id, with user info
    const feedback = await db('feedbacks')
      .join('users', 'feedbacks.cust_id', 'users.id')
      .where('feedbacks.id', id)
      .select(
        'feedbacks.id',
        'feedbacks.message',
        'feedbacks.created_at',
        'users.firstname as firstname',
        'users.lastname as lastname',
        'users.email as user_email'
      )
      .first(); // important: get single row (object) or undefined


    if (!feedback)
      return res.status(500).json({ message: "feedback not found.." })

    // defensive check: ensure recipient exists
    const from = process.env.GMAIL_EMAIL || 'no-reply@example.com';
    const to = feedback.user_email;
    if (!to) {
      console.error('No recipient email found for feedback id', id);
      return res.status(400).json({ message: "Recipient email not available." });
    }
    const sub = "Your Feedback Has Been Received - RetailIQ";
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">✓ Feedback Received</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">We're actively working on your feedback</p>
        </div>

        <!-- Content -->
        <div style="background-color: #ffffff; padding: 30px 20px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">Hi ${feedback.firstname},</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; border-radius: 4px; margin: 20px 0;">
            <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0;">
              Thank you for sharing your valuable feedback with RetailIQ. We truly appreciate you taking the time to help us improve our platform. 
              Your insights are important to us and help us deliver better solutions.
            </p>
          </div>

          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <h3 style="color: #667eea; font-size: 14px; margin: 0 0 10px 0;">What happens next?</h3>
            <ul style="color: #555; font-size: 14px; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Our team has received your feedback and is reviewing it</li>
              <li style="margin-bottom: 8px;">We're analyzing the suggestions and potential improvements</li>
              <li>You can expect updates or improvements based on your feedback</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            If you have any urgent concerns or additional information to share, please feel free to contact our support team.
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            Your Feedback message was: ${feedback.message}
          </p>

          <!-- Footer -->
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
              <strong>RetailIQ</strong> - Smart Retail Analytics Platform<br/>
              We're committed to delivering excellence
            </p>
            <p style="color: #bbb; font-size: 11px; margin: 10px 0 0 0; text-align: center;">
              © 2024 RetailIQ. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    await emailService(from, to, sub, htmlContent)
    return res.json({ message: "Assurance sent..." })
  }
  catch (err) {
    console.error("failed to fetch users", err);
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ==================== STORES MANAGEMENT ====================

/**
 * List stores with pagination, search, sort, and filter
 */
exports.listStores = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;
    const isActive = req.query.is_active; // filter by active status
    const sort = req.query.sort || 'created_at';
    const order = (req.query.order || 'desc').toUpperCase();

    // Validate sort field
    const validSortFields = ['name', 'created_at', 'rating', 'address'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortCol = `stores.${sortField}`;
    const orderDir = order === 'DESC' ? 'desc' : 'asc';

    let query = db('stores')
      .select(
        'stores.*',
        'users.firstname as owner_firstname',
        'users.lastname as owner_lastname',
        'users.email as owner_email'
      )
      .leftJoin('users', 'stores.owner_id', 'users.id');

    // Apply search filter
    if (search) {
      query = query.where(function () {
        this.where('stores.name', 'like', `%${search}%`)
          .orWhere('stores.address', 'like', `%${search}%`)
          .orWhere('stores.phone', 'like', `%${search}%`);
      });
    }

    // Apply active status filter
    if (isActive !== undefined && isActive !== '') {
      const activeBool = isActive === 'true' || isActive === '1' || isActive === true;
      query = query.where('stores.is_active', activeBool);
    }

    // Get total count
    const countQuery = query.clone();
    const countResult = await countQuery
      .clearSelect()
      .clearOrder()
      .count({ count: 'stores.id' })
      .first();

    const total = Number(countResult.count || 0);

    // Apply sorting and pagination
    const stores = await query
      .orderBy(sortCol, orderDir)
      .limit(limit)
      .offset(offset);

    return res.json({ stores, total, limit, offset });
  } catch (err) {
    console.error('list stores error', err);
    return res.status(500).json({ message: 'Failed to load stores' });
  }
};

/**
 * Create new store
 */
exports.createStore = async (req, res) => {
  try {
    const { name, address, phone, owner_id, rating } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ errors: [{ field: 'name', msg: 'Store name is required' }] });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ errors: [{ field: 'address', msg: 'Store address is required' }] });
    }

    // Check if store name already exists
    const existingName = await db('stores').where({ name: name.trim() }).first();
    if (existingName) {
      return res.status(409).json({ errors: [{ field: 'name', msg: 'Store name already exists' }] });
    }

    // Check if phone already exists (if provided)
    if (phone && phone.trim()) {
      const existingPhone = await db('stores').where({ phone: phone.trim() }).first();
      if (existingPhone) {
        return res.status(409).json({ errors: [{ field: 'phone', msg: 'Phone number already exists' }] });
      }
    }

    // Validate owner_id if provided
    if (owner_id) {
      const owner = await db('users').where({ id: owner_id }).first();
      if (!owner) {
        return res.status(404).json({ errors: [{ field: 'owner_id', msg: 'Owner not found' }] });
      }
    }

    // Validate rating if provided (1-5)
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ errors: [{ field: 'rating', msg: 'Rating must be between 1 and 5' }] });
      }
    }

    // Insert store
    const [storeId] = await db('stores').insert({
      name: name.trim(),
      address: address.trim(),
      phone: phone ? phone.trim() : null,
      owner_id: owner_id || null,
      rating: rating ? parseFloat(rating) : null,
      is_active: true,
    });

    // Fetch created store with owner details
    const store = await db('stores')
      .select(
        'stores.*',
        'users.firstname as owner_firstname',
        'users.lastname as owner_lastname',
        'users.email as owner_email'
      )
      .leftJoin('users', 'stores.owner_id', 'users.id')
      .where('stores.id', storeId)
      .first();

    return res.status(201).json({ store });
  } catch (err) {
    console.error('create store error', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ errors: [{ field: 'name', msg: 'Store name or phone already exists' }] });
    }
    return res.status(500).json({ message: 'Failed to create store' });
  }
};

/**
 * Update store
 */
exports.updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, owner_id, rating, is_active } = req.body;

    // Check if store exists
    const existing = await db('stores').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Validate name uniqueness (excluding current store)
    if (name && name.trim() !== existing.name) {
      const nameClash = await db('stores').where({ name: name.trim() }).andWhereNot({ id }).first();
      if (nameClash) {
        return res.status(409).json({ errors: [{ field: 'name', msg: 'Store name already exists' }] });
      }
    }

    // Validate phone uniqueness (excluding current store)
    if (phone && phone.trim() && phone.trim() !== existing.phone) {
      const phoneClash = await db('stores').where({ phone: phone.trim() }).andWhereNot({ id }).first();
      if (phoneClash) {
        return res.status(409).json({ errors: [{ field: 'phone', msg: 'Phone number already exists' }] });
      }
    }

    // Validate owner_id if provided
    if (owner_id !== undefined && owner_id !== null) {
      if (owner_id) {
        const owner = await db('users').where({ id: owner_id }).first();
        if (!owner) {
          return res.status(404).json({ errors: [{ field: 'owner_id', msg: 'Owner not found' }] });
        }
      }
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ errors: [{ field: 'rating', msg: 'Rating must be between 1 and 5' }] });
      }
    }

    // Build update payload
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (address !== undefined) updatePayload.address = address.trim();
    if (phone !== undefined) updatePayload.phone = phone ? phone.trim() : null;
    if (owner_id !== undefined) updatePayload.owner_id = owner_id || null;
    if (rating !== undefined) updatePayload.rating = rating ? parseFloat(rating) : null;
    if (is_active !== undefined) updatePayload.is_active = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';

    // Perform update
    await db('stores').where({ id }).update(updatePayload);

    // Fetch updated store with owner details
    const updated = await db('stores')
      .select(
        'stores.*',
        'users.firstname as owner_firstname',
        'users.lastname as owner_lastname',
        'users.email as owner_email'
      )
      .leftJoin('users', 'stores.owner_id', 'users.id')
      .where('stores.id', id)
      .first();

    return res.json({ store: updated });
  } catch (err) {
    console.error('update store error', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ errors: [{ field: 'name', msg: 'Store name or phone already exists' }] });
    }
    return res.status(500).json({ message: 'Failed to update store' });
  }
};

/**
 * Delete store
 */
exports.deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if store exists
    const store = await db('stores').where({ id }).first();
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if store has associated orders (soft check - you might want to prevent deletion if orders exist)
    const orderCount = await db('customer_orders').where({ store_id: id }).count('id as count').first();
    const orderCountNum = Number(orderCount.count || 0);

    if (orderCountNum > 0) {
      return res.status(400).json({
        message: `Cannot delete store. It has ${orderCountNum} associated order(s). Deactivate the store instead.`,
      });
    }

    // Delete store
    await db('stores').where({ id }).del();

    return res.json({ message: 'Store deleted successfully' });
  } catch (err) {
    console.error('delete store error', err);
    // Check for foreign key constraint violations
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        message: 'Cannot delete store. It is referenced by other records. Deactivate the store instead.',
      });
    }
    return res.status(500).json({ message: 'Failed to delete store' });
  }
};

/**
 * Get single store details
 */
exports.getStoreDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await db('stores')
      .select(
        'stores.*',
        'users.firstname as owner_firstname',
        'users.lastname as owner_lastname',
        'users.email as owner_email'
      )
      .leftJoin('users', 'stores.owner_id', 'users.id')
      .where('stores.id', id)
      .first();

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    return res.json({ store });
  } catch (err) {
    console.error('get store details error', err);
    return res.status(500).json({ message: 'Failed to load store details' });
  }
};