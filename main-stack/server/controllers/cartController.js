const db = require('../config/db');

/**
 * Get or create cart for user
 */
async function getOrCreateCart(userId) {
  let cart = await db('customer_carts').where({ cust_id: userId }).first();

  if (!cart) {
    const [cartId] = await db('customer_carts').insert({ cust_id: userId });
    cart = await db('customer_carts').where({ id: cartId }).first();
  }

  return cart;
}

/**
 * Normalize images from database
 */
function normalizeImages(images) {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images === 'object') return images;
  if (typeof images === 'string') {
    const trimmed = images.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        return [trimmed];
      }
    }
    return [trimmed];
  }
  return [];
}

/**
 * Get cart items with product details
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get or create cart
    const cart = await getOrCreateCart(userId);

    // Get cart items with product details
    const cartItems = await db('customer_cart_items')
      .where({ cart_id: cart.id })
      .join('products', 'customer_cart_items.product_id', 'products.id')
      .select(
        'customer_cart_items.id as cartItemId',
        'customer_cart_items.product_id',
        'customer_cart_items.qty',
        'customer_cart_items.unit_price',
        'customer_cart_items.total_amount',
        'products.*'
      );

    // Format items with normalized images
    const items = cartItems.map(item => ({
      cartItemId: item.cartItemId,
      product_id: item.product_id,
      qty: item.qty,
      unit_price: parseFloat(item.unit_price) || 0,
      total_amount: parseFloat(item.total_amount) || 0,
      id: item.id,
      name: item.name,
      description: item.description,
      sell_price: parseFloat(item.sell_price) || 0,
      cost_price: parseFloat(item.cost_price) || 0,
      stock: item.stock,
      category_id: item.category_id,
      supplier_id: item.supplier_id,
      images: normalizeImages(item.images)[0],
      created_at: item.created_at,
    }));
    // console.log()
    return res.json({ items, count: items.length });
  } catch (err) {
    console.error('getCart error:', err);
    return res.status(500).json({ message: 'Failed to fetch cart' });
  }
};

/**
 * Add item to cart
 */
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Get product details
    const product = await db('products').where({ id: productId }).first();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get or create cart
    const cart = await getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await db('customer_cart_items')
      .where({ cart_id: cart.id, product_id: productId })
      .first();

    const unitPrice = parseFloat(product.sell_price) || 0;
    const qty = parseInt(quantity) || 1;
    const totalAmount = unitPrice * qty;

    if (existingItem) {
      // Update existing item quantity
      const newQty = existingItem.qty + qty;
      const newTotalAmount = unitPrice * newQty;

      await db('customer_cart_items')
        .where({ id: existingItem.id })
        .update({
          qty: newQty,
          total_amount: newTotalAmount,
        });

      // Return updated cart
      const cartItems = await db('customer_cart_items')
        .where({ cart_id: cart.id })
        .join('products', 'customer_cart_items.product_id', 'products.id')
        .select(
          'customer_cart_items.id as cartItemId',
          'customer_cart_items.product_id',
          'customer_cart_items.qty',
          'customer_cart_items.unit_price',
          'customer_cart_items.total_amount',
          'products.*'
        );

      const items = cartItems.map(item => ({
        cartItemId: item.cartItemId,
        product_id: item.product_id,
        qty: item.qty,
        unit_price: parseFloat(item.unit_price) || 0,
        total_amount: parseFloat(item.total_amount) || 0,
        id: item.id,
        name: item.name,
        description: item.description,
        sell_price: parseFloat(item.sell_price) || 0,
        cost_price: parseFloat(item.cost_price) || 0,
        stock: item.stock,
        category_id: item.category_id,
        supplier_id: item.supplier_id,
        images: normalizeImages(item.images),
        created_at: item.created_at,
      }));

      return res.json({ items, count: items.length });
    } else {
      // Add new item
      await db('customer_cart_items').insert({
        cart_id: cart.id,
        product_id: productId,
        qty: qty,
        unit_price: unitPrice,
        total_amount: totalAmount,
      });

      // Return updated cart
      const cartItems = await db('customer_cart_items')
        .where({ cart_id: cart.id })
        .join('products', 'customer_cart_items.product_id', 'products.id')
        .select(
          'customer_cart_items.id as cartItemId',
          'customer_cart_items.product_id',
          'customer_cart_items.qty',
          'customer_cart_items.unit_price',
          'customer_cart_items.total_amount',
          'products.*'
        );

      const items = cartItems.map(item => ({
        cartItemId: item.cartItemId,
        product_id: item.product_id,
        qty: item.qty,
        unit_price: parseFloat(item.unit_price) || 0,
        total_amount: parseFloat(item.total_amount) || 0,
        id: item.id,
        name: item.name,
        description: item.description,
        sell_price: parseFloat(item.sell_price) || 0,
        cost_price: parseFloat(item.cost_price) || 0,
        stock: item.stock,
        category_id: item.category_id,
        supplier_id: item.supplier_id,
        images: normalizeImages(item.images),
        created_at: item.created_at,
      }));

      return res.json({ items, count: items.length });
    }
  } catch (err) {
    console.error('addToCart error:', err);
    return res.status(500).json({ message: 'Failed to add item to cart' });
  }
};

/**
 * Remove item from cart
 */
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cartItemId } = req.params;

    if (!cartItemId) {
      return res.status(400).json({ message: 'Cart item ID is required' });
    }

    // Get user's cart
    const cart = await db('customer_carts').where({ cust_id: userId }).first();
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Verify item belongs to user's cart
    const cartItem = await db('customer_cart_items')
      .where({ id: cartItemId, cart_id: cart.id })
      .first();

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Delete item
    await db('customer_cart_items').where({ id: cartItemId }).del();

    // Return updated cart
    const cartItems = await db('customer_cart_items')
      .where({ cart_id: cart.id })
      .join('products', 'customer_cart_items.product_id', 'products.id')
      .select(
        'customer_cart_items.id as cartItemId',
        'customer_cart_items.product_id',
        'customer_cart_items.qty',
        'customer_cart_items.unit_price',
        'customer_cart_items.total_amount',
        'products.*'
      );

    const items = cartItems.map(item => ({
      cartItemId: item.cartItemId,
      product_id: item.product_id,
      qty: item.qty,
      unit_price: parseFloat(item.unit_price) || 0,
      total_amount: parseFloat(item.total_amount) || 0,
      id: item.id,
      name: item.name,
      description: item.description,
      sell_price: parseFloat(item.sell_price) || 0,
      cost_price: parseFloat(item.cost_price) || 0,
      stock: item.stock,
      category_id: item.category_id,
      supplier_id: item.supplier_id,
      images: normalizeImages(item.images),
      created_at: item.created_at,
    }));

    return res.json({ items, count: items.length });
  } catch (err) {
    console.error('removeFromCart error:', err);
    return res.status(500).json({ message: 'Failed to remove item from cart' });
  }
};

/**
 * Update cart item quantity
 */
exports.updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!cartItemId) {
      return res.status(400).json({ message: 'Cart item ID is required' });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Get user's cart
    const cart = await db('customer_carts').where({ cust_id: userId }).first();
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Get cart item
    const cartItem = await db('customer_cart_items')
      .where({ id: cartItemId, cart_id: cart.id })
      .first();

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Get product to recalculate total
    const product = await db('products').where({ id: cartItem.product_id }).first();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const unitPrice = parseFloat(product.sell_price) || 0;
    const qty = parseInt(quantity) || 1;
    const totalAmount = unitPrice * qty;

    // Update quantity and total
    await db('customer_cart_items')
      .where({ id: cartItemId })
      .update({
        qty: qty,
        total_amount: totalAmount,
      });

    // Return updated cart
    const cartItems = await db('customer_cart_items')
      .where({ cart_id: cart.id })
      .join('products', 'customer_cart_items.product_id', 'products.id')
      .select(
        'customer_cart_items.id as cartItemId',
        'customer_cart_items.product_id',
        'customer_cart_items.qty',
        'customer_cart_items.unit_price',
        'customer_cart_items.total_amount',
        'products.*'
      );

    const items = cartItems.map(item => ({
      cartItemId: item.cartItemId,
      product_id: item.product_id,
      qty: item.qty,
      unit_price: parseFloat(item.unit_price) || 0,
      total_amount: parseFloat(item.total_amount) || 0,
      id: item.id,
      name: item.name,
      description: item.description,
      sell_price: parseFloat(item.sell_price) || 0,
      cost_price: parseFloat(item.cost_price) || 0,
      stock: item.stock,
      category_id: item.category_id,
      supplier_id: item.supplier_id,
      images: normalizeImages(item.images),
      created_at: item.created_at,
    }));

    return res.json({ items, count: items.length });
  } catch (err) {
    console.error('updateCartItemQuantity error:', err);
    return res.status(500).json({ message: 'Failed to update cart item quantity' });
  }
};

/**
 * Clear cart
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's cart
    const cart = await db('customer_carts').where({ cust_id: userId }).first();
    if (!cart) {
      return res.json({ items: [], count: 0 });
    }

    // Delete all cart items
    await db('customer_cart_items').where({ cart_id: cart.id }).del();

    return res.json({ items: [], count: 0 });
  } catch (err) {
    console.error('clearCart error:', err);
    return res.status(500).json({ message: 'Failed to clear cart' });
  }
};

