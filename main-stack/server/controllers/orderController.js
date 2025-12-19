const db = require('../config/db');
const crypto = require('crypto');
const razorpay = require('../services/rzpay');
const invoiceService = require('../services/invoiceService');
const emailService = require('../services/mailService');
const emailServiceAttachments = require('../services/mailService');
const fs = require('fs');

/**
 * Generate unique order number
 */
function generateOrderNumber() {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Create Razorpay order for payment
 * POST /api/orders/create-razorpay-order
 * Requires: authentication, items from cart
 */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { items, totalAmount, taxAmount, shippingAmount, store_id } = req.body;

    // Validate input
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items provided' });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: 'Invalid total amount' });
    }

    // Verify all items have adequate stock
    for (const item of items) {
      const product = await db('products').where({ id: item.product_id }).first();
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product_id} not found` });
      }
      if (product.stock_available < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock_available}`,
          product_id: item.product_id,
        });
      }
    }

    // ✅ Create Razorpay order
    // Amount must be in paise (multiply by 100)
    const razorpayAmount = Math.round(totalAmount * 100);
    const orderNo = generateOrderNumber();

    const razorpayOptions = {
      amount: razorpayAmount,
      currency: 'INR',
      receipt: orderNo,
      payment_capture: 1, // auto-capture
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOptions);

    // Validate store_id if provided
    let finalStoreId = store_id || null;
    if (finalStoreId) {
      const store = await db('stores').where({ id: finalStoreId, is_active: true }).first();
      if (!store) {
        return res.status(400).json({ message: 'Invalid or inactive store selected' });
      }
    } else {
      // If no store_id provided, get the first active store as default
      const defaultStore = await db('stores').where({ is_active: true }).first();
      if (defaultStore) {
        finalStoreId = defaultStore.id;
      } else {
        return res.status(400).json({ message: 'No active store available. Please contact admin.' });
      }
    }

    // ✅ Save order to database in 'pending' state (will be confirmed after payment)
    const [orderId] = await db('customer_orders').insert({
      order_no: orderNo,
      cust_id: userId,
      store_id: finalStoreId,
      status: 'pending',
      discount: 0,
      total_amount: totalAmount,
      payment_status: 'pending',
      payment_method: 'online',
      // razorpay_order_id will be saved after payment verification
    });

    // ✅ Save order items
    const orderItems = items.map(item => ({
      customer_order_id: orderId,
      product_id: item.product_id,
      qty: item.quantity,
      unit_price: item.unit_price,
      discount: 0,
      total_amount: item.unit_price * item.quantity,
    }));

    await db('customer_order_items').insert(orderItems);

    // Return Razorpay order details to frontend
    return res.status(201).json({
      success: true,
      orderId: orderId,
      orderNo: orderNo,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: totalAmount,
      amountInPaise: razorpayAmount,
      userEmail: req.user.email,
      userName: `${req.user.firstname} ${req.user.lastname}`,
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    return res.status(500).json({
      message: 'Failed to create payment order',
      error: err.message,
    });
  }
};

/**
 * Verify Razorpay payment and confirm order
 * POST /api/orders/verify-payment
 * Requires: authentication, Razorpay payment details
 */
exports.verifyPayment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification details' });
    }

    // ✅ Verify payment signature
    // This ensures the payment was genuinely processed by Razorpay
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.warn('Payment signature mismatch for order:', orderId);
      
      // ✅ Update order status to failed
      await db('customer_orders').where({ id: orderId }).update({
        payment_status: 'failed',
        status: 'cancelled',
      });

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    // ✅ Signature is valid - get order from database
    const order = await db('customer_orders').where({ id: orderId }).first();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify user owns this order
    if (order.cust_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized access to order' });
    }

    // ✅ Payment verified - update order status to 'processing'
    await db('customer_orders').where({ id: orderId }).update({
      payment_status: 'paid',
      status: 'processing',
      // Optionally save razorpay_payment_id for reference
    });

    // ✅ Save payment record
    await db('customer_payments').insert({
      customer_order_id: orderId,
      cust_id: userId,
      amount: order.total_amount,
      payment_date: new Date(),
      method: 'online',
      payment_ref: razorpay_payment_id,
    });

    // ✅ Update product stock (reduce by order quantity)
    const orderItems = await db('customer_order_items').where({ customer_order_id: orderId });
    for (const item of orderItems) {
      await db('products')
        .where({ id: item.product_id })
        .decrement('stock_available', item.qty);
    }

    // ✅ Clear user's cart after successful payment
    const cart = await db('customer_carts').where({ cust_id: userId }).first();
    if (cart) {
      await db('customer_cart_items').where({ cart_id: cart.id }).del();
    }

    // ✅ Generate invoice and PDF
    let invoiceData = null;
    try {
      invoiceData = await invoiceService.generateInvoice(orderId);
      console.log('Invoice generated successfully:', invoiceData.invoice.invoice_no);
    } catch (invoiceError) {
      console.error('Error generating invoice:', invoiceError);
      // Don't fail the order if invoice generation fails, but log the error
    }

    // ✅ Send invoice email if invoice was generated
    if (invoiceData && invoiceData.invoice) {
      try {
        const user = await db('users').where({ id: userId }).first();
        if (user && user.email) {
          const from = process.env.GMAIL_EMAIL || 'no-reply@example.com';
          const to = user.email;
          const subject = `Invoice ${invoiceData.invoice.invoice_no} - Order ${order.order_no}`;
          
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">Invoice Generated</h2>
                <p style="color: #666; font-size: 14px;">Hi ${user.firstname || 'Customer'},</p>
                <p style="color: #666; font-size: 14px;">
                  Your invoice for order <strong>${order.order_no}</strong> has been generated.
                </p>
                <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceData.invoice.invoice_no}</p>
                  <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.order_no}</p>
                  <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${invoiceData.invoice.grand_total.toFixed(2)}</p>
                  <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${order.payment_status}</p>
                </div>
                <p style="color: #666; font-size: 14px;">
                  Please find your invoice PDF attached to this email.
                </p>
                <p style="color: #666; font-size: 14px;">
                  Thank you for shopping with RetailIQ!
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px; text-align: center;">
                  RetailIQ - Smart Retail Analytics Platform
                </p>
              </div>
            </div>
          `;

          // Read PDF file for attachment
          const pdfPath = invoiceData.pdfPath;
          if (fs.existsSync(pdfPath) && emailServiceAttachments.sendEmailWithAttachment) {
            await emailServiceAttachments.sendEmailWithAttachment(
              from,
              to,
              subject,
              htmlContent,
              pdfPath,
              `${invoiceData.invoice.invoice_no}.pdf`
            );
            console.log('Invoice email sent successfully with PDF attachment to:', to);
          } else {
            // Send email without attachment if PDF doesn't exist or function not available
            await emailService(from, to, subject, htmlContent);
            console.log('Invoice email sent (without PDF attachment) to:', to);
          }
        }
      } catch (emailError) {
        console.error('Error sending invoice email:', emailError);
        // Don't fail the order if email sending fails
      }
    }

    // Return success response with order details
    return res.json({
      success: true,
      message: 'Payment verified and order confirmed',
      orderId: orderId,
      orderNo: order.order_no,
      status: 'processing',
      totalAmount: order.total_amount,
      invoice: invoiceData ? invoiceData.invoice : null,
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: err.message,
    });
  }
};

/**
 * Get order details
 * GET /api/orders/:orderId
 * Requires: authentication
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ✅ Get order with ownership verification
    const order = await db('customer_orders')
      .where({ id: orderId, cust_id: userId })
      .first();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // ✅ Get order items with product details
    const orderItems = await db('customer_order_items')
      .where({ customer_order_id: orderId })
      .join('products', 'customer_order_items.product_id', 'products.id')
      .select(
        'customer_order_items.id',
        'customer_order_items.qty',
        'customer_order_items.unit_price',
        'customer_order_items.total_amount',
        'products.id as product_id',
        'products.name',
        'products.description'
      );

    // ✅ Get payment information
    const payment = await db('customer_payments')
      .where({ customer_order_id: orderId })
      .first();

    return res.json({
      order: {
        id: order.id,
        orderNo: order.order_no,
        status: order.status,
        paymentStatus: order.payment_status,
        totalAmount: order.total_amount,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
      items: orderItems,
      payment: payment ? {
        method: payment.method,
        amount: payment.amount,
        date: payment.payment_date,
        reference: payment.payment_ref,
      } : null,
    });
  } catch (err) {
    console.error('Error fetching order details:', err);
    return res.status(500).json({
      message: 'Failed to fetch order details',
      error: err.message,
    });
  }
};

/**
 * Get all orders for logged-in user
 * GET /api/orders
 * Requires: authentication
 */
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ✅ Fetch all orders for user
    const orders = await db('customer_orders')
      .where({ cust_id: userId })
      .orderBy('created_at', 'desc')
      .select(
        'id',
        'order_no',
        'status',
        'payment_status',
        'total_amount',
        'created_at'
      );

    return res.json({
      count: orders.length,
      orders: orders,
    });
  } catch (err) {
    console.error('Error fetching user orders:', err);
    return res.status(500).json({
      message: 'Failed to fetch orders',
      error: err.message,
    });
  }
};

/**
 * Cancel order (only if payment not completed)
 * PUT /api/orders/:orderId/cancel
 * Requires: authentication
 */
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ✅ Get order
    const order = await db('customer_orders')
      .where({ id: orderId, cust_id: userId })
      .first();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // ✅ Check if order can be cancelled (only pending orders)
    if (order.payment_status === 'paid') {
      return res.status(400).json({
        message: 'Cannot cancel paid orders. Please contact support for refund.',
      });
    }

    // ✅ Cancel the order
    await db('customer_orders').where({ id: orderId }).update({
      status: 'cancelled',
      payment_status: 'failed',
    });

    return res.json({
      success: true,
      message: 'Order cancelled successfully',
      orderId: orderId,
    });
  } catch (err) {
    console.error('Error cancelling order:', err);
    return res.status(500).json({
      message: 'Failed to cancel order',
      error: err.message,
    });
  }
};
