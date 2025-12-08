# 🧪 Complete Testing Guide - RetailIQ Checkout System

## Prerequisites

- ✅ Backend server running on http://localhost:5000
- ✅ Frontend running on http://localhost:5173
- ✅ MySQL database with required tables
- ✅ Valid Razorpay test credentials in `.env`

---

## Test Scenarios

### Test 1: Complete Payment Flow (Success)

**Objective:** Verify successful order creation and payment processing

**Steps:**

1. **Login as Customer**
   - Navigate to http://localhost:5173/auth/login
   - Use customer credentials
   - Expected: Redirected to `/customer/home`

2. **Browse Products**
   - Click "Explore" or navigate to `/customer/products`
   - Add 2-3 items to cart
   - Expected: Items appear in cart

3. **Go to Cart**
   - Navigate to `/customer/cart`
   - Verify cart shows:
     - Product names ✓
     - Quantities ✓
     - Unit prices ✓
     - Subtotals ✓
   - Verify order summary shows:
     - Subtotal (sum of all items) ✓
     - Tax (10% of subtotal) ✓
     - Shipping (Free) ✓
     - Total (subtotal + tax) ✓

4. **Click Proceed to Checkout**
   - Click "Proceed to Checkout" button
   - Expected: CheckoutModal opens
   - Verify modal displays:
     - Same cart items ✓
     - Same price breakdown ✓
     - "Proceed to Payment" button enabled ✓

5. **Complete Payment**
   - Click "Proceed to Payment" button
   - Expected: Razorpay modal opens
   - Enter test card details:
     - Card Number: `4111111111111111`
     - Expiry: `12/25`
     - CVV: `123`
   - Click "Pay Now"
   - When prompted for OTP, enter: `123456`

6. **Verify Success Page**
   - Expected: OrderConfirmation page loads
   - Verify displays:
     - Order number (ORD-XXXXXXXX-XXXX) ✓
     - Status: PROCESSING ✓
     - Payment Status: PAID ✓
     - Total Amount: Matches ✓
     - Order items list ✓
     - Payment details (method, reference) ✓

7. **Database Verification**
   ```sql
   -- Run these queries to verify data
   SELECT * FROM customer_orders 
   WHERE order_no LIKE 'ORD-%' 
   ORDER BY created_at DESC LIMIT 1;
   
   SELECT * FROM customer_order_items 
   WHERE customer_order_id = <ORDER_ID>;
   
   SELECT * FROM customer_payments 
   WHERE customer_order_id = <ORDER_ID>;
   ```
   Expected: All three tables have new records ✓

8. **Verify Stock Deduction**
   ```sql
   SELECT id, name, stock_available FROM products 
   WHERE id IN (<PRODUCT_IDS>);
   ```
   Expected: Stock decreased by ordered quantity ✓

**Result:** ✅ PASS if all checks verified

---

### Test 2: Cart Clearing After Payment

**Objective:** Verify cart is cleared after successful payment

**Steps:**

1. Complete Test 1 (successful payment)
2. Navigate back to `/customer/cart`
3. Expected: Cart shows empty state with message "Your cart is empty"
4. Verify database: `DELETE FROM customer_cart_items WHERE cust_id = <CUSTOMER_ID>`

**Result:** ✅ PASS if cart is empty

---

### Test 3: Order Confirmation Page

**Objective:** Verify order details display correctly

**Steps:**

1. Complete Test 1
2. OrderConfirmation page should be showing
3. Verify all sections:

   **Order Header Section:**
   - Order number displays
   - Order ID displays
   - Success banner visible
   - ✓ All fields present

   **Order Status Cards:**
   - Order Number card shows correct order_no ✓
   - Payment Status shows "PAID" in green ✓
   - Order Status shows "PROCESSING" in blue ✓

   **Order Items Section:**
   - Each item shows:
     - Product name ✓
     - Quantity ✓
     - Unit price ✓
     - Line total ✓
   - Total amount matches database ✓

   **Payment Details Section (if visible):**
   - Payment method: "razorpay" ✓
   - Reference: payment_id ✓
     - Payment date: Today's date ✓

   **Navigation Buttons:**
   - "Back to Home" button works ✓
   - "Continue Shopping" button works ✓

**Result:** ✅ PASS if all sections display correctly

---

### Test 4: My Orders Page

**Objective:** Verify order history displays correctly

**Steps:**

1. Complete Test 1
2. Navigate to `/customer/my-orders`
3. Expected: MyOrders page loads

   **Header Section:**
   - Title "My Orders" ✓
   - Shows order count ✓

   **Statistics Cards:**
   - Total Orders: Shows 1 ✓
   - Completed: Shows 0 ✓
   - Processing: Shows 1 ✓
   - Cancelled: Shows 0 ✓

   **Orders Table:**
   - Order number appears ✓
   - Date shows today ✓
   - Amount shows correct total ✓
   - Status shows "PROCESSING" in blue ✓
   - Payment shows "PAID" in green ✓
   - "View" button appears ✓

4. Click "View" button
5. Expected: Redirects to OrderConfirmation page for that order

**Result:** ✅ PASS if all sections display and function correctly

---

### Test 5: Payment Failure Scenario

**Objective:** Verify error handling for failed payments

**Steps:**

1. Go to `/customer/products`
2. Add items to cart
3. Navigate to `/customer/cart`
4. Click "Proceed to Checkout"
5. Click "Proceed to Payment"
6. Enter failed test card:
   - Card Number: `4444333322221111`
   - Expiry: `12/25`
   - CVV: `123`
   - OTP: `111111`

7. Expected: Payment fails
8. Verify Razorpay modal stays open or shows error
9. Go back to cart
10. Expected: Cart items still there (not cleared)

**Result:** ✅ PASS if error handled gracefully

---

### Test 6: Empty Cart Checkout

**Objective:** Verify validation for empty cart

**Steps:**

1. Clear cart: `DELETE FROM customer_cart_items WHERE cust_id = <CUSTOMER_ID>;`
2. Refresh page
3. Click "Proceed to Checkout"
4. Expected: Toast notification "Cart is empty" appears
5. Expected: CheckoutModal does NOT open

**Result:** ✅ PASS if validation works

---

### Test 7: Order Cancellation

**Objective:** Verify pending order cancellation

**Steps:**

1. Create a new order (Test 1)
2. Don't complete payment (or use failed card)
3. Order should have status='pending' and payment_status != 'paid'
4. Navigate to `/customer/my-orders`
5. Find the pending order
6. Click "Cancel" button
7. Expected: Confirmation dialog appears
8. Click "Yes, Cancel Order"
9. Expected: Order status changes to "CANCELLED"
10. Verify database: `SELECT status FROM customer_orders WHERE id = <ORDER_ID>;`

**Result:** ✅ PASS if order cancelled successfully

---

### Test 8: Authorization Check

**Objective:** Verify customers can't see other customers' orders

**Steps:**

1. Login as Customer A
2. Complete Test 1 to create Order A
3. Note order ID (e.g., 5)
4. Logout
5. Login as Customer B
6. Navigate to `/customer/order-confirmation/5`
7. Expected: Error page or redirect (403 Forbidden)
8. Navigate to `/api/orders/5` in browser
9. Expected: 403 Forbidden response

**Result:** ✅ PASS if authorization works

---

### Test 9: Stock Validation

**Objective:** Verify stock can't be exceeded

**Steps:**

1. Find a product with limited stock (e.g., 5 units)
2. Go to product detail page
3. Add to cart with quantity > available stock
4. Expected: Either warning or max quantity enforced
5. If allowed to proceed:
   - Go to cart
   - Try to increase quantity > stock
   - Expected: Checkout validation should fail

**Result:** ✅ PASS if stock validation works

---

### Test 10: Responsive Design

**Objective:** Verify UI works on different screen sizes

**Steps:**

1. Open checkout modal on desktop (1920px width)
   - Expected: 3-column layout for modal ✓
   - Expected: All content readable ✓

2. Resize to tablet (768px width)
   - Expected: Layout adjusts ✓
   - Expected: Items still readable ✓

3. Resize to mobile (375px width)
   - Expected: 1-column layout ✓
   - Expected: Table becomes scrollable ✓
   - Expected: Buttons stack vertically ✓

4. Test OrderConfirmation page
   - Desktop: Cards in 3 columns ✓
   - Tablet: Cards in 2 columns ✓
   - Mobile: Cards in 1 column ✓

**Result:** ✅ PASS if responsive on all sizes

---

### Test 11: Light/Dark Mode

**Objective:** Verify UI works in light and dark modes

**Steps:**

1. Open CheckoutModal
2. Toggle light/dark mode (using Chakra's color mode toggle)
3. Expected: Colors change appropriately ✓

4. Open OrderConfirmation page
5. Toggle light/dark mode
6. Expected: Text contrast is good ✓
7. Expected: All elements visible in both modes ✓

8. Open MyOrders page
9. Toggle light/dark mode
10. Expected: Table readable in both modes ✓

**Result:** ✅ PASS if colors appropriate in both modes

---

### Test 12: Network Error Handling

**Objective:** Verify graceful handling of network failures

**Steps:**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Set throttling to "Offline"
4. Go to `/customer/cart`
5. Click "Proceed to Checkout"
6. Click "Proceed to Payment"
7. Expected: Error toast appears
8. Expected: Modal stays open for retry
9. Turn network back online
10. Try payment again
11. Expected: Payment succeeds

**Result:** ✅ PASS if error handling works

---

## Database Verification Queries

### Verify Order Created
```sql
SELECT * FROM customer_orders 
WHERE cust_id = <CUSTOMER_ID> 
ORDER BY created_at DESC LIMIT 1;

-- Expected columns:
-- id, cust_id, order_no (like ORD-XXXX-XXXX)
-- status = 'processing'
-- payment_status = 'paid'
-- total_amount > 0
```

### Verify Order Items
```sql
SELECT * FROM customer_order_items 
WHERE customer_order_id = <ORDER_ID>;

-- Expected for each item:
-- product_id (valid product)
-- qty > 0
-- unit_price > 0
-- total_amount = qty * unit_price
```

### Verify Payment
```sql
SELECT * FROM customer_payments 
WHERE customer_order_id = <ORDER_ID>;

-- Expected:
-- amount matches order total
-- payment_date = today
-- method = 'razorpay'
-- reference = razorpay_payment_id
```

### Verify Stock Deducted
```sql
SELECT id, name, stock_available FROM products 
WHERE id IN (<PRODUCT_IDS>);

-- Expected:
-- stock_available decreased by ordered qty
-- If was 10 and ordered 2, now shows 8
```

### Verify Cart Cleared
```sql
SELECT * FROM customer_cart_items 
WHERE cust_id = <CUSTOMER_ID>;

-- Expected:
-- No rows returned (empty)
```

---

## API Testing (Using Postman/Insomnia)

### Test: Create Order
```
POST http://localhost:5000/api/orders/create-razorpay-order
Headers: 
  Content-Type: application/json
  Authorization: Bearer <JWT_TOKEN>

Body:
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 99.99
    },
    {
      "product_id": 2,
      "quantity": 1,
      "unit_price": 149.99
    }
  ],
  "totalAmount": 349.97,
  "taxAmount": 34.997,
  "shippingAmount": 0
}

Expected Response (200):
{
  "success": true,
  "razorpayOrderId": "order_XXXX",
  "key": "rzp_test_XXXX",
  "amount": 34997,
  "orderId": 5,
  "user": { "name": "...", "email": "...", "phone": "..." }
}
```

### Test: Verify Payment
```
POST http://localhost:5000/api/orders/verify-payment
Headers: 
  Content-Type: application/json
  Authorization: Bearer <JWT_TOKEN>

Body:
{
  "razorpay_order_id": "order_XXXX",
  "razorpay_payment_id": "pay_XXXX",
  "razorpay_signature": "signature_XXXX",
  "orderId": 5
}

Expected Response (200):
{
  "success": true,
  "orderNo": "ORD-1234567890-ABCD",
  "totalAmount": 349.97
}
```

### Test: Get Order
```
GET http://localhost:5000/api/orders/5
Headers:
  Authorization: Bearer <JWT_TOKEN>

Expected Response (200):
{
  "order": { ... },
  "items": [ ... ],
  "payment": { ... }
}
```

### Test: Get All Orders
```
GET http://localhost:5000/api/orders
Headers:
  Authorization: Bearer <JWT_TOKEN>

Expected Response (200):
{
  "count": 1,
  "orders": [ ... ]
}
```

---

## Performance Benchmarks

### Expected Response Times
- Create Order API: < 500ms
- Verify Payment API: < 1000ms
- Get Order API: < 300ms
- Database Queries: < 100ms

### Expected Load Capacity
- Concurrent Users: 100+
- Requests/Second: 50+
- Payment Processing: < 2 seconds

---

## Security Checklist

- [ ] Signature verification works correctly
- [ ] Unauthorized users can't view other orders
- [ ] Stock validation prevents overselling
- [ ] Amount can't be manipulated
- [ ] Cart clears only after successful payment
- [ ] Orders can't be created without auth
- [ ] Payment details are never exposed to frontend

---

## Browser Compatibility

Test in these browsers:
- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Edge (Latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Common Issues & Resolutions

| Issue | Symptom | Resolution |
|-------|---------|------------|
| Razorpay not loading | Modal doesn't open | Check CDN access, clear cache |
| Signature mismatch | Payment fails on verify | Verify RAZORPAY_KEY_SECRET in .env |
| Stock not deducted | Stock stays same | Check if payment_status is 'paid' |
| Order not created | No data in DB | Check customer ID, cart validation |
| Cart not clearing | Items persist after payment | Verify clearCart() in success callback |

---

## Final Checklist

- [ ] All 12 test scenarios pass
- [ ] Database has correct data
- [ ] No console errors
- [ ] No network errors
- [ ] All pages load quickly
- [ ] All buttons work
- [ ] All validations work
- [ ] Error messages are clear
- [ ] Mobile view works
- [ ] Dark mode works
- [ ] Payment flow is smooth
- [ ] Order confirmation shows correctly

---

## Sign-Off

- **Backend Implementation:** ✅ Complete
- **Frontend Implementation:** ✅ Complete
- **Database Integration:** ✅ Complete
- **Testing Guide:** ✅ Complete
- **Documentation:** ✅ Complete

**Status:** Ready for production testing
