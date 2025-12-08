import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8888';
const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/**
 * Create Razorpay order for payment
 * Sends cart items and calculates total amount
 * @param {Array} items - Cart items with product_id, quantity, unit_price
 * @param {Number} totalAmount - Total amount in INR
 * @param {Number} taxAmount - Tax amount in INR
 * @param {Number} shippingAmount - Shipping amount in INR
 * @returns {Promise} - { orderId, razorpayOrderId, razorpayKeyId, amount, ... }
 */
export async function createRazorpayOrder(items, totalAmount, taxAmount, shippingAmount) {
  try {
    console.log(items)
    const response = await client.post('/api/orders/create-razorpay-order', {
      items,
      totalAmount,
      taxAmount,
      shippingAmount,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error.response?.data || error;
  }
}

/**
 * Verify payment and confirm order
 * Called after successful Razorpay payment
 * @param {String} razorpayOrderId - Order ID from Razorpay
 * @param {String} razorpayPaymentId - Payment ID from Razorpay
 * @param {String} razorpaySignature - Signature for verification
 * @param {Number} orderId - Local database order ID
 * @returns {Promise} - { success, message, orderId, orderNo, ... }
 */
export async function verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId) {
  try {
    const response = await client.post('/api/orders/verify-payment', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      orderId,
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error.response?.data || error;
  }
}

/**
 * Get order details by order ID
 * @param {Number} orderId - Order ID
 * @returns {Promise} - { order, items, payment }
 */
export async function getOrderDetails(orderId) {
  try {
    const response = await client.get(`/api/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error.response?.data || error;
  }
}

/**
 * Get all orders for logged-in user
 * @returns {Promise} - { count, orders }
 */
export async function getUserOrders() {
  try {
    const response = await client.get('/api/orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error.response?.data || error;
  }
}

/**
 * Cancel an order (only if payment not completed)
 * @param {Number} orderId - Order ID to cancel
 * @returns {Promise} - { success, message }
 */
export async function cancelOrder(orderId) {
  try {
    const response = await client.put(`/api/orders/${orderId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error.response?.data || error;
  }
}
