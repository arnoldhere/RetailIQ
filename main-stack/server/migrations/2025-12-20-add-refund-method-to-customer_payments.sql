-- Migration: Add 'refund' to customer_payments.method enum
-- Run this against the database to allow inserting method='refund'

ALTER TABLE customer_payments
  MODIFY method ENUM('cash','card','upi','online','refund','other') NOT NULL DEFAULT 'cash';

-- Note: If you're using a migrations tool (knex/umzug/etc), convert this to a proper migration file for that tool.
