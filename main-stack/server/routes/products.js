const express = require('express')
const router = express.Router()
const db = require('../config/db')
const path = require('path');
const fs = require('fs');
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

// Get all public products with filters and sorting (no auth required)
router.get('/products', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 500)
        const offset = parseInt(req.query.offset) || 0
        const categoryId = req.query.category_id
        const search = req.query.search
        const sort = req.query.sort || 'name'
        const order = (req.query.order || 'asc').toUpperCase()

        // Validate sort field
        const validSortFields = ['name', 'price', 'sell_price', 'created_at', 'stock_available']
        const sortField = validSortFields.includes(sort) ? sort : 'name'
        const sortCol = sortField === 'price' || sortField === 'sell_price' ? 'products.sell_price' : `products.${sortField}`
        const orderDir = order === 'DESC' ? 'desc' : 'asc'

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
            .leftJoin('categories', 'products.category_id', 'categories.id')
            .where('products.is_active', true)

        // Apply filters
        if (categoryId) {
            query = query.where('products.category_id', categoryId)
        }
        if (search) {
            query = query.where('products.name', 'like', `%${search}%`)
        }

        // Count total before pagination
        const countQuery = query.clone()

        // Remove the existing select & orderBy before counting to avoid unnecessary columns/order in COUNT query
        const countResult = await countQuery
            .clearSelect()
            .clearOrder()
            .count({ count: 'products.id' })   // or .count('products.id as count')
            .first()

        const total = Number(countResult.count || 0)

        // Apply sorting and pagination
        const products = await query
            .orderBy(sortCol, orderDir)
            .limit(limit)
            .offset(offset)

        // Parse images JSON for each product
        const formattedProducts = products.map((p) => ({
            ...p,
            images: normalizeImages(p.images),
        }));

        // Parse images JSON for each product
        // const formattedProducts = products.map((p) => ({
        //     ...p,
        //     images: p.images ? (() => {
        //         try {
        //             return JSON.parse(p.images)
        //         } catch (e) {
        //             return []
        //         }
        //     })() : [],
        // }))

        return res.json({ products: formattedProducts, total, limit, offset })
    } catch (err) {
        console.error('get products error', err)
        return res.status(500).json({ message: 'Failed to load products' })
    }
})

// Get single product by ID (public, no auth required)
router.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            return res.status(400).json({ message: 'Product ID required' })
        }

        const product = await db('products')
            .select(
                'products.*',
                'categories.name as category_name'
            )
            .leftJoin('categories', 'products.category_id', 'categories.id')
            .where('products.id', id)
            .where('products.is_active', true)
            .first()

        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }

        // Parse images
        // const formatted = {
        //     ...product,
        //     images: product.images ? (() => {
        //         try {
        //             // return JSON.parse(product.images)
        //             return images: normalizeImages(p.images),
        //         } catch (e) {
        //             return []
        //         }
        //     })() : [],
        // }
        const formatted = {
            ...product,
            images: product.images ? normalizeImages(product.images) : [],  
        };

        return res.json({ product: formatted })
    } catch (err) {
        console.error('get product by id error', err)
        return res.status(500).json({ message: 'Failed to load product' })
    }
})

module.exports = router
