const db = require('../config/db');

/**
 * Get or create wishlist for user
 */
async function getOrCreateWishlist(userId) {
    let wishlist = await db('customer_wishlists').where({ cust_id: userId }).first();

    if (!wishlist) {
        const [wishlistId] = await db('customer_wishlists').insert({
            cust_id: userId,
            name: 'My Wishlist'
        });
        wishlist = await db('customer_wishlists').where({ id: wishlistId }).first();
    }

    return wishlist;
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
 * Get wishlist items with product details
 */
exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get or create wishlist
        const wishlist = await getOrCreateWishlist(userId);

        // Get wishlist items with product details
        const wishlistItems = await db('customer_wishlist_items')
            .where({ wishlist_id: wishlist.id })
            .join('products', 'customer_wishlist_items.product_id', 'products.id')
            .select(
                'customer_wishlist_items.id as wishlistItemId',
                'customer_wishlist_items.product_id',
                'products.*'
            );

        // Format items with normalized images
        const items = wishlistItems.map(item => ({
            wishlistItemId: item.wishlistItemId,
            product_id: item.product_id,
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
        console.error('getWishlist error:', err);
        return res.status(500).json({ message: 'Failed to fetch wishlist' });
    }
};

/**
 * Add item to wishlist
 */
exports.addToWishlist = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Get product details
        const product = await db('products').where({ id: productId }).first();
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Get or create wishlist
        const wishlist = await getOrCreateWishlist(userId);

        // Check if item already exists in wishlist
        const existingItem = await db('customer_wishlist_items')
            .where({ wishlist_id: wishlist.id, product_id: productId })
            .first();

        if (existingItem) {
            // Item already in wishlist, return current wishlist
            const wishlistItems = await db('customer_wishlist_items')
                .where({ wishlist_id: wishlist.id })
                .join('products', 'customer_wishlist_items.product_id', 'products.id')
                .select(
                    'customer_wishlist_items.id as wishlistItemId',
                    'customer_wishlist_items.product_id',
                    'products.*'
                );

            const items = wishlistItems.map(item => ({
                wishlistItemId: item.wishlistItemId,
                product_id: item.product_id,
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

        // Add new item
        await db('customer_wishlist_items').insert({
            wishlist_id: wishlist.id,
            product_id: productId,
        });

        // Return updated wishlist
        const wishlistItems = await db('customer_wishlist_items')
            .where({ wishlist_id: wishlist.id })
            .join('products', 'customer_wishlist_items.product_id', 'products.id')
            .select(
                'customer_wishlist_items.id as wishlistItemId',
                'customer_wishlist_items.product_id',
                'products.*'
            );

        const items = wishlistItems.map(item => ({
            wishlistItemId: item.wishlistItemId,
            product_id: item.product_id,
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
        console.error('addToWishlist error:', err);
        return res.status(500).json({ message: 'Failed to add item to wishlist' });
    }
};

/**
 * Remove item from wishlist by wishlist item ID
 */
exports.removeFromWishlistById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { wishlistItemId } = req.params;

        if (!wishlistItemId) {
            return res.status(400).json({ message: 'Wishlist item ID is required' });
        }

        // Get user's wishlist
        const wishlist = await db('customer_wishlists').where({ cust_id: userId }).first();
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        // Verify item belongs to user's wishlist
        const wishlistItem = await db('customer_wishlist_items')
            .where({ id: wishlistItemId, wishlist_id: wishlist.id })
            .first();

        if (!wishlistItem) {
            return res.status(404).json({ message: 'Wishlist item not found' });
        }

        // Delete item
        await db('customer_wishlist_items').where({ id: wishlistItemId }).del();
        // await db('customer_wishlists').where({ id: wishlist.id }).del();
        // Return updated wishlist
        const wishlistItems = await db('customer_wishlist_items')
            .where({ wishlist_id: wishlist.id })
            .join('products', 'customer_wishlist_items.product_id', 'products.id')
            .select(
                'customer_wishlist_items.id as wishlistItemId',
                'customer_wishlist_items.product_id',
                'products.*'
            );

        const items = wishlistItems.map(item => ({
            wishlistItemId: item.wishlistItemId,
            product_id: item.product_id,
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
        console.error('removeFromWishlistById error:', err);
        return res.status(500).json({ message: 'Failed to remove item from wishlist' });
    }
};

/**
 * Remove item from wishlist by product ID
 */
exports.removeFromWishlistByProductId = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Get user's wishlist
        const wishlist = await db('customer_wishlists').where({ cust_id: userId }).first();
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        // Find and delete item
        const wishlistItem = await db('customer_wishlist_items')
            .where({ wishlist_id: wishlist.id, product_id: productId })
            .first();

        if (!wishlistItem) {
            return res.status(404).json({ message: 'Wishlist item not found' });
        }

        // Delete item
        await db('customer_wishlist_items').where({ id: wishlistItem.id }).del();

        // Return updated wishlist
        const wishlistItems = await db('customer_wishlist_items')
            .where({ wishlist_id: wishlist.id })
            .join('products', 'customer_wishlist_items.product_id', 'products.id')
            .select(
                'customer_wishlist_items.id as wishlistItemId',
                'customer_wishlist_items.product_id',
                'products.*'
            );

        const items = wishlistItems.map(item => ({
            wishlistItemId: item.wishlistItemId,
            product_id: item.product_id,
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
        console.error('removeFromWishlistByProductId error:', err);
        return res.status(500).json({ message: 'Failed to remove item from wishlist' });
    }
};

/**
 * Clear wishlist
 */
exports.clearWishlist = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get user's wishlist
        const wishlist = await db('customer_wishlists').where({ cust_id: userId }).first();
        if (!wishlist) {
            return res.json({ items: [], count: 0 });
        }

        // Delete all wishlist items
        await db('customer_wishlist_items').where({ wishlist_id: wishlist.id }).del();

        return res.json({ items: [], count: 0 });
    } catch (err) {
        console.error('clearWishlist error:', err);
        return res.status(500).json({ message: 'Failed to clear wishlist' });
    }
};

