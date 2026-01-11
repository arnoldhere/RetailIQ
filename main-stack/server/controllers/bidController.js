const db = require('../config/db')
const sendEmail = require('../services/mailService')

module.exports = {
  // Admin: create an ask for product
  async createAsk(req, res) {
    try {
      const { product_id, quantity, min_price, expires_at, note } = req.body
      if (!product_id || !quantity) return res.status(400).json({ message: 'product_id and quantity required' })

      const [id] = await db('asks').insert({ product_id, quantity, min_price: min_price || null, expires_at: expires_at || null, note: note || null, created_by: req.user.id })
      const ask = await db('asks').where('id', id).first()

      return res.json({ ask })
    } catch (err) {
      console.error('createAsk error', err)
      return res.status(500).json({ message: 'Failed to create ask' })
    }
  },

  async listAsks(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 20, 500)
      const offset = parseInt(req.query.offset) || 0
      const status = req.query.status || null

      // Base query (no select yet)
      let baseQuery = db('asks').leftJoin('products', 'asks.product_id', 'products.id')

      if (status) baseQuery = baseQuery.where('asks.status', status)

      // 1️⃣ TOTAL COUNT (clean, no extra columns)
      const totalRes = await baseQuery.clone().count({ count: 'asks.id' }).first()
      const total = Number(totalRes.count || 0)

      // 2️⃣ DATA QUERY
      const asks = await baseQuery
        .clone()
        .select('asks.*', 'products.name as product_name')
        .orderBy('asks.created_at', 'desc')
        .limit(limit)
        .offset(offset)

      return res.json({ asks, total, limit, offset })
    } catch (err) {
      console.error('listAsks error', err)
      return res.status(500).json({ message: 'Failed to list asks' })
    }
  },

  async getAskDetails(req, res) {
    try {
      const { id } = req.params
      const ask = await db('asks').where('id', id).first()
      if (!ask) return res.status(404).json({ message: 'Ask not found' })
      const bids = await db('bids').where('ask_id', id).orderBy('created_at', 'asc')
      return res.json({ ask, bids })
    } catch (err) {
      console.error('getAskDetails error', err)
      return res.status(500).json({ message: 'Failed to get ask details' })
    }
  },

  async closeAsk(req, res) {
    try {
      const { id } = req.params
      const ask = await db('asks').where('id', id).first()
      if (!ask) return res.status(404).json({ message: 'Ask not found' })
      await db('asks').where('id', id).update({ status: 'closed' })
      return res.json({ message: 'Ask closed' })
    } catch (err) {
      console.error('closeAsk error', err)
      return res.status(500).json({ message: 'Failed to close ask' })
    }
  },

  // Admin: accept a bid
  async acceptBid(req, res) {
    const trx = await db.transaction()
    try {
      const { id } = req.params // bid id
      const { store_id, deliver_at } = req.body || {}
      const bid = await trx('bids').where('id', id).first()
      if (!bid) {
        await trx.rollback()
        return res.status(404).json({ message: 'Bid not found' })
      }

      // require store_id to create a supply order
      if (!store_id) {
        await trx.rollback()
        return res.status(400).json({ message: 'store_id required to accept bid and create supply order' })
      }

      // mark all other bids for this ask as rejected
      await trx('bids').where('ask_id', bid.ask_id).andWhere('id', '!=', id).update({ status: 'rejected' })
      // mark this bid as accepted
      await trx('bids').where('id', id).update({ status: 'accepted' })
      // close the ask
      await trx('asks').where('id', bid.ask_id).update({ status: 'closed' })

      // create supply order and items based on bid
      // map bid.supplier_id -> suppliers table
      // Support both legacy: bids.supplier_id -> users.id (cust_id on suppliers)
      // and new flow where bids.supplier_id is suppliers.id directly
      let supplierProfile = await trx('suppliers').where({ cust_id: bid.supplier_id }).first()
      if (!supplierProfile) {
        supplierProfile = await trx('suppliers').where({ id: bid.supplier_id }).first()
      }

      if (!supplierProfile) {
        await trx.rollback()
        return res.status(404).json({ message: 'Supplier profile not found for this bid' })
      }

      const ask = await trx('asks').where('id', bid.ask_id).first()
      const order_no = `SO-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`
      const total = Number(bid.price) * Number(bid.quantity)

      const [orderId] = await trx('supply_orders').insert({
        order_no,
        supplier_id: supplierProfile.id,
        store_id,
        ordered_by: req.user.id,
        status: 'pending',
        total_amount: total,
        deliver_at: deliver_at || null,
      })

      await trx('supply_order_items').insert({
        supply_order_id: orderId,
        product_id: ask.product_id,
        qty: bid.quantity,
        cost: bid.price,
        total_amount: total,
      })

      // notify supplier - try users table first, fall back to supplierProfile.email
      try {
        const supplierUser = await trx('users').where('id', bid.supplier_id).first()
        const emailTo = (supplierUser && supplierUser.email) ? supplierUser.email : supplierProfile.email
        const name = (supplierUser && (supplierUser.firstname || supplierUser.lastname)) ? `${supplierUser.firstname || ''} ${supplierUser.lastname || ''}` : (supplierProfile.name || '')
        if (emailTo) {
          const subject = `Your bid #${id} has been accepted and order ${order_no} created`
          const html = `<p>Hi ${name},</p><p>Your bid for ask #${bid.ask_id} has been accepted by admin and a supply order (${order_no}) has been created. Order total: $${total.toFixed(2)}</p>`
          sendEmail(process.env.GMAIL_EMAIL, emailTo, subject, html).catch((e) => console.error('Bid accepted email failed', e))
        }
      } catch (e) {
        console.error('notify supplier error', e)
      }

      await trx.commit()
      const created = await db('supply_orders').where('id', orderId).first()
      return res.json({ message: 'Bid accepted', order: created })
    } catch (err) {
      await trx.rollback()
      console.error('acceptBid error', err)
      return res.status(500).json({ message: 'Failed to accept bid' })
    }
  },

  // Supplier: list open asks
  async supplierListAsks(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 20, 500)
      const offset = parseInt(req.query.offset) || 0

      let q = db('asks').select('asks.*', 'products.name as product_name').leftJoin('products', 'asks.product_id', 'products.id').where('asks.status', 'open')

      const totalRes = await q.clone().count({ count: 'asks.id' }).first()
      const total = Number(totalRes.count || 0)

      const asks = await q.orderBy('asks.created_at', 'desc').limit(limit).offset(offset)
      return res.json({ asks, total, limit, offset })
    } catch (err) {
      console.error('supplierListAsks error', err)
      return res.status(500).json({ message: 'Failed to list asks' })
    }
  },

  // Supplier: place bid
  async supplierPlaceBid(req, res) {
    try {
      const { askId } = req.params
      const { price, quantity, message } = req.body
      if (!price || !quantity) return res.status(400).json({ message: 'price and quantity required' })

      const ask = await db('asks').where('id', askId).first()
      if (!ask) return res.status(404).json({ message: 'Ask not found' })
      if (ask.status !== 'open') return res.status(400).json({ message: 'Ask not open for bids' })

      const [id] = await db('bids').insert({ ask_id: askId, supplier_id: req.user.id, price, quantity, message: message || null })

      // notify admin (best-effort email)
      try {
        const admins = await db('users').where('role', 'admin').select('email')
        const adminEmails = admins.map(a => a.email).filter(Boolean).join(',')
        if (adminEmails) {
          const subject = `New bid placed for ask #${askId}`
          const html = `<p>A new bid has been placed by supplier ${req.user.id} for ask #${askId}.</p>`
          sendEmail(process.env.GMAIL_EMAIL, adminEmails, subject, html).catch((e) => console.error('Notify admin email failed', e))
        }
      } catch (e) {
        console.error('notify admin failed', e)
      }

      const bid = await db('bids').where('id', id).first()
      return res.json({ bid })
    } catch (err) {
      console.error('supplierPlaceBid error', err)
      return res.status(500).json({ message: 'Failed to place bid' })
    }
  },

  // Supplier: list own bids
  async supplierListBids(req, res) {
    try {
      const bids = await db('bids').where('supplier_id', req.user.id).orderBy('created_at', 'desc')
      return res.json({ bids })
    } catch (err) {
      console.error('supplierListBids error', err)
      return res.status(500).json({ message: 'Failed to list bids' })
    }
  },

  // Admin: list all bids (optionally for ask id)
  async adminListBids(req, res) {
    try {
      const ask_id = req.query.ask_id
      let q = db('bids').select('bids.*', 'users.firstname', 'users.lastname').leftJoin('users', 'bids.supplier_id', 'users.id')
      if (ask_id) q = q.where('bids.ask_id', ask_id)
      const bids = await q.orderBy('bids.created_at', 'desc')
      return res.json({ bids })
    } catch (err) {
      console.error('adminListBids error', err)
      return res.status(500).json({ message: 'Failed to list bids' })
    }
  }
}
