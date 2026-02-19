const db = require('../config/db')
const sendEmail = require('../services/mailService')

function createHttpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

function toPositiveNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

function isExpired(dateValue) {
  if (!dateValue) return false
  const dt = new Date(dateValue)
  if (Number.isNaN(dt.getTime())) return false
  return dt <= new Date()
}

async function resolveSupplierProfile(trx, supplierRef) {
  // Newer flow: bids.supplier_id stores suppliers.id
  let supplier = await trx('suppliers').where({ id: supplierRef }).first()
  if (supplier) return supplier

  // Legacy flow: bids.supplier_id stores users.id and suppliers.cust_id links to that user
  const supplierCols = await trx('suppliers').columnInfo()
  if (supplierCols.cust_id) {
    supplier = await trx('suppliers').where({ cust_id: supplierRef }).first()
    if (supplier) return supplier
  }

  return null
}

async function createInitialSupplyPayment(trx, { orderId, supplierId, total }) {
  const paymentCols = await trx('supply_payments').columnInfo()
  const payload = {
    supply_order_id: orderId,
    amount: total,
  }

  // Keep compatibility with both schema variants used in this repo history.
  if (paymentCols.supplier_id) payload.supplier_id = supplierId
  if (paymentCols.payment_status) payload.payment_status = 'pending'
  if (paymentCols.payment_method) payload.payment_method = null
  if (paymentCols.method) payload.method = 'CASH'
  if (paymentCols.payment_date) payload.payment_date = null
  if (paymentCols.payment_ref) payload.payment_ref = null
  if (paymentCols.razorpay_order_id) payload.razorpay_order_id = null
  if (paymentCols.razorpay_payment_id) payload.razorpay_payment_id = null

  await trx('supply_payments').insert(payload)
}

module.exports = {
  /**
   * Admin: Create an ask (RFQ) for a product
   * Body: { product_id, quantity, min_price?, expires_at?, note? }
   */
  async createAsk(req, res) {
    try {
      const { product_id, quantity, min_price, expires_at, note } = req.body
      const qty = parseInt(quantity, 10)
      const minPrice = min_price === '' || min_price === null || typeof min_price === 'undefined'
        ? null
        : Number(min_price)

      if (!product_id || !Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ message: 'product_id and positive quantity required' })
      }
      if (minPrice !== null && (!Number.isFinite(minPrice) || minPrice < 0)) {
        return res.status(400).json({ message: 'min_price must be a valid non-negative number' })
      }
      if (expires_at && Number.isNaN(new Date(expires_at).getTime())) {
        return res.status(400).json({ message: 'expires_at must be a valid date' })
      }

      const product = await db('products').where('id', product_id).first()
      if (!product) return res.status(404).json({ message: 'Product not found' })

      const [id] = await db('asks').insert({
        product_id,
        quantity: qty,
        min_price: minPrice,
        expires_at: expires_at || null,
        note: note || null,
        created_by: req.user.id,
      })

      const ask = await db('asks').where('id', id).first()
      return res.json({ ask })
    } catch (err) {
      console.error('createAsk error', err)
      return res.status(500).json({ message: 'Failed to create ask' })
    }
  },

  /**
   * Admin: List all asks with optional status filter
   * Query: { limit, offset, status? }
   */
  async listAsks(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 500)
      const offset = parseInt(req.query.offset, 10) || 0
      const status = req.query.status || null

      let baseQuery = db('asks').leftJoin('products', 'asks.product_id', 'products.id')
      if (status) baseQuery = baseQuery.where('asks.status', status)

      const totalRes = await baseQuery.clone().count({ count: 'asks.id' }).first()
      const total = Number(totalRes.count || 0)

      const asks = await baseQuery
        .clone()
        .select(
          'asks.*',
          'products.name as product_name',
          db.raw('(SELECT COUNT(*) FROM bids WHERE bids.ask_id = asks.id) as bids_count'),
          db.raw("(SELECT COUNT(*) FROM bids WHERE bids.ask_id = asks.id AND bids.status = 'accepted') as accepted_bids_count"),
        )
        .orderBy('asks.created_at', 'desc')
        .limit(limit)
        .offset(offset)

      return res.json({ asks, total, limit, offset })
    } catch (err) {
      console.error('listAsks error', err)
      return res.status(500).json({ message: 'Failed to list asks' })
    }
  },

  /**
   * Admin: Get ask details including all bids placed
   * Returns: { ask, bids[] }
   */
  async getAskDetails(req, res) {
    try {
      const { id } = req.params
      const ask = await db('asks')
        .leftJoin('products', 'asks.product_id', 'products.id')
        .select('asks.*', 'products.name as product_name')
        .where('asks.id', id)
        .first()

      if (!ask) return res.status(404).json({ message: 'Ask not found' })

      const bids = await db('bids')
        .leftJoin('users', 'bids.supplier_id', 'users.id')
        .leftJoin('suppliers', 'bids.supplier_id', 'suppliers.id')
        .where('bids.ask_id', id)
        .select(
          'bids.*',
          'users.firstname',
          'users.lastname',
          'suppliers.name as supplier_name',
          'suppliers.email as supplier_email',
        )
        .orderBy('bids.created_at', 'asc')

      return res.json({ ask, bids })
    } catch (err) {
      console.error('getAskDetails error', err)
      return res.status(500).json({ message: 'Failed to get ask details' })
    }
  },

  /**
   * Admin: Close an ask (no more bids can be placed)
   */
  async closeAsk(req, res) {
    try {
      const { id } = req.params
      const ask = await db('asks').where('id', id).first()
      if (!ask) return res.status(404).json({ message: 'Ask not found' })
      if (ask.status !== 'open') return res.status(400).json({ message: 'Ask is already closed' })

      await db('asks').where('id', id).update({ status: 'closed' })
      return res.json({ message: 'Ask closed' })
    } catch (err) {
      console.error('closeAsk error', err)
      return res.status(500).json({ message: 'Failed to close ask' })
    }
  },

  /**
   * Admin: Accept a bid and auto-create supply order.
   * Body: { store_id (required), deliver_at? }
   */
  async acceptBid(req, res) {
    try {
      const { id } = req.params
      const { store_id, deliver_at } = req.body || {}
      const storeId = parseInt(store_id, 10)

      if (!Number.isInteger(storeId) || storeId <= 0) {
        return res.status(400).json({ message: 'store_id required to accept bid and create supply order' })
      }
      if (deliver_at && Number.isNaN(new Date(deliver_at).getTime())) {
        return res.status(400).json({ message: 'deliver_at must be a valid date' })
      }

      const txResult = await db.transaction(async (trx) => {
        const bid = await trx('bids').where('id', id).first()
        if (!bid) throw createHttpError(404, 'Bid not found')
        if (bid.status !== 'submitted') {
          throw createHttpError(400, `Only submitted bids can be accepted (current: ${bid.status})`)
        }

        const ask = await trx('asks').where('id', bid.ask_id).first()
        if (!ask) throw createHttpError(404, 'Ask not found for this bid')
        if (ask.status !== 'open') throw createHttpError(400, 'Ask is not open for accepting bids')
        if (isExpired(ask.expires_at)) throw createHttpError(400, 'Cannot accept bid for expired ask')

        const store = await trx('stores').where('id', storeId).first()
        if (!store) throw createHttpError(404, 'Store not found')

        const supplierProfile = await resolveSupplierProfile(trx, bid.supplier_id)
        if (!supplierProfile) throw createHttpError(404, 'Supplier profile not found for this bid')

        await trx('bids')
          .where('ask_id', bid.ask_id)
          .andWhere('id', '!=', id)
          .andWhere('status', 'submitted')
          .update({ status: 'rejected' })

        const acceptedCount = await trx('bids')
          .where({ id, status: 'submitted' })
          .update({ status: 'accepted' })
        if (!acceptedCount) throw createHttpError(409, 'Bid could not be accepted')

        await trx('asks').where('id', bid.ask_id).update({ status: 'closed' })

        const order_no = `SO-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`
        const total = Number(bid.price) * Number(bid.quantity)

        const [orderId] = await trx('supply_orders').insert({
          order_no,
          supplier_id: supplierProfile.id,
          store_id: storeId,
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

        await createInitialSupplyPayment(trx, {
          orderId,
          supplierId: supplierProfile.id,
          total,
        })

        return { orderId, order_no, total, bid, supplierProfile }
      })

      // Non-blocking supplier notification
      try {
        const supplierUser = await db('users').where('id', txResult.bid.supplier_id).first()
        const emailTo = supplierUser?.email || txResult.supplierProfile.email
        const name = supplierUser
          ? `${supplierUser.firstname || ''} ${supplierUser.lastname || ''}`.trim()
          : (txResult.supplierProfile.name || '')

        if (emailTo) {
          const subject = `Your bid #${id} has been accepted and order ${txResult.order_no} created`
          const html = `<p>Hi ${name || 'Supplier'},</p><p>Your bid for ask #${txResult.bid.ask_id} has been accepted by admin and a supply order (${txResult.order_no}) has been created. Order total: $${txResult.total.toFixed(2)}</p>`
          sendEmail(process.env.GMAIL_EMAIL, emailTo, subject, html).catch((e) => console.error('Bid accepted email failed', e))
        }
      } catch (e) {
        console.error('notify supplier error', e)
      }

      const created = await db('supply_orders').where('id', txResult.orderId).first()
      return res.json({ message: 'Bid accepted', order: created })
    } catch (err) {
      if (err.status) return res.status(err.status).json({ message: err.message })
      console.error('acceptBid error', err)
      return res.status(500).json({ message: 'Failed to accept bid' })
    }
  },

  /**
   * Supplier: List open asks (excluding expired asks)
   */
  async supplierListAsks(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 500)
      const offset = parseInt(req.query.offset, 10) || 0

      const baseQuery = db('asks')
        .leftJoin('products', 'asks.product_id', 'products.id')
        .where('asks.status', 'open')
        .andWhere(function () {
          this.whereNull('asks.expires_at').orWhere('asks.expires_at', '>', db.fn.now())
        })

      const countRes = await baseQuery.clone().clearSelect().count({ count: 'asks.id' }).first()
      const total = Number(countRes.count || 0)

      const asks = await baseQuery
        .clone()
        .select('asks.*', 'products.name as product_name')
        .orderBy('asks.created_at', 'desc')
        .limit(limit)
        .offset(offset)

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
      const bidPrice = toPositiveNumber(price)
      const bidQty = parseInt(quantity, 10)

      if (!bidPrice || !Number.isInteger(bidQty) || bidQty <= 0) {
        return res.status(400).json({ message: 'price and quantity must be valid positive numbers' })
      }

      const ask = await db('asks').where('id', askId).first()
      if (!ask) return res.status(404).json({ message: 'Ask not found' })
      if (ask.status !== 'open') return res.status(400).json({ message: 'Ask not open for bids' })
      if (isExpired(ask.expires_at)) return res.status(400).json({ message: 'Ask has expired' })

      let bidId = null
      let action = 'placed'
      const existing = await db('bids')
        .where({ ask_id: askId, supplier_id: req.user.id, status: 'submitted' })
        .first()

      if (existing) {
        await db('bids')
          .where('id', existing.id)
          .update({ price: bidPrice, quantity: bidQty, message: message || null })
        bidId = existing.id
        action = 'updated'
      } else {
        const [id] = await db('bids').insert({
          ask_id: askId,
          supplier_id: req.user.id,
          price: bidPrice,
          quantity: bidQty,
          message: message || null,
        })
        bidId = id
      }

      // notify admin (best-effort email)
      try {
        const admins = await db('users').where('role', 'admin').select('email')
        const adminEmails = admins.map((a) => a.email).filter(Boolean).join(',')
        if (adminEmails) {
          const subject = action === 'updated'
            ? `Bid updated for ask #${askId}`
            : `New bid placed for ask #${askId}`
          const html = `<p>A bid has been ${action} by supplier ${req.user.id} for ask #${askId}.</p>`
          sendEmail(process.env.GMAIL_EMAIL, adminEmails, subject, html).catch((e) => console.error('Notify admin email failed', e))
        }
      } catch (e) {
        console.error('notify admin failed', e)
      }

      const bid = await db('bids').where('id', bidId).first()
      return res.json({ bid, message: `Bid ${action}` })
    } catch (err) {
      console.error('supplierPlaceBid error', err)
      return res.status(500).json({ message: 'Failed to place bid' })
    }
  },

  // Supplier: list own bids
  async supplierListBids(req, res) {
    try {
      const bids = await db('bids')
        .leftJoin('asks', 'bids.ask_id', 'asks.id')
        .leftJoin('products', 'asks.product_id', 'products.id')
        .where('bids.supplier_id', req.user.id)
        .select(
          'bids.*',
          'asks.status as ask_status',
          'asks.expires_at as ask_expires_at',
          'products.name as product_name',
        )
        .orderBy('bids.created_at', 'desc')
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
      let q = db('bids')
        .select(
          'bids.*',
          'users.firstname',
          'users.lastname',
          'suppliers.name as supplier_name',
          'suppliers.email as supplier_email',
          'asks.status as ask_status',
          'products.name as product_name',
        )
        .leftJoin('users', 'bids.supplier_id', 'users.id')
        .leftJoin('suppliers', 'bids.supplier_id', 'suppliers.id')
        .leftJoin('asks', 'bids.ask_id', 'asks.id')
        .leftJoin('products', 'asks.product_id', 'products.id')

      if (ask_id) q = q.where('bids.ask_id', ask_id)

      const bids = await q
        .orderByRaw("CASE bids.status WHEN 'submitted' THEN 0 WHEN 'accepted' THEN 1 WHEN 'rejected' THEN 2 ELSE 3 END")
        .orderBy('bids.price', 'asc')
        .orderBy('bids.created_at', 'desc')

      return res.json({ bids })
    } catch (err) {
      console.error('adminListBids error', err)
      return res.status(500).json({ message: 'Failed to list bids' })
    }
  },
}
