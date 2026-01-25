const db = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getStores = async (req, res) => {
    try {
        const stores = await db('stores')
        return res.json({ stores });
    } catch (err) {
        console.error('list stores error', err);
        return res.status(500).json({ message: 'Failed to load stores' });
    }

};