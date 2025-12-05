const db = require('../config/db');
const fs = require('fs');
const path = require('path');

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

exports.listProducts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;
    const filters = {
      category_id: req.query.category_id,
      search: req.query.search,
    };

    // const products = await Products.listAll(limit, offset, filters);
    const products = await db('products')
      .select('id', 'name', 'sell_price', 'created_at', 'images') // only what you really need
      .limit(limit)
      .offset(offset)
      .orderBy('created_at', 'desc');

    // const total = await Products.count();
    const total = await db('products').count('id as count').first();

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