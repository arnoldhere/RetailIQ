# Ask-Bid-Supply Order Flow Documentation

## 🔄 Complete Flow Overview

The RetailIQ system has **TWO distinct supply order pathways**:

### **Path 1: Ask-Bid-Accept Flow (Competitive Bidding)**
Admin creates RFQ → Suppliers place bids → Admin accepts winning bid → Supply order auto-created

### **Path 2: Direct Supply Order Flow**
Supplier directly creates supply order → Appears in Admin's Supplier Orders list

---

## 📋 Path 1: Ask-Bid-Accept Flow (Detailed)

### Step 1: Admin Creates Ask (RFQ - Request For Quotation)
```
POST /api/admin/asks
Body: {
  product_id: 5,
  quantity: 100,
  min_price: 50.00,
  expires_at: "2025-02-01",
  note: "Urgent supply needed"
}
```

**What Happens:**
- Admin creates an ask for a specific product and quantity
- Ask status = 'open'
- Suppliers can now view this ask

**Database:**
- Record created in `asks` table
- Fields: product_id, quantity, min_price, expires_at, status='open', created_by

---

### Step 2: Suppliers View Open Asks (Bids Section)
```
GET /api/user/supplier/asks?limit=20&offset=0
```

**Response:**
```json
{
  "asks": [
    {
      "id": 1,
      "product_id": 5,
      "product_name": "Widget A",
      "quantity": 100,
      "min_price": 50.00,
      "status": "open",
      "expires_at": "2025-02-01",
      "note": "Urgent supply needed"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

**Key Points:**
- Only 'open' asks are shown to suppliers
- Suppliers can see product details with the ask
- This is where suppliers find bidding opportunities

---

### Step 3: Supplier Places Bid
```
POST /api/user/supplier/asks/:askId/bids
Body: {
  price: 65.00,
  quantity: 100,
  message: "Can supply within 5 days"
}
```

**What Happens:**
- Supplier submits price, quantity, and optional message
- Bid status = 'pending'
- Recorded with supplier_id (automatically from auth token)

**Database:**
- Record created in `bids` table
- Fields: ask_id, supplier_id, price, quantity, message, status='pending'

**Admin Visibility:**
- Admin can view all bids for an ask at: `GET /api/admin/bids?ask_id=1`

---

### Step 4: Admin Accepts Winning Bid
```
POST /api/admin/bids/:bidId/accept
Body: {
  store_id: 3,
  deliver_at: "2025-01-30"
}
```

**This is the CRITICAL transaction that:**

1. ✅ Marks selected bid as 'accepted'
2. ✅ Rejects all other bids for this ask
3. ✅ Closes the ask
4. ✅ **AUTO-CREATES SUPPLY ORDER** ⭐ (This is KEY!)
5. ✅ Creates supply_order_items
6. ✅ Creates supply_payments record (status='pending')
7. ✅ Sends email notification to supplier

**Generated Supply Order:**
```json
{
  "id": 101,
  "order_no": "SO-1706123456-456",
  "supplier_id": 5,
  "store_id": 3,
  "status": "pending",
  "total_amount": 6500.00,
  "ordered_by": 1,
  "deliver_at": "2025-01-30",
  "created_at": "2025-01-25T10:00:00Z"
}
```

**Database Changes:**
- `supply_orders`: New order record
- `supply_order_items`: Line items from bid
- `supply_payments`: Initial payment record (status='pending')
- `bids`: Updated status to 'accepted' (winning bid)
- `bids`: Updated status to 'rejected' (losing bids)
- `asks`: Updated status to 'closed'

**Email Sent to Supplier:**
```
Subject: Your bid #1 has been accepted and order SO-1706123456-456 created
Body: Your bid for ask #1 has been accepted by admin and a supply order (SO-1706123456-456) has been created. Order total: $6500.00
```

---

### Step 5: Supplier Tracks Order
```
GET /api/user/supplier/orders
GET /api/user/supplier/orders/:orderId
```

**Supplier Can Now:**
- View all their supply orders ✅
- See order status (pending → sent → received)
- View order items
- Track payment status

---

### Step 6: Admin Manages Order & Payment
```
GET /api/admin/supplier-orders
```

**Admin Can:**
- View all supply orders from all suppliers ✅
- Search by order number, supplier name, store
- Filter by status
- Sort by amount, date, supplier, delivery date
- View payment details
- Record payments
- Update order status

**Payment Tracking:**
```
GET /api/admin/supplier-orders/:orderId/payments
POST /api/admin/supplier-orders/:orderId/payments
Body: {
  amount: 6500.00,
  payment_date: "2025-01-28",
  method: "BANK_TRANSFER",
  payment_ref: "TXN-123456"
}
```

---

## 📋 Path 2: Direct Supply Order Creation

### Alternative: Supplier Creates Supply Order Directly
```
POST /api/user/supplier/orders
Body: {
  product_id: 5,
  store_id: 3,
  quantity: 50,
  cost: 70.00,
  deliver_at: "2025-02-05"
}
```

**What Happens:**
- Supplier directly creates a supply order (without ask-bid process)
- Order status = 'pending'
- Appears immediately in Admin's Supplier Orders list
- **NOT** tied to any ask or bid

**Database:**
- `supply_orders`: New record
- `supply_order_items`: Line items

**This Direct Flow:**
- Skips the competitive bidding
- Faster for pre-established relationships
- Admin still manages payment

---

## 🎯 Key Endpoints Summary

### Admin Endpoints (Ask-Bid Management):
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/asks` | POST | Create new ask (RFQ) |
| `/api/admin/asks` | GET | List all asks |
| `/api/admin/asks/:id` | GET | View ask details with all bids |
| `/api/admin/asks/:id/close` | POST | Close ask (no more bids) |
| `/api/admin/bids` | GET | View all bids for an ask |
| `/api/admin/bids/:id/accept` | POST | **ACCEPT BID → CREATE ORDER** ⭐ |

### Admin Endpoints (Order Management):
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/supplier-orders` | GET | List all supplier orders (with sort/filter) |
| `/api/admin/supplier-orders/:id/status` | POST | Update order status |
| `/api/admin/supplier-orders/:id/payments` | GET | View payments for order |
| `/api/admin/supplier-orders/:id/payments` | POST | Record new payment |

### Supplier Endpoints:
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/user/supplier/asks` | GET | View open asks (bidding opportunities) |
| `/api/user/supplier/asks/:askId/bids` | POST | Place bid on ask |
| `/api/user/supplier/bids` | GET | View my bids and their status |
| `/api/user/supplier/orders` | GET | View my supply orders |
| `/api/user/supplier/orders/:id` | GET | View order details, items, payments |
| `/api/user/supplier/orders` | POST | Create supply order directly |

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN CREATES ASK                           │
│                    POST /api/admin/asks                             │
│           { product_id, quantity, min_price, expires_at }          │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ↓
                    asks.status = 'open'
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│               SUPPLIERS VIEW OPEN ASKS (BIDS SECTION)               │
│                  GET /api/user/supplier/asks                        │
│                    Supplier sees bidding opportunities              │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ↓
              ┌───────────────┴───────────────┐
              │ Multiple suppliers place bids  │
              │ POST /api/user/supplier/asks/  │
              │         :askId/bids            │
              └───────────────┬───────────────┘
                              │
                              ↓
                   bids.status = 'pending'
                   (Multiple bids in table)
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   ADMIN REVIEWS BIDS                                │
│              GET /api/admin/bids?ask_id=1                           │
│           Admin sees all bids, selects winning bid                  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ↓
          ┌─────────────────────────────────────────┐
          │  ADMIN ACCEPTS WINNING BID (CRITICAL)   │
          │  POST /api/admin/bids/:bidId/accept     │
          │      { store_id, deliver_at }           │
          └─────────────┬───────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ↓                           ↓
   Winning bid accepted     Other bids rejected
   status='accepted'         status='rejected'
          │                           │
          ├───────────────┬───────────┘
          │               │
          ↓               ↓
    Ask status       supply_order created ⭐
    = 'closed'       supply_order_items created
                     supply_payments created (status='pending')
                     Email sent to supplier
          │
          ↓
┌─────────────────────────────────────────────────────────────────────┐
│              SUPPLY ORDER IN ADMIN ORDERS LIST                      │
│            GET /api/admin/supplier-orders (with sort/filter)        │
│  Admin can:                                                          │
│  - Sort by: amount, date, status, supplier, delivery date          │
│  - Filter by: search, status                                        │
│  - View/record payments                                             │
│  - Update order status                                              │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│            SUPPLIER TRACKS ORDER IN THEIR DASHBOARD                │
│               GET /api/user/supplier/orders                         │
│  Supplier can:                                                       │
│  - See order status changes                                          │
│  - View payment status                                               │
│  - Confirm receipt when status='received'                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security & Validation

### Authorization Checks:
- ✅ Admin only: Create ask, accept bid, view all orders
- ✅ Supplier only: View asks, place bids, view own orders
- ✅ Data isolation: Suppliers can only see their own orders
- ✅ Ask validation: Only 'open' asks accept bids
- ✅ Bid validation: Only pending bids can be accepted

### Database Constraints:
- ✅ Foreign keys ensure referential integrity
- ✅ Transaction atomicity on critical operations (accept bid)
- ✅ Status transitions validated
- ✅ Amount calculations verified

---

## 🚀 Integration Checklist

- [x] Admin can create asks
- [x] Suppliers can view open asks
- [x] Suppliers can place multiple bids
- [x] Admin can view all bids for an ask
- [x] **Admin accepts bid → Auto-creates supply order** ✅
- [x] Supply order appears in admin list
- [x] Supplier gets email notification
- [x] Admin can manage order status
- [x] Admin can record payments
- [x] Payment tracking initialized on order creation
- [x] Suppliers can view their orders and payment status

## ✨ What Works:

1. **Complete Ask-Bid Flow** ✅
   - Admin creates asks
   - Suppliers bid competitively
   - Admin accepts winning bid
   - Order auto-created with payment record

2. **Order Management** ✅
   - Admin has full control in supplier orders menu
   - Can filter, sort, search orders
   - Can manage payments for each order

3. **Notifications** ✅
   - Supplier gets email when bid accepted
   - Order details emailed

4. **Dashboard Visibility** ✅
   - Admin sees all supplier orders
   - Suppliers see their own orders with payment status
   - Real-time KPIs on supplier dashboard

---

## 🔧 Testing the Flow End-to-End

1. **As Admin**:
   - Create an ask: `POST /api/admin/asks`
   - View asks: `GET /api/admin/asks`
   - Wait for supplier bids

2. **As Supplier**:
   - View open asks: `GET /api/user/supplier/asks`
   - Place bid: `POST /api/user/supplier/asks/:askId/bids`

3. **As Admin**:
   - View bids: `GET /api/admin/bids?ask_id=1`
   - Accept winning bid: `POST /api/admin/bids/:bidId/accept`
   - Verify supply order created: `GET /api/admin/supplier-orders`

4. **As Supplier**:
   - Check email for order notification
   - View orders: `GET /api/user/supplier/orders`
   - See payment status

5. **As Admin**:
   - View order details
   - Record payment: `POST /api/admin/supplier-orders/:orderId/payments`
   - Update order status

---

**Last Updated**: January 25, 2026
**Status**: ✅ FULLY IMPLEMENTED & DOCUMENTED
