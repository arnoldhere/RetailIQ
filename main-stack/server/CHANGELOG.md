# Changelog

## Unreleased

- Enhance order cancellation
  - Allow customers to cancel orders within 3 days of placement (including paid orders)
  - Initiate refunds automatically for online payments (Razorpay) when possible
  - Insert refund entries into `customer_payments` and set `customer_orders.payment_status` to `refunded` or `refund_pending`
  - Restock products on cancellation and notify customers by email
  - Add `cancelled_at`, `cancel_reason`, and `refund_status` columns to `customer_orders` DDL (see `models/sql/db_setup_ddl.sql`)

## Hotfix (2025-12-20)
- Fix: allow `method='refund'` in `customer_payments.method` ENUM to avoid Data truncated errors when recording refunds. See migration `server/migrations/2025-12-20-add-refund-method-to-customer_payments.sql`.


Please run the updated DDL or migrations to add new columns before using the cancellation/refund features in production.