const db = require('../config/db');
const mlService = require('../services/mlService');

function normalizeImages(images) {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images === 'object') return images;
  if (typeof images === 'string') {
    const trimmed = images.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed);
      } catch (err) {
        return [trimmed];
      }
    }
    return [trimmed];
  }
  return [];
}

function computeAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  const hasBirthdayPassed =
    monthDelta > 0 || (monthDelta === 0 && today.getDate() >= dob.getDate());

  if (!hasBirthdayPassed) age -= 1;
  return age >= 0 ? age : null;
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildCategoryWeights({ orderRows, wishlistRows, cartRows }) {
  const categoryWeights = {};
  const seenProductIds = new Set();

  // Orders are the strongest signal, followed by cart intent and wishlist intent.
  for (const row of orderRows) {
    const categoryName = row.category_name || 'uncategorized';
    const quantity = Number(row.qty) || 1;
    categoryWeights[categoryName] = (categoryWeights[categoryName] || 0) + quantity * 3;
    seenProductIds.add(Number(row.product_id));
  }

  for (const row of wishlistRows) {
    const categoryName = row.category_name || 'uncategorized';
    categoryWeights[categoryName] = (categoryWeights[categoryName] || 0) + 1.5;
    seenProductIds.add(Number(row.product_id));
  }

  for (const row of cartRows) {
    const categoryName = row.category_name || 'uncategorized';
    const quantity = Number(row.qty) || 1;
    categoryWeights[categoryName] = (categoryWeights[categoryName] || 0) + quantity * 2;
    seenProductIds.add(Number(row.product_id));
  }

  return {
    categoryWeights,
    seenProductIds: [...seenProductIds].filter(Number.isFinite),
  };
}

async function loadCustomerContext(userId) {
  const [user, orderRows, wishlistRows, cartRows] = await Promise.all([
    db('users').where({ id: userId, role: 'customer' }).first(),
    db('customer_order_items')
      .join('customer_orders', 'customer_order_items.customer_order_id', 'customer_orders.id')
      .leftJoin('products', 'customer_order_items.product_id', 'products.id')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .where('customer_orders.cust_id', userId)
      .whereNot('customer_orders.status', 'cancelled')
      .select(
        'customer_order_items.product_id',
        'customer_order_items.qty',
        'categories.name as category_name'
      ),
    db('customer_wishlist_items')
      .join('customer_wishlists', 'customer_wishlist_items.wishlist_id', 'customer_wishlists.id')
      .leftJoin('products', 'customer_wishlist_items.product_id', 'products.id')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .where('customer_wishlists.cust_id', userId)
      .select(
        'customer_wishlist_items.product_id',
        'categories.name as category_name'
      ),
    db('customer_cart_items')
      .join('customer_carts', 'customer_cart_items.cart_id', 'customer_carts.id')
      .leftJoin('products', 'customer_cart_items.product_id', 'products.id')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .where('customer_carts.cust_id', userId)
      .select(
        'customer_cart_items.product_id',
        'customer_cart_items.qty',
        'categories.name as category_name'
      ),
  ]);

  return { user, orderRows, wishlistRows, cartRows };
}

async function loadCandidateProducts() {
  const [productRows, popularityRows] = await Promise.all([
    db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .where('products.is_active', true)
      .where('products.stock_available', '>', 0)
      .select(
        'products.id',
        'products.name',
        'products.description',
        'products.category_id',
        'products.supplier_id',
        'products.sell_price',
        'products.stock_available',
        'products.images',
        'categories.name as category_name'
      )
      .orderBy('products.created_at', 'desc'),
    db('customer_order_items')
      .join('customer_orders', 'customer_order_items.customer_order_id', 'customer_orders.id')
      .whereNot('customer_orders.status', 'cancelled')
      .groupBy('customer_order_items.product_id')
      .select('customer_order_items.product_id')
      .sum({ purchase_count: 'customer_order_items.qty' }),
  ]);

  const popularityMap = new Map(
    popularityRows.map((row) => [Number(row.product_id), Number(row.purchase_count) || 0])
  );

  return productRows.map((product) => ({
    ...product,
    images: normalizeImages(product.images),
    sell_price: Number(product.sell_price) || 0,
    stock_available: Number(product.stock_available) || 0,
    purchase_count: popularityMap.get(Number(product.id)) || 0,
  }));
}

function buildFallbackRecommendations(products, seenProductIds, limit) {
  const seenIdSet = new Set(seenProductIds);

  const rankedProducts = [...products].sort((left, right) => {
    if ((right.purchase_count || 0) !== (left.purchase_count || 0)) {
      return (right.purchase_count || 0) - (left.purchase_count || 0);
    }
    return (right.stock_available || 0) - (left.stock_available || 0);
  });

  const unseen = rankedProducts.filter((product) => !seenIdSet.has(Number(product.id)));
  const seen = rankedProducts.filter((product) => seenIdSet.has(Number(product.id)));
  const ordered = [...unseen, ...seen].slice(0, limit);

  return ordered.map((product, index) => ({
    product_id: product.id,
    score: Number((1 - index * 0.01).toFixed(6)),
    reason_code: 'popular_right_now',
    reason: `Popular picks from ${product.category_name || 'our catalog'} right now.`,
    product,
  }));
}

async function persistRecommendations(userId, recommendations, algorithmVersion) {
  if (!recommendations.length) return;

  const rows = recommendations.map((entry) => ({
    cust_id: userId,
    product_id: entry.product_id,
    score: Number(entry.score) || 0,
    algorithm_version: algorithmVersion,
    reason_code: entry.reason_code || 'popular_right_now',
  }));

  try {
    await db.transaction(async (trx) => {
      await trx('user_recommendations').where({ cust_id: userId }).del();
      await trx('user_recommendations').insert(rows);
    });
  } catch (err) {
    // Recommendation storage is best-effort; serving the API response is the priority.
    console.warn('Failed to persist recommendations:', err.message);
  }
}

exports.getProductRecommendations = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can fetch recommendations' });
    }

    const authenticatedUserId = Number(req.user.userId);
    const requestedUserId = normalizePositiveInteger(req.body?.userId, authenticatedUserId);
    const limit = Math.min(normalizePositiveInteger(req.body?.limit, 8), 12);

    // The frontend can send the user id for intent, but the backend still trusts the token first.
    if (requestedUserId !== authenticatedUserId) {
      return res.status(403).json({ message: 'User validation failed for recommendations' });
    }

    const { user, orderRows, wishlistRows, cartRows } = await loadCustomerContext(authenticatedUserId);
    if (!user || user.is_active === 0) {
      return res.status(404).json({ message: 'Customer not found or inactive' });
    }

    const products = await loadCandidateProducts();
    if (!products.length) {
      return res.json({
        recommendations: [],
        metadata: {
          algorithm_version: 'catalog_empty',
          strategy: 'catalog_empty',
          model_ready: false,
        },
      });
    }

    const { categoryWeights, seenProductIds } = buildCategoryWeights({
      orderRows,
      wishlistRows,
      cartRows,
    });

    const payload = {
      user: {
        id: authenticatedUserId,
        gender: user.gender || null,
        age: computeAge(user.date_of_birth),
        order_count: orderRows.length,
        wishlist_count: wishlistRows.length,
        cart_count: cartRows.length,
        seen_product_ids: seenProductIds,
        category_weights: categoryWeights,
      },
      products,
      limit,
    };

    let responseData;
    try {
      responseData = await mlService.getProductRecommendations(payload);
    } catch (err) {
      const fallbackRecommendations = buildFallbackRecommendations(products, seenProductIds, limit);
      responseData = {
        recommendations: fallbackRecommendations,
        metadata: {
          algorithm_version: 'popular_products_fallback',
          strategy: 'popular_products_fallback',
          model_ready: false,
          ml_error: err.message,
        },
      };
    }

    await persistRecommendations(
      authenticatedUserId,
      Array.isArray(responseData.recommendations) ? responseData.recommendations : [],
      responseData.metadata?.algorithm_version || 'unknown'
    );

    return res.json(responseData);
  } catch (err) {
    console.error('getProductRecommendations error:', err);
    return res.status(500).json({ message: 'Failed to load recommendations' });
  }
};
