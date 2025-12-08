# 🚀 Quick Start Guide - Checkout System Testing

## Files Modified/Created

### Backend Files
- ✅ `server/controllers/orderController.js` - Order & payment logic
- ✅ `server/routes/orders.js` - API endpoints
- ✅ `server/index.js` - Route registration (modified)

### Frontend Files
- ✅ `client/src/api/orders.js` - API wrapper
- ✅ `client/src/components/CheckoutModal.jsx` - Checkout modal
- ✅ `client/src/pages/customer/OrderConfirmation.jsx` - Confirmation page
- ✅ `client/src/pages/customer/MyOrders.jsx` - Orders history
- ✅ `client/src/pages/customer/Cart.jsx` - Cart integration (modified)
- ✅ `client/src/App.jsx` - Routes (modified)
- ✅ `client/src/components/Navbar.jsx` - Navigation (modified)

---

## 5-Minute Setup

### 1. Verify Environment Variables
```env
# In server/.env
RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
```

### 2. Start Backend
```bash
cd server
node index.js
# Should see: "Server running on port 5000"
```

### 3. Start Frontend
```bash
cd client
npm run dev
# Should see: "Local: http://localhost:5173"
```

### 4. Test the Flow
1. Login as customer
2. Browse `/customer/products`
3. Add items to cart
4. Go to `/customer/cart`
5. Click "Proceed to Checkout"
6. Use test card: `4111111111111111`
7. Enter OTP: `123456`
8. Verify order confirmation page

---

## Test Credentials

### Razorpay Test Cards

| Purpose | Card Number | Expiry | CVV | OTP | Result |
|---------|-------------|--------|-----|-----|--------|
| Success | 4111111111111111 | 12/25 | 123 | 123456 | ✅ Success |
| Failure | 4444333322221111 | 12/25 | 123 | 111111 | ❌ Decline |

---

## Database Verification

After payment, run these queries:

```sql
-- Check order created
SELECT * FROM customer_orders ORDER BY created_at DESC LIMIT 1;

-- Check order items
SELECT * FROM customer_order_items WHERE customer_order_id = <ORDER_ID>;

-- Check payment record
SELECT * FROM customer_payments WHERE customer_order_id = <ORDER_ID>;

-- Verify stock deducted
SELECT id, name, stock_available FROM products WHERE id IN (<PRODUCT_IDS>);
```

---

## Key Features

✅ **Secure Payment Gateway**
- Razorpay integration with signature verification
- Test mode available for development

✅ **Order Management**
- Create orders with validation
- View order details
- Cancel pending orders
- Full order history

✅ **Stock Management**
- Validate stock before checkout
- Deduct stock on successful payment
- Prevent overselling

✅ **User Experience**
- Smooth checkout flow
- Real-time error handling
- Loading states and feedback
- Responsive design
- Light/dark mode

✅ **Security**
- JWT authentication
- Signature verification
- Authorization checks
- Stock validation

---

## Common Issues & Solutions

### Razorpay Modal Not Opening
**Check:** Browser console for errors
```javascript
console.log(window.Razorpay); // Should not be undefined
```

### Payment Not Verifying
**Check:**
- Correct RAZORPAY_KEY_SECRET in .env
- Network request in DevTools shows correct response
- Backend logs for verification errors

### Order Not Created
**Check:**
- Cart not empty
- Stock available for all items
- Customer authenticated

### Stock Not Deducted
**Check:**
- Payment status is 'paid'
- Products exist in database
- Stock_available column present

---

## Navigation Paths

| Page | URL | Description |
|------|-----|-------------|
| Products | `/customer/products` | Browse products |
| Product Detail | `/customer/products/:id` | View product |
| Cart | `/customer/cart` | Shopping cart |
| Checkout | Modal in Cart | Payment modal |
| Order Confirmation | `/customer/order-confirmation/:orderId` | Order details |
| My Orders | `/customer/my-orders` | Order history |

---

## Code Flow

### 1. Checkout Modal Opens
```javascript
// user clicks "Proceed to Checkout" in Cart
→ handleCheckout()
→ setIsCheckoutOpen(true)
→ <CheckoutModal isOpen={true} />
```

### 2. Order Creation
```javascript
// user clicks "Proceed to Payment" in modal
→ handleCheckout() in CheckoutModal
→ createRazorpayOrder() API call
→ Backend creates order + items in DB
→ Returns razorpayOrderId to frontend
```

### 3. Razorpay Payment
```javascript
// Razorpay modal opens
→ user enters card details
→ Razorpay handles payment
→ Returns razorpay_payment_id on success
```

### 4. Payment Verification
```javascript
// Frontend sends verification request
→ verifyPayment() API call
→ Backend verifies signature with crypto
→ Updates order status to 'processing'
→ Inserts payment record
→ Deducts stock
→ Clears cart
```

### 5. Confirmation
```javascript
// Frontend receives success response
→ Closes modal
→ Calls handleCheckoutSuccess()
→ Navigates to /customer/order-confirmation/:orderId
```

---

## API Endpoints

### Create Order
```
POST /api/orders/create-razorpay-order
Body: { items, totalAmount, taxAmount, shippingAmount }
Response: { razorpayOrderId, key, amount, user details }
```

### Verify Payment
```
POST /api/orders/verify-payment
Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
Response: { success: true, orderNo, totalAmount }
```

### Get Order
```
GET /api/orders/:orderId
Response: { order, items, payment }
```

### List Orders
```
GET /api/orders
Response: { count, orders }
```

### Cancel Order
```
PUT /api/orders/:orderId/cancel
Response: { success: true, message }
```

---

## Payment Status Flow

```
PENDING (Initial)
    ↓
    ├─→ PAID (on successful payment verification)
    │     ↓
    │     Order Status: processing → completed
    │
    └─→ FAILED (on verification failure or user cancel)
          ↓
          Order Status: cancelled
```

---

## Debugging Tips

### Enable Logging
```javascript
// In CheckoutModal.jsx
console.log('Payment Options:', options);
console.log('Payment Response:', response);

// In orderController.js
console.log('Creating order for customer:', req.user.id);
console.log('Verifying signature:', generated_signature);
```

### Network Inspection
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by XHR requests
4. Check:
   - `create-razorpay-order` request/response
   - `verify-payment` request/response
   - Status codes and response data

### Database Inspection
```sql
-- Monitor orders
SELECT id, order_no, status, payment_status, total_amount FROM customer_orders;

-- Monitor payments
SELECT * FROM customer_payments ORDER BY created_at DESC;

-- Monitor stock
SELECT id, name, stock_available FROM products WHERE stock_available < 10;
```

---

## Performance Tips

1. **Lazy Load Razorpay Script**
   - Already implemented in CheckoutModal
   - Only loads when modal opens

2. **Optimize Database Queries**
   - Use indexes on order_no, cust_id
   - Join customer_order_items efficiently

3. **Cache Product Data**
   - Cache stock information
   - Invalidate on order completion

---

## Next Steps

1. ✅ Test checkout flow with test card
2. ✅ Verify all data in database
3. ✅ Test error scenarios
4. ✅ Test order cancellation
5. ✅ Verify order confirmation page
6. ✅ Test My Orders page
7. Switch to LIVE credentials in .env
8. Deploy to production

---

## Support Resources

- **Razorpay Docs:** https://razorpay.com/docs/
- **Test Cards:** https://razorpay.com/docs/payments/payments-smart-routing/test-cards/
- **Signature Verification:** https://razorpay.com/docs/api/payments/verify-payment-signature/

---

## Production Checklist

- [ ] Test with LIVE Razorpay credentials
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring and logging
- [ ] Configure email notifications
- [ ] Set up database backups
- [ ] Test refund process
- [ ] Document runbooks
- [ ] Train support team
- [ ] Set up analytics tracking

---

**Status:** ✅ Ready for Testing & Production Deployment
