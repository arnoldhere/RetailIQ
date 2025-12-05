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

exports.getWishlist = async (req, res) => {
    try {
        // const wishlist = 
        return res.json({ wishlist});
    } catch (err) {
        console.error('list categories error', err);
        return res.status(500).json({ message: 'Failed to load categories' });
    }
}