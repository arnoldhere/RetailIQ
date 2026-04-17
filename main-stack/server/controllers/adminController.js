const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const emailService = require("../services/mailService")

// media products dir
const MEDIA_PRODUCTS_DIR = path.join(__dirname, '..', 'media', 'products');
if (!fs.existsSync(MEDIA_PRODUCTS_DIR)) {
  fs.mkdirSync(MEDIA_PRODUCTS_DIR, { recursive: true });
}

let supplyOrdersStockColumnPromise = null;

function normalizeCount(row) {
  if (!row) return 0;
  return Number(row.count || row['COUNT(*)'] || Object.values(row)[0] || 0);
}

function formatDateOnly(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 19)}`;
}

function formatCurrency(value) {
  return Number(value || 0).toFixed(2);
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const normalized = String(value).replace(/\r?\n|\r/g, ' ').trim();
  if (/[",]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function toCsv(rows) {
  const safeRows = Array.isArray(rows) && rows.length ? rows : [{ message: 'No data available' }];
  const headers = Object.keys(safeRows[0]);
  const lines = [
    headers.join(','),
    ...safeRows.map((row) => headers.map((key) => csvEscape(row[key])).join(',')),
  ];
  return Buffer.from(lines.join('\n'), 'utf8');
}

function escapePdfText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '?');
}

function wrapPdfLine(value, maxLength = 92) {
  const text = String(value ?? '').trim();
  if (!text) return [''];

  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    if (`${current} ${word}`.length <= maxLength) {
      current = `${current} ${word}`;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines;
}

function humanizeKey(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function createPdfBuffer(title, summaryLines = [], tableLines = []) {
  const combinedLines = [
    ...summaryLines,
    ...(summaryLines.length && tableLines.length ? [''] : []),
    ...tableLines,
  ];

  const wrappedLines = combinedLines
    .flatMap((line) => wrapPdfLine(line))
    .slice(0, 48);

  const commands = [
    'BT',
    '/F1 18 Tf',
    '50 800 Td',
    `(${escapePdfText(title)}) Tj`,
    'ET',
  ];

  let y = 774;
  for (const line of wrappedLines) {
    commands.push(
      'BT',
      '/F1 10 Tf',
      `50 ${y} Td`,
      `(${escapePdfText(line)}) Tj`,
      'ET'
    );
    y -= 14;
    if (y < 50) break;
  }

  const stream = commands.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj`,
  ];

  const header = '%PDF-1.4\n';
  let body = '';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(header + body, 'utf8'));
    body += `${object}\n`;
  }

  const xrefStart = Buffer.byteLength(header + body, 'utf8');
  const xrefEntries = offsets
    .map((offset, index) => (
      index === 0
        ? '0000000000 65535 f '
        : `${String(offset).padStart(10, '0')} 00000 n `
    ))
    .join('\n');

  const trailer = `xref\n0 ${objects.length + 1}\n${xrefEntries}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(`${header}${body}${trailer}`, 'utf8');
}

function getCurrentStamp() {
  return formatDateOnly(new Date()) || 'report';
}

function getIntervalBucketKey(value, interval) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  if (interval === 'year') return String(year);
  if (interval === 'month') return `${year}-${month}`;
  if (interval === 'day') return `${year}-${month}-${day}`;

  const utcDate = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
  const weekYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const weekNumber = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
  return `${weekYear}-W${String(weekNumber).padStart(2, '0')}`;
}

function rowsToPdfLines(rows) {
  return rows.map((row) => Object.entries(row).map(([key, value]) => `${humanizeKey(key)}: ${value ?? ''}`).join(' | '));
}

async function buildUsersListReport() {
  const users = await db('users')
    .select('id', 'firstname', 'lastname', 'email', 'phone', 'role', 'gender', 'date_of_birth', 'is_active', 'created_at')
    .orderBy('created_at', 'desc');

  const rows = users.map((user) => ({
    id: user.id,
    name: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || '',
    gender: user.gender || '',
    date_of_birth: formatDateOnly(user.date_of_birth),
    status: user.is_active ? 'Active' : 'Inactive',
    created_at: formatDateTime(user.created_at),
  }));

  const activeCount = users.filter((user) => user.is_active).length;

  return {
    title: 'Users List Report',
    filename: `users-list-${getCurrentStamp()}`,
    rows,
    summaryLines: [
      `Generated on: ${formatDateTime(new Date())}`,
      `Total users: ${users.length}`,
      `Active users: ${activeCount}`,
      `Inactive users: ${users.length - activeCount}`,
    ],
  };
}

async function buildSignupGrowthReport(interval = 'month') {
  const users = await db('users')
    .select('id', 'role', 'created_at')
    .whereNot('role', 'admin')
    .orderBy('created_at', 'asc');

  const bucketMap = new Map();

  for (const user of users) {
    const bucket = getIntervalBucketKey(user.created_at, interval);
    if (!bucket) continue;

    if (!bucketMap.has(bucket)) {
      bucketMap.set(bucket, {
        period: bucket,
        new_signups: 0,
        customers: 0,
        suppliers: 0,
        store_managers: 0,
      });
    }

    const row = bucketMap.get(bucket);
    row.new_signups += 1;
    if (user.role === 'customer') row.customers += 1;
    if (user.role === 'supplier') row.suppliers += 1;
    if (user.role === 'store_manager') row.store_managers += 1;
  }

  const rows = Array.from(bucketMap.values()).sort((a, b) => a.period.localeCompare(b.period));

  return {
    title: `User Signup Growth Report (${humanizeKey(interval)})`,
    filename: `user-signup-growth-${interval}-${getCurrentStamp()}`,
    rows,
    summaryLines: [
      `Generated on: ${formatDateTime(new Date())}`,
      `Interval: ${interval}`,
      `Tracked signups: ${users.length}`,
      `Buckets generated: ${rows.length}`,
    ],
  };
}

async function buildCustomerOrdersReport() {
  const orders = await db('customer_orders')
    .select(
      'customer_orders.order_no',
      'customer_orders.status',
      'customer_orders.payment_status',
      'customer_orders.payment_method',
      'customer_orders.total_amount',
      'customer_orders.created_at',
      'users.firstname',
      'users.lastname',
      'users.email as customer_email',
      'stores.name as store_name'
    )
    .leftJoin('users', 'customer_orders.cust_id', 'users.id')
    .leftJoin('stores', 'customer_orders.store_id', 'stores.id')
    .orderBy('customer_orders.created_at', 'desc');

  const rows = orders.map((order) => ({
    order_no: order.order_no,
    customer_name: `${order.firstname || ''} ${order.lastname || ''}`.trim(),
    customer_email: order.customer_email || '',
    store_name: order.store_name || '',
    status: order.status || '',
    payment_status: order.payment_status || '',
    payment_method: order.payment_method || '',
    total_amount_inr: formatCurrency(order.total_amount),
    created_at: formatDateTime(order.created_at),
  }));

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  return {
    title: 'Customer Orders Detail Report',
    filename: `customer-orders-${getCurrentStamp()}`,
    rows,
    summaryLines: [
      `Generated on: ${formatDateTime(new Date())}`,
      `Total orders: ${orders.length}`,
      `Aggregate order value: INR ${formatCurrency(totalRevenue)}`,
    ],
  };
}

async function buildTransactionalTrafficReport() {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 30);

  const orders = await db('customer_orders')
    .select('order_no', 'status', 'payment_status', 'total_amount', 'created_at')
    .where('created_at', '>=', cutoff)
    .orderBy('created_at', 'asc');

  const buckets = new Map();

  for (const order of orders) {
    const bucket = formatDateOnly(order.created_at);
    if (!bucket) continue;

    if (!buckets.has(bucket)) {
      buckets.set(bucket, {
        date: bucket,
        total_orders: 0,
        paid_orders: 0,
        cancelled_orders: 0,
        gross_amount_inr: '0.00',
      });
    }

    const row = buckets.get(bucket);
    row.total_orders += 1;
    if (order.payment_status === 'paid') row.paid_orders += 1;
    if (order.status === 'cancelled') row.cancelled_orders += 1;
    row.gross_amount_inr = formatCurrency(Number(row.gross_amount_inr) + Number(order.total_amount || 0));
  }

  const rows = Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
  const paidOrders = orders.filter((order) => order.payment_status === 'paid').length;
  const grossAmount = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  return {
    title: 'Transactional Traffic Report',
    filename: `transactional-traffic-${getCurrentStamp()}`,
    rows,
    summaryLines: [
      `Generated on: ${formatDateTime(new Date())}`,
      `Window: last 30 days`,
      `Transactions captured: ${orders.length}`,
      `Paid transactions: ${paidOrders}`,
      `Gross order value: INR ${formatCurrency(grossAmount)}`,
    ],
  };
}

async function buildOrdersSummaryReport() {
  const customerOrders = await db('customer_orders')
    .select('status', 'payment_status', 'total_amount');
  const supplyOrders = await db('supply_orders')
    .select('status', 'total_amount');

  const rows = [
    {
      channel: 'Customer Orders',
      total_orders: customerOrders.length,
      completed_orders: customerOrders.filter((order) => order.status === 'completed').length,
      cancelled_orders: customerOrders.filter((order) => order.status === 'cancelled').length,
      paid_orders: customerOrders.filter((order) => order.payment_status === 'paid').length,
      total_value_inr: formatCurrency(customerOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)),
    },
    {
      channel: 'Supply Orders',
      total_orders: supplyOrders.length,
      completed_orders: supplyOrders.filter((order) => order.status === 'received').length,
      cancelled_orders: supplyOrders.filter((order) => order.status === 'cancelled').length,
      paid_orders: '',
      total_value_inr: formatCurrency(supplyOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)),
    },
  ];

  return {
    title: 'Orders Summary Report',
    filename: `orders-summary-${getCurrentStamp()}`,
    rows,
    summaryLines: [
      `Generated on: ${formatDateTime(new Date())}`,
      `Customer channels covered: ${customerOrders.length} orders`,
      `Supply channels covered: ${supplyOrders.length} orders`,
    ],
  };
}

async function buildSupplierReport() {
  const suppliers = await db('suppliers')
    .select('id', 'name', 'email', 'phone', 'rating', 'is_active', 'created_at')
    .orderBy('created_at', 'desc');

  const orderStatsRows = await db('supply_orders')
    .select('supplier_id')
    .count({ total_orders: 'id' })
    .sum({ total_order_value: 'total_amount' })
    .groupBy('supplier_id');

  const receivedStatsRows = await db('supply_orders')
    .select('supplier_id')
    .count({ received_orders: 'id' })
    .where('status', 'received')
    .groupBy('supplier_id');

  const paymentStatsRows = await db('supply_payments')
    .select('supplier_id')
    .sum({ payments_received: 'amount' })
    .groupBy('supplier_id');

  const orderStats = new Map(orderStatsRows.map((row) => [Number(row.supplier_id), row]));
  const receivedStats = new Map(receivedStatsRows.map((row) => [Number(row.supplier_id), row]));
  const paymentStats = new Map(paymentStatsRows.map((row) => [Number(row.supplier_id), row]));

  const rows = suppliers.map((supplier) => {
    const supplierOrders = orderStats.get(Number(supplier.id)) || {};
    const receivedOrders = receivedStats.get(Number(supplier.id)) || {};
    const payments = paymentStats.get(Number(supplier.id)) || {};

    return {
      supplier_id: supplier.id,
      supplier_name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      rating: supplier.rating ?? '',
      status: supplier.is_active ? 'Active' : 'Inactive',
      total_orders: Number(supplierOrders.total_orders || 0),
      received_orders: Number(receivedOrders.received_orders || 0),
      total_order_value_inr: formatCurrency(supplierOrders.total_order_value),
      payments_received_inr: formatCurrency(payments.payments_received),
      created_at: formatDateTime(supplier.created_at),
    };
  });

  return {
    title: 'Supplier Report',
    filename: `suppliers-${getCurrentStamp()}`,
    rows,
    summaryLines: [
      `Generated on: ${formatDateTime(new Date())}`,
      `Suppliers covered: ${suppliers.length}`,
      `Active suppliers: ${suppliers.filter((supplier) => supplier.is_active).length}`,
    ],
  };
}

async function buildExportPayload(report, interval) {
  if (report === 'signup_growth') return buildSignupGrowthReport(interval);
  if (report === 'orders_details') return buildCustomerOrdersReport();
  if (report === 'transactional_traffic') return buildTransactionalTrafficReport();
  if (report === 'orders_report') return buildOrdersSummaryReport();
  if (report === 'supplier_report') return buildSupplierReport();
  return buildUsersListReport();
}

function normalizeAnalyticsDate(value, fallback) {
  const date = value ? new Date(value) : new Date(fallback);
  if (Number.isNaN(date.getTime())) return new Date(fallback);
  return date;
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function subtractDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy;
}

function subtractYears(date, years) {
  const copy = new Date(date);
  copy.setFullYear(copy.getFullYear() - years);
  return copy;
}

function parseAnalyticsFilters(query = {}) {
  const allowedRanges = new Set(['7d', '30d', '90d', '365d', 'custom']);
  const allowedIntervals = new Set(['day', 'week', 'month']);
  const today = new Date();

  const range = allowedRanges.has(query.range) ? query.range : '30d';
  const interval = allowedIntervals.has(query.interval) ? query.interval : 'day';
  const storeId = query.store_id ? Number(query.store_id) : null;

  let endDate = endOfDay(today);
  let startDate = startOfDay(subtractDays(today, 29));

  if (range === '7d') startDate = startOfDay(subtractDays(today, 6));
  if (range === '90d') startDate = startOfDay(subtractDays(today, 89));
  if (range === '365d') startDate = startOfDay(subtractDays(today, 364));

  if (range === 'custom') {
    startDate = startOfDay(normalizeAnalyticsDate(query.start_date, subtractDays(today, 29)));
    endDate = endOfDay(normalizeAnalyticsDate(query.end_date, today));

    if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }
  }

  const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
  const previousEndDate = endOfDay(subtractDays(startDate, 1));
  const previousStartDate = startOfDay(subtractDays(previousEndDate, durationDays - 1));

  return {
    range,
    interval,
    storeId: Number.isFinite(storeId) && storeId > 0 ? storeId : null,
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
  };
}

function settledValue(result, fallback, warnings, label) {
  if (result.status === 'fulfilled') return result.value;
  warnings.push(`${label} unavailable`);
  console.error(`analytics section failed: ${label}`, result.reason);
  return fallback;
}

function sumValues(items, selector) {
  return items.reduce((sum, item) => sum + Number(selector(item) || 0), 0);
}

function percentage(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function growthPct(current, previous) {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function buildBucketSeries(items, interval, createInitialValue, applyItem) {
  const buckets = new Map();

  for (const item of items) {
    const key = getIntervalBucketKey(item.created_at, interval);
    if (!key) continue;

    if (!buckets.has(key)) {
      buckets.set(key, { bucket: key, ...createInitialValue() });
    }

    applyItem(buckets.get(key), item);
  }

  return Array.from(buckets.values()).sort((a, b) => a.bucket.localeCompare(b.bucket));
}

function normalizeImages(images) {
  if (!images) return [];

  // If it’s already an array (in case knex or MySQL JSON type returns real array)
  if (Array.isArray(images)) return images;

  // If it’s an object, you might want to wrap or convert it; for now just return as is
  if (typeof images === 'object') return images;

  if (typeof images === 'string') {
    const trimmed = images.trim();

    // Looks like JSON? Try to parse it
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        // fall through to string fallback
      }
    }

    // Not JSON: treat as a single image URL / data URL
    return [trimmed];
  }

  return [];
}

async function ensureSupplyOrderStockColumn() {
  if (!supplyOrdersStockColumnPromise) {
    supplyOrdersStockColumnPromise = (async () => {
      const hasColumn = await db.schema.hasColumn('supply_orders', 'stock_synced_at');
      if (!hasColumn) {
        await db.schema.alterTable('supply_orders', (table) => {
          table.timestamp('stock_synced_at').nullable();
        });
      }
    })().catch((err) => {
      supplyOrdersStockColumnPromise = null;
      throw err;
    });
  }

  return supplyOrdersStockColumnPromise;
}

async function getSupplyPaymentSummaryData(conn, orderId, totalAmount) {
  const paymentSummary = await conn('supply_payments')
    .where('supply_order_id', orderId)
    .sum('amount as total_paid')
    .first();

  const totalPaid = Number(paymentSummary?.total_paid || 0);
  const remainingAmount = Number(totalAmount || 0) - totalPaid;
  const isFullyPaid = remainingAmount <= 0;

  return {
    totalPaid,
    remainingAmount: Math.max(0, remainingAmount),
    isFullyPaid,
  };
}

async function syncSupplyOrderStockIfEligible(conn, orderId) {
  await ensureSupplyOrderStockColumn();

  const order = await conn('supply_orders').where('id', orderId).first();
  if (!order || order.status !== 'received' || order.stock_synced_at) {
    return false;
  }

  const paymentState = await getSupplyPaymentSummaryData(conn, orderId, order.total_amount);
  if (!paymentState.isFullyPaid) {
    return false;
  }

  const items = await conn('supply_order_items').where('supply_order_id', orderId);
  for (const item of items) {
    await conn('products')
      .where('id', item.product_id)
      .increment('stock_available', item.qty);
  }

  await conn('supply_orders').where('id', orderId).update({ stock_synced_at: new Date() });
  return true;
}

/**
 * Save base64 data URLs to disk and return an array of relative paths.
 * Expected input items like: "data:image/png;base64,AAAA..."
 */
async function saveBase64Images(images, productName) {
  if (!images || !Array.isArray(images)) return [];

  const safeName = (productName || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const savedPaths = [];

  for (let i = 0; i < images.length; i++) {
    const src = images[i];
    if (typeof src !== 'string') continue;

    // Expect "data:image/xxx;base64,...."
    const match = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      console.warn('Skipping invalid image string at index', i);
      continue;
    }

    const mimeType = match[1]; // e.g. "image/png"
    const base64Data = match[2];
    const ext = mimeType.split('/')[1] || 'png';

    const filename = `${safeName}-${Date.now()}-${i}.${ext}`;
    const absolutePath = path.join(MEDIA_PRODUCTS_DIR, filename);

    await fs.promises.writeFile(absolutePath, base64Data, 'base64');

    // relative path to serve later via /media static
    const relativePath = `media/products/${filename}`;
    savedPaths.push(relativePath);
  }

  return savedPaths;
}

exports.overview = async (req, res) => {
  try {
    // basic metrics
    const totalOrdersRow = await db('customer_orders').count('id as count').first();
    const totalSuppliersRow = await db('suppliers').count('id as count').first();
    const totalCustomersRow = await db('users').where('role', 'customer').count('id as count').first();
    const totalProductsRow = await db('products').count('id as count').first();


    const metrics = {
      totalOrders: normalizeCount(totalOrdersRow),
      totalSuppliers: normalizeCount(totalSuppliersRow),
      totalCustomers: normalizeCount(totalCustomersRow),
      totalProducts: normalizeCount(totalProductsRow),
    };

    // recent activities: get latest entries from customer_orders, supply_orders, feedbacks
    const custOrders = await db('customer_orders')
      .select('id', 'order_no as title', 'total_amount as value', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(6);

    const supplyOrders = await db('supply_orders')
      .select('id', 'order_no as title', 'total_amount as value', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(6);

    const feedbacks = await db('feedbacks')
      .select('id', 'message as title', db.raw("NULL as value"), 'created_at')
      .orderBy('created_at', 'desc')
      .limit(6);

    // combine and sort by created_at
    const combined = [
      ...custOrders.map((r) => ({ type: 'customer_order', id: r.id, title: r.title, value: r.value, created_at: r.created_at })),
      ...supplyOrders.map((r) => ({ type: 'supply_order', id: r.id, title: r.title, value: r.value, created_at: r.created_at })),
      ...feedbacks.map((r) => ({ type: 'feedback', id: r.id, title: r.title, value: null, created_at: r.created_at })),
    ];

    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const activities = combined.slice(0, 8);

    return res.json({ metrics, activities });
  } catch (err) {
    console.error('admin overview error', err);
    return res.status(500).json({ message: 'Failed to load admin overview' });
  }
}

exports.listCategories = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;

    // const categories = await Categories.listAll(limit, offset);
    const categories = await db('categories').limit(limit).offset(offset).orderBy('created_at', 'desc');
    // const total = await Categories.count();
    const total = await db('categories').count('id as count').first();

    return res.json({ categories, total, limit, offset });
  } catch (err) {
    console.error('list categories error', err);
    return res.status(500).json({ message: 'Failed to load categories' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category with same name already exists
    const existing = await db('categories').where({ name: name.trim() }).first();
    if (existing) {
      return res.status(409).json({ errors: [{ field: 'name', msg: 'Category name already exists' }] });
    }

    // const category = await Categories.create({ name, description });
    const category = await db('categories').insert({ name: name.trim(), description }).returning('*').then(rows => rows[0]);
    return res.status(201).json({ category });
  } catch (err) {
    console.error('create category error', err);
    if (err.message.includes('Name is required')) {
      return res.status(400).json({ errors: [{ field: 'name', msg: err.message }] });
    }
    return res.status(500).json({ message: 'Failed to create category' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, supplier_id, cost_price, sell_price, stock_available } = req.body;

    // 1) Load existing product
    const existing = await db('products').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Start from existing images in DB
    let imagesArray = existing.images ? normalizeImages(existing.images) : [];

    // 2) Handle incoming images (files / base64 / JSON)
    if (req.files && req.files.length) {
      // New uploaded files replace existing (or you can choose to append)
      imagesArray = req.files.map((f) => `media/products/${f.filename}`);
    } else if (typeof req.body.images !== 'undefined') {
      // Something was explicitly sent in body for images
      let incoming = req.body.images;

      if (typeof incoming === 'string' && incoming.trim().length) {
        try {
          incoming = JSON.parse(incoming);
        } catch (e) {
          // leave as string
        }
      }

      // If incoming contains base64 data URIs, save them to disk
      if (Array.isArray(incoming) && incoming.some((it) => typeof it === 'string' && it.startsWith('data:image'))) {
        const saved = await saveBase64Images(incoming, name || existing.name);
        imagesArray = saved; // or [...imagesArray, ...saved] if you want to append
      } else {
        // Normalize JSON/strings/etc
        imagesArray = normalizeImages(incoming);
      }
    }
    // else: no images field in body and no files => keep existing imagesArray as-is

    // 3) Validation
    const finalName = (name ?? existing.name).trim();
    if (!finalName) {
      return res.status(400).json({ errors: [{ field: 'name', msg: 'Product name is required' }] });
    }

    const finalSellPrice = sell_price ?? existing.sell_price;
    if (!finalSellPrice) {
      return res.status(400).json({ errors: [{ field: 'sell_price', msg: 'Selling price is required' }] });
    }

    if (!Array.isArray(imagesArray)) {
      return res.status(400).json({ errors: [{ field: 'images', msg: 'Images must be an array' }] });
    }
    if (imagesArray.length > 5) {
      return res.status(400).json({ errors: [{ field: 'images', msg: 'Maximum 5 images allowed' }] });
    }

    // Optional: check for duplicate name (exclude self)
    if (finalName !== existing.name) {
      const nameClash = await db('products').where({ name: finalName }).andWhereNot({ id }).first();
      if (nameClash) {
        return res.status(409).json({ errors: [{ field: 'name', msg: 'Product name already exists' }] });
      }
    }

    // 4) Perform update
    await db('products')
      .where({ id })
      .update({
        name: finalName,
        description: description ?? existing.description,
        category_id: category_id ?? existing.category_id,
        supplier_id: supplier_id ?? existing.supplier_id,
        cost_price: cost_price ?? existing.cost_price,
        sell_price: finalSellPrice,
        stock_available: stock_available ?? existing.stock_available,
        images: imagesArray && imagesArray.length ? JSON.stringify(imagesArray) : JSON.stringify([]),
      });

    const updated = await db('products').where({ id }).first();
    const formatted = {
      ...updated,
      images: updated.images ? JSON.parse(updated.images) : [],
    };

    return res.json({ product: formatted });
  } catch (err) {
    console.error('update product error', err);
    return res.status(500).json({ message: 'Failed to update product' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ errors: [{ field: 'id', msg: 'Category ID required' }] });
    }

    // const category = await Categories.findById(id);
    const category = await db('categories').where({ id }).first();
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // const deleted = await Categories.delete(id);
    const deleted = await db('categories').where({ id }).del();
    if (deleted) {
      return res.json({ message: 'Category deleted successfully' });
    } else {
      return res.status(500).json({ message: 'Failed to delete category' });
    }
  } catch (err) {
    console.error('delete category error', err);
    return res.status(500).json({ message: 'Failed to delete category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    // Validation
    if (!id) {
      return res.status(400).json({ message: 'Category ID is required' });
    }
    if (!name && !description) {
      return res.status(400).json({
        message: 'At least one field (name or description) is required',
      });
    }

    // Check if category exists
    const existingCategory = await db('categories')
      .where({ id })
      .first();

    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    // Prepare update payload
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;

    // Perform update
    await db('categories')
      .where({ id })
      .update(updateData);

    return res.status(200).json({
      message: 'Category updated successfully',
      data: {
        id,
        ...updateData,
      },
    });
  } catch (error) {
    // Handle duplicate category name
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Category name already exists',
      });
    }

    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
}

exports.getUsers = async (req, res) => {

  try {
    // fetch the users list where role is customer
    const users = await db('users').select('id', 'firstname', 'lastname', 'email', 'phone', 'created_at', 'is_active');
    // fetch the users count where role is customer
    const usersCount = await db('users').count('id as count').first();

    return res.json({
      users, metrics: {
        totalUsers: normalizeCount(usersCount)
      }
    })
  }
  catch (err) {
    console.err("failed to fetch users", err);
    return res.status(500).json({ message: "Internal server error" })
  }
}

exports.exportReport = async (req, res) => {
  try {
    const report = req.query.report || 'users_list';
    const format = String(req.query.format || 'csv').toLowerCase();
    const interval = String(req.query.interval || 'month').toLowerCase();

    const allowedReports = new Set([
      'users_list',
      'signup_growth',
      'orders_details',
      'transactional_traffic',
      'orders_report',
      'supplier_report',
    ]);
    const allowedFormats = new Set(['csv', 'pdf']);
    const allowedIntervals = new Set(['year', 'month', 'week', 'day']);

    if (!allowedReports.has(report)) {
      return res.status(400).json({ message: 'Invalid report selection' });
    }
    if (!allowedFormats.has(format)) {
      return res.status(400).json({ message: 'Invalid export format' });
    }
    if (!allowedIntervals.has(interval)) {
      return res.status(400).json({ message: 'Invalid interval selection' });
    }

    const payload = await buildExportPayload(report, interval);

    if (format === 'pdf') {
      const pdfLines = rowsToPdfLines(payload.rows);
      const pdfBuffer = createPdfBuffer(payload.title, payload.summaryLines, pdfLines);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${payload.filename}.pdf"`);
      return res.send(pdfBuffer);
    }

    const csvBuffer = toCsv(payload.rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${payload.filename}.csv"`);
    return res.send(csvBuffer);
  } catch (err) {
    console.error('export report error', err);
    return res.status(500).json({ message: 'Failed to export report' });
  }
}

exports.getAnalytics = async (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req.query);

    const buildCustomerOrdersQuery = (startDate, endDate) => {
      const query = db('customer_orders')
        .select('id', 'cust_id', 'store_id', 'status', 'payment_status', 'payment_method', 'total_amount', 'created_at')
        .whereBetween('created_at', [startDate, endDate]);

      if (filters.storeId) query.where('store_id', filters.storeId);
      return query;
    };

    const buildSupplyOrdersQuery = (startDate, endDate) => {
      const query = db('supply_orders')
        .select('id', 'store_id', 'status', 'total_amount', 'created_at')
        .whereBetween('created_at', [startDate, endDate]);

      if (filters.storeId) query.where('store_id', filters.storeId);
      return query;
    };

    const buildSupplyPaymentsQuery = (startDate, endDate) => {
      const query = db('supply_payments')
        .join('supply_orders', 'supply_payments.supply_order_id', 'supply_orders.id')
        .select('supply_payments.amount', 'supply_payments.created_at')
        .whereBetween('supply_payments.created_at', [startDate, endDate]);

      if (filters.storeId) query.where('supply_orders.store_id', filters.storeId);
      return query;
    };

    const buildOrderItemsQuery = (startDate, endDate) => {
      const query = db('customer_order_items')
        .join('customer_orders', 'customer_order_items.customer_order_id', 'customer_orders.id')
        .leftJoin('products', 'customer_order_items.product_id', 'products.id')
        .select(
          'customer_order_items.product_id',
          'customer_order_items.qty',
          'customer_order_items.total_amount',
          'customer_order_items.unit_price',
          'products.name as product_name',
          'products.cost_price as product_cost',
          'customer_orders.status',
          'customer_orders.payment_status',
          'customer_orders.store_id',
          'customer_orders.created_at'
        )
        .whereBetween('customer_orders.created_at', [startDate, endDate]);

      if (filters.storeId) query.where('customer_orders.store_id', filters.storeId);
      return query;
    };

    const [
      currentCustomerOrdersResult,
      previousCustomerOrdersResult,
      currentSupplyOrdersResult,
      previousSupplyOrdersResult,
      currentSupplyPaymentsResult,
      currentOrderItemsResult,
      currentSignupsResult,
      previousSignupsResult,
      totalCustomerCountResult,
      totalSupplierCountResult,
      storesResult,
    ] = await Promise.allSettled([
      buildCustomerOrdersQuery(filters.startDate, filters.endDate),
      buildCustomerOrdersQuery(filters.previousStartDate, filters.previousEndDate),
      buildSupplyOrdersQuery(filters.startDate, filters.endDate),
      buildSupplyOrdersQuery(filters.previousStartDate, filters.previousEndDate),
      buildSupplyPaymentsQuery(filters.startDate, filters.endDate),
      buildOrderItemsQuery(filters.startDate, filters.endDate),
      db('users')
        .select('id', 'role', 'created_at')
        .whereNot('role', 'admin')
        .whereBetween('created_at', [filters.startDate, filters.endDate]),
      db('users')
        .select('id', 'role', 'created_at')
        .whereNot('role', 'admin')
        .whereBetween('created_at', [filters.previousStartDate, filters.previousEndDate]),
      db('users').where('role', 'customer').count({ count: 'id' }).first(),
      db('suppliers').count({ count: 'id' }).first(),
      db('stores').select('id', 'name', 'is_active', 'created_at').orderBy('name', 'asc'),
    ]);

    const warnings = [];
    const currentCustomerOrders = settledValue(currentCustomerOrdersResult, [], warnings, 'customer order analytics');
    const previousCustomerOrders = settledValue(previousCustomerOrdersResult, [], warnings, 'previous customer order analytics');
    const currentSupplyOrders = settledValue(currentSupplyOrdersResult, [], warnings, 'supply order analytics');
    const previousSupplyOrders = settledValue(previousSupplyOrdersResult, [], warnings, 'previous supply order analytics');
    const currentSupplyPayments = settledValue(currentSupplyPaymentsResult, [], warnings, 'supply payment analytics');
    const currentOrderItems = settledValue(currentOrderItemsResult, [], warnings, 'product performance analytics');
    const currentSignups = settledValue(currentSignupsResult, [], warnings, 'signup analytics');
    const previousSignups = settledValue(previousSignupsResult, [], warnings, 'previous signup analytics');
    const totalCustomerCount = normalizeCount(settledValue(totalCustomerCountResult, { count: 0 }, warnings, 'customer totals'));
    const totalSupplierCount = normalizeCount(settledValue(totalSupplierCountResult, { count: 0 }, warnings, 'supplier totals'));
    const stores = settledValue(storesResult, [], warnings, 'store analytics');

    const validCustomerOrders = currentCustomerOrders.filter((order) => order.status !== 'cancelled');
    const paidCustomerOrders = validCustomerOrders.filter((order) => order.payment_status === 'paid');
    const completedCustomerOrders = validCustomerOrders.filter((order) => order.status === 'completed');
    const validSupplyOrders = currentSupplyOrders.filter((order) => order.status !== 'cancelled');
    const receivedSupplyOrders = validSupplyOrders.filter((order) => order.status === 'received');

    const previousValidCustomerOrders = previousCustomerOrders.filter((order) => order.status !== 'cancelled');
    const previousValidSupplyOrders = previousSupplyOrders.filter((order) => order.status !== 'cancelled');

    const grossRevenue = sumValues(validCustomerOrders, (order) => order.total_amount);
    const paidRevenue = sumValues(paidCustomerOrders, (order) => order.total_amount);
    const procurementSpend = sumValues(validSupplyOrders, (order) => order.total_amount);
    const supplierPayments = sumValues(currentSupplyPayments, (payment) => payment.amount);
    const previousGrossRevenue = sumValues(previousValidCustomerOrders, (order) => order.total_amount);
    const previousOrderCount = previousValidCustomerOrders.length;

    const paidOrderItems = currentOrderItems.filter(
      (item) => item.status !== 'cancelled' && item.payment_status === 'paid'
    );
    const cogs = sumValues(paidOrderItems, (item) => {
      const costPrice = Number(item.product_cost || item.unit_price || 0);
      return Number(item.qty || 0) * costPrice;
    });
    const grossProfit = paidRevenue - cogs;
    const netProfit = grossProfit - supplierPayments;

    const activeCustomerIds = new Set(validCustomerOrders.map((order) => order.cust_id).filter(Boolean));
    const activeStoreIds = new Set(
      [...currentCustomerOrders, ...currentSupplyOrders]
        .map((entry) => entry.store_id)
        .filter(Boolean)
    );

    const storeMap = new Map(stores.map((store) => [Number(store.id), store]));

    const customerTrend = buildBucketSeries(
      currentCustomerOrders,
      filters.interval,
      () => ({ revenue: 0, paidRevenue: 0, orders: 0, completedOrders: 0 }),
      (bucket, order) => {
        bucket.orders += 1;
        if (order.status !== 'cancelled') bucket.revenue += Number(order.total_amount || 0);
        if (order.payment_status === 'paid' && order.status !== 'cancelled') bucket.paidRevenue += Number(order.total_amount || 0);
        if (order.status === 'completed') bucket.completedOrders += 1;
      }
    );

    const supplyTrend = buildBucketSeries(
      currentSupplyOrders,
      filters.interval,
      () => ({ spend: 0, orders: 0, receivedOrders: 0 }),
      (bucket, order) => {
        bucket.orders += 1;
        if (order.status !== 'cancelled') bucket.spend += Number(order.total_amount || 0);
        if (order.status === 'received') bucket.receivedOrders += 1;
      }
    );

    const signupTrend = buildBucketSeries(
      currentSignups,
      filters.interval,
      () => ({ total: 0, customers: 0, suppliers: 0, storeManagers: 0 }),
      (bucket, user) => {
        bucket.total += 1;
        if (user.role === 'customer') bucket.customers += 1;
        if (user.role === 'supplier') bucket.suppliers += 1;
        if (user.role === 'store_manager') bucket.storeManagers += 1;
      }
    );

    const storePerformanceMap = new Map();

    for (const order of validCustomerOrders) {
      const storeId = Number(order.store_id || 0);
      if (!storeId) continue;
      if (!storePerformanceMap.has(storeId)) {
        storePerformanceMap.set(storeId, {
          store_id: storeId,
          store_name: storeMap.get(storeId)?.name || `Store #${storeId}`,
          customer_orders: 0,
          paid_revenue: 0,
          gross_revenue: 0,
          supply_orders: 0,
          procurement_spend: 0,
          active_customers: new Set(),
        });
      }

      const row = storePerformanceMap.get(storeId);
      row.customer_orders += 1;
      row.gross_revenue += Number(order.total_amount || 0);
      if (order.payment_status === 'paid') row.paid_revenue += Number(order.total_amount || 0);
      if (order.cust_id) row.active_customers.add(order.cust_id);
    }

    for (const order of validSupplyOrders) {
      const storeId = Number(order.store_id || 0);
      if (!storeId) continue;
      if (!storePerformanceMap.has(storeId)) {
        storePerformanceMap.set(storeId, {
          store_id: storeId,
          store_name: storeMap.get(storeId)?.name || `Store #${storeId}`,
          customer_orders: 0,
          paid_revenue: 0,
          gross_revenue: 0,
          supply_orders: 0,
          procurement_spend: 0,
          active_customers: new Set(),
        });
      }

      const row = storePerformanceMap.get(storeId);
      row.supply_orders += 1;
      row.procurement_spend += Number(order.total_amount || 0);
    }

    const storePerformance = Array.from(storePerformanceMap.values())
      .map((row) => ({
        ...row,
        paid_revenue: Number(row.paid_revenue.toFixed(2)),
        gross_revenue: Number(row.gross_revenue.toFixed(2)),
        procurement_spend: Number(row.procurement_spend.toFixed(2)),
        active_customers: row.active_customers.size,
      }))
      .sort((a, b) => (b.paid_revenue + b.procurement_spend) - (a.paid_revenue + a.procurement_spend))
      .slice(0, 8);

    const statusBreakdownMap = new Map();
    for (const order of currentCustomerOrders) {
      const key = order.status || 'unknown';
      statusBreakdownMap.set(key, (statusBreakdownMap.get(key) || 0) + 1);
    }
    const statusBreakdown = Array.from(statusBreakdownMap.entries()).map(([status, count]) => ({ status, count }));

    const paymentMixMap = new Map();
    for (const order of currentCustomerOrders) {
      const key = order.payment_method || 'unknown';
      paymentMixMap.set(key, (paymentMixMap.get(key) || 0) + 1);
    }
    const paymentMix = Array.from(paymentMixMap.entries()).map(([method, count]) => ({ method, count }));

    const productPerformanceMap = new Map();
    for (const item of currentOrderItems) {
      if (item.status === 'cancelled') continue;
      const key = Number(item.product_id || 0);
      if (!key) continue;

      if (!productPerformanceMap.has(key)) {
        productPerformanceMap.set(key, {
          product_id: key,
          product_name: item.product_name || `Product #${key}`,
          units_sold: 0,
          revenue: 0,
        });
      }

      const row = productPerformanceMap.get(key);
      row.units_sold += Number(item.qty || 0);
      row.revenue += Number(item.total_amount || 0);
    }

    const topProducts = Array.from(productPerformanceMap.values())
      .map((row) => ({
        ...row,
        revenue: Number(row.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const currentSignupCount = currentSignups.length;
    const previousSignupCount = previousSignups.length;

    return res.json({
      filters: {
        range: filters.range,
        interval: filters.interval,
        store_id: filters.storeId,
        start_date: formatDateOnly(filters.startDate),
        end_date: formatDateOnly(filters.endDate),
      },
      warnings,
      stores,
      kpis: {
        grossRevenue: Number(grossRevenue.toFixed(2)),
        paidRevenue: Number(paidRevenue.toFixed(2)),
        costOfGoodsSold: Number(cogs.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        procurementSpend: Number(procurementSpend.toFixed(2)),
        supplierPayments: Number(supplierPayments.toFixed(2)),
        netRevenue: Number(netProfit.toFixed(2)),
        grossProfitMargin: paidRevenue ? Number(((grossProfit / paidRevenue) * 100).toFixed(1)) : 0,
        netProfitMargin: paidRevenue ? Number(((netProfit / paidRevenue) * 100).toFixed(1)) : 0,
        totalCustomerOrders: currentCustomerOrders.length,
        completedCustomerOrders: completedCustomerOrders.length,
        totalSupplyOrders: currentSupplyOrders.length,
        receivedSupplyOrders: receivedSupplyOrders.length,
        averageOrderValue: Number((validCustomerOrders.length ? grossRevenue / validCustomerOrders.length : 0).toFixed(2)),
        completionRate: percentage(completedCustomerOrders.length, currentCustomerOrders.length),
        paidRate: percentage(paidCustomerOrders.length, currentCustomerOrders.length),
        activeCustomers: activeCustomerIds.size,
        totalCustomers: totalCustomerCount,
        newCustomers: currentSignups.filter((user) => user.role === 'customer').length,
        totalSuppliers: totalSupplierCount,
        newSuppliers: currentSignups.filter((user) => user.role === 'supplier').length,
        totalStores: stores.length,
        activeStores: stores.filter((store) => store.is_active).length,
        storesInScope: filters.storeId ? 1 : activeStoreIds.size,
        newStores: stores.filter((store) => {
          const createdAt = new Date(store.created_at);
          return createdAt >= filters.startDate && createdAt <= filters.endDate;
        }).length,
        revenueGrowth: growthPct(grossRevenue, previousGrossRevenue),
        orderGrowth: growthPct(validCustomerOrders.length, previousOrderCount),
        signupGrowth: growthPct(currentSignupCount, previousSignupCount),
        supplyGrowth: growthPct(validSupplyOrders.length, previousValidSupplyOrders.length),
      },
      charts: {
        customerTrend,
        supplyTrend,
        signupTrend,
        storePerformance,
        statusBreakdown,
        paymentMix,
        topProducts,
      },
    });
  } catch (err) {
    console.error('admin analytics error', err);
    return res.status(500).json({ message: 'Failed to load analytics dashboard' });
  }
}

async function buildFinancialSnapshot(filters) {
  const paidOrdersQuery = db('customer_orders')
    .select('id', 'store_id', 'status', 'payment_status', 'total_amount', 'created_at')
    .whereBetween('created_at', [filters.startDate, filters.endDate])
    .where('payment_status', 'paid')
    .whereNot('status', 'cancelled');

  if (filters.storeId) paidOrdersQuery.where('store_id', filters.storeId);

  const paidOrders = await paidOrdersQuery;

  const paidOrderItemsQuery = db('customer_order_items')
    .join('customer_orders', 'customer_order_items.customer_order_id', 'customer_orders.id')
    .leftJoin('products', 'customer_order_items.product_id', 'products.id')
    .select(
      'customer_order_items.qty',
      'customer_order_items.total_amount',
      'customer_order_items.unit_price',
      'products.cost_price as product_cost',
      'customer_orders.status',
      'customer_orders.payment_status',
      'customer_orders.store_id',
      'customer_orders.created_at'
    )
    .whereBetween('customer_orders.created_at', [filters.startDate, filters.endDate])
    .where('customer_orders.payment_status', 'paid')
    .whereNot('customer_orders.status', 'cancelled');

  if (filters.storeId) paidOrderItemsQuery.where('customer_orders.store_id', filters.storeId);

  const paidOrderItems = await paidOrderItemsQuery;

  const supplyOrdersQuery = db('supply_orders')
    .select('id', 'store_id', 'status', 'total_amount', 'created_at')
    .whereBetween('created_at', [filters.startDate, filters.endDate])
    .whereNot('status', 'cancelled');

  if (filters.storeId) supplyOrdersQuery.where('store_id', filters.storeId);
  const supplyOrders = await supplyOrdersQuery;

  const supplierPaymentsQuery = db('supply_payments')
    .join('supply_orders', 'supply_payments.supply_order_id', 'supply_orders.id')
    .select('supply_payments.amount', 'supply_orders.store_id')
    .whereBetween('supply_payments.created_at', [filters.startDate, filters.endDate]);

  if (filters.storeId) supplierPaymentsQuery.where('supply_orders.store_id', filters.storeId);
  const supplierPayments = await supplierPaymentsQuery;

  const grossRevenue = sumValues(paidOrders, (order) => order.total_amount);
  const cogs = sumValues(paidOrderItems, (item) => {
    const costPrice = Number(item.product_cost || item.unit_price || 0);
    return Number(item.qty || 0) * costPrice;
  });
  const grossProfit = grossRevenue - cogs;
  const supplierPaymentTotal = sumValues(supplierPayments, (payment) => payment.amount);
  const procurementSpend = sumValues(supplyOrders, (order) => order.total_amount);
  const netProfit = grossProfit - supplierPaymentTotal;

  return {
    total_revenue: Number(grossRevenue.toFixed(2)),
    total_orders: paidOrders.length,
    total_cost_of_goods_sold: Number(cogs.toFixed(2)),
    gross_profit: Number(grossProfit.toFixed(2)),
    gross_profit_margin: grossRevenue ? Number(((grossProfit / grossRevenue) * 100).toFixed(1)) : 0,
    total_procurement_spend: Number(procurementSpend.toFixed(2)),
    total_supplier_payments: Number(supplierPaymentTotal.toFixed(2)),
    net_profit: Number(netProfit.toFixed(2)),
    net_profit_margin: grossRevenue ? Number(((netProfit / grossRevenue) * 100).toFixed(1)) : 0,
    average_order_value: paidOrders.length ? Number((grossRevenue / paidOrders.length).toFixed(2)) : 0,
    completed_order_count: paidOrders.filter((order) => order.status === 'completed').length,
  };
}

async function buildProfitWaterfallData(filters) {
  const snapshot = await buildFinancialSnapshot(filters);
  return {
    breakdown: [
      { label: 'Paid Customer Revenue', amount: snapshot.total_revenue },
      { label: 'Cost of Goods Sold (COGS)', amount: -snapshot.total_cost_of_goods_sold },
      { label: 'Gross Profit', amount: snapshot.gross_profit },
      { label: 'Supplier Payments', amount: -snapshot.total_supplier_payments },
      { label: 'Net Profit', amount: snapshot.net_profit },
    ],
    net_profit: snapshot.net_profit,
  };
}

async function buildExpensesBreakdownData(filters) {
  const snapshot = await buildFinancialSnapshot(filters);
  return [
    { category: 'Cost of Goods Sold', amount: snapshot.total_cost_of_goods_sold },
    { category: 'Supplier Payments', amount: snapshot.total_supplier_payments },
    { category: 'Procurement Spend', amount: snapshot.total_procurement_spend },
  ];
}

async function buildYoYComparisonData(filters) {
  const currentMetrics = await buildFinancialSnapshot(filters);
  const lastYearFilters = {
    ...filters,
    startDate: subtractYears(filters.startDate, 1),
    endDate: subtractYears(filters.endDate, 1),
  };
  const previousMetrics = await buildFinancialSnapshot(lastYearFilters);

  return {
    comparison: [
      {
        metric: 'Gross Revenue',
        current: currentMetrics.total_revenue,
        previous: previousMetrics.total_revenue,
        growth_pct: growthPct(currentMetrics.total_revenue, previousMetrics.total_revenue),
      },
      {
        metric: 'Gross Profit',
        current: currentMetrics.gross_profit,
        previous: previousMetrics.gross_profit,
        growth_pct: growthPct(currentMetrics.gross_profit, previousMetrics.gross_profit),
      },
      {
        metric: 'Net Profit',
        current: currentMetrics.net_profit,
        previous: previousMetrics.net_profit,
        growth_pct: growthPct(currentMetrics.net_profit, previousMetrics.net_profit),
      },
      {
        metric: 'Average Order Value',
        current: currentMetrics.average_order_value,
        previous: previousMetrics.average_order_value,
        growth_pct: growthPct(currentMetrics.average_order_value, previousMetrics.average_order_value),
      },
    ],
  };
}

function buildFinancialAnomaliesData(metrics) {
  const anomalies = [];

  if (metrics.total_revenue === 0 && metrics.total_orders > 0) {
    anomalies.push({
      title: 'Orders with no revenue',
      description: 'Paid order count exists without collected revenue in the selected period.',
      severity: 'warning',
    });
  }

  if (metrics.gross_profit_margin < 10 && metrics.total_revenue > 0) {
    anomalies.push({
      title: 'Low gross profit margin',
      description: `Gross margin is ${metrics.gross_profit_margin}% which is below normal retail benchmarks. Review pricing or cost structure.`,
      severity: 'warning',
    });
  }

  if (metrics.net_profit < 0) {
    anomalies.push({
      title: 'Negative net profit',
      description: 'Cost of goods sold plus supplier payments exceed collected revenue. Profitability is negative.',
      severity: 'critical',
    });
  }

  if (metrics.total_supplier_payments > metrics.total_revenue && metrics.total_revenue > 0) {
    anomalies.push({
      title: 'Supplier payments exceed revenue',
      description: 'Cash outflows to suppliers are higher than revenue for the selected period.',
      severity: 'critical',
    });
  }

  return { anomalies };
}

exports.getFinancialMetrics = async (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req.query);
    const metrics = await buildFinancialSnapshot(filters);
    return res.json(metrics);
  } catch (err) {
    console.error('admin financial metrics error', err);
    return res.status(500).json({ message: 'Failed to load financial metrics' });
  }
};

exports.getProfitWaterfall = async (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req.query);
    const data = await buildProfitWaterfallData(filters);
    return res.json(data);
  } catch (err) {
    console.error('admin profit waterfall error', err);
    return res.status(500).json({ message: 'Failed to load profit waterfall' });
  }
};

exports.getExpenseBreakdown = async (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req.query);
    const data = await buildExpensesBreakdownData(filters);
    return res.json(data);
  } catch (err) {
    console.error('admin expense breakdown error', err);
    return res.status(500).json({ message: 'Failed to load expense breakdown' });
  }
};

exports.getYoyComparison = async (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req.query);
    const data = await buildYoYComparisonData(filters);
    return res.json(data);
  } catch (err) {
    console.error('admin yoy comparison error', err);
    return res.status(500).json({ message: 'Failed to load year-over-year comparison' });
  }
};

exports.getFinancialAnomalies = async (req, res) => {
  try {
    const filters = parseAnalyticsFilters(req.query);
    const metrics = await buildFinancialSnapshot(filters);
    const data = buildFinancialAnomaliesData(metrics);
    return res.json(data);
  } catch (err) {
    console.error('admin financial anomalies error', err);
    return res.status(500).json({ message: 'Failed to load financial anomalies' });
  }
};

exports.getFeedbacks = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;
    const sort = req.query.sort || 'created_at';
    const order = (req.query.order || 'desc').toUpperCase();
    const validSortFields = {
      created_at: 'feedbacks.created_at',
      firstname: 'users.firstname',
      lastname: 'users.lastname',
      email: 'users.email',
    };
    const sortColumn = validSortFields[sort] || 'feedbacks.created_at';
    const orderDir = order === 'ASC' ? 'asc' : 'desc';

    let query = db('feedbacks')
      .join('users', 'feedbacks.cust_id', 'users.id')
      .select('feedbacks.id', 'feedbacks.message', 'feedbacks.created_at', 'users.firstname as firstname', 'users.lastname as lastname', 'users.email as user_email');

    if (search) {
      query = query.where(function () {
        this.where('users.firstname', 'like', `%${search}%`)
          .orWhere('users.lastname', 'like', `%${search}%`)
          .orWhere('users.email', 'like', `%${search}%`)
          .orWhere('feedbacks.message', 'like', `%${search}%`);
      });
    }

    const countQuery = query.clone();
    const countResult = await countQuery
      .clearSelect()
      .clearOrder()
      .count({ count: 'feedbacks.id' })
      .first();

    const total = Number(countResult.count || 0);

    const feedbacks = await query
      .orderBy(sortColumn, orderDir)
      .limit(limit)
      .offset(offset);

    return res.json({ feedbacks, total, limit, offset });
  } catch (err) {
    console.error('get feedbacks error', err);
    return res.status(500).json({ message: 'Failed to load feedbacks' });
  }
}

exports.listSuppliers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;
    const isActive = req.query.is_active;
    const sort = req.query.sort || 'created_at';
    const order = (req.query.order || 'desc').toUpperCase();
    const validSortFields = {
      created_at: 'created_at',
      name: 'name',
      email: 'email',
      rating: 'rating',
    };
    const sortColumn = validSortFields[sort] || 'created_at';
    const orderDir = order === 'ASC' ? 'asc' : 'desc';

    let query = db('suppliers').select('*');

    if (search) {
      query = query.where(function () {
        this.where('name', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`)
          .orWhere('phone', 'like', `%${search}%`)
          .orWhere('address', 'like', `%${search}%`);
      });
    }

    if (isActive !== undefined && isActive !== '') {
      const activeBool = isActive === 'true' || isActive === '1' || isActive === true;
      query = query.where('is_active', activeBool);
    }

    const countQuery = query.clone();
    const countResult = await countQuery
      .clearSelect()
      .clearOrder()
      .count({ count: 'suppliers.id' })
      .first();

    const total = Number(countResult.count || 0);

    const suppliers = await query
      .orderBy(sortColumn, orderDir)
      .limit(limit)
      .offset(offset);

    return res.json({ suppliers, total, limit, offset });
  } catch (err) {
    console.error('list suppliers error', err);
    return res.status(500).json({ message: 'Failed to load suppliers' });
  }
};

// Update supplier (and linked user record)
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, name, email, phone, is_active } = req.body;

    const existing = await db('suppliers').where({ id }).first();
    if (!existing) return res.status(404).json({ message: 'Supplier not found' });

    // Update supplier table
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (email !== undefined) updatePayload.email = email.trim();
    if (phone !== undefined) updatePayload.phone = phone.trim();
    if (is_active !== undefined) updatePayload.is_active = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';

    await db('suppliers').where({ id }).update(updatePayload);

    // Update linked user
    if (existing.cust_id) {
      const userPayload = {};
      if (name !== undefined) {
        const parts = name.trim().split(/\s+/);
        userPayload.firstname = parts[0] || '';
        userPayload.lastname = parts.slice(1).join(' ') || null;
      }
      if (firstname !== undefined) userPayload.firstname = firstname.trim();
      if (lastname !== undefined) userPayload.lastname = lastname.trim();
      if (email !== undefined) userPayload.email = email.trim();
      if (phone !== undefined) userPayload.phone = phone.trim();
      if (Object.keys(userPayload).length > 0) await db('users').where({ id: existing.cust_id }).update(userPayload);
    }

    const updated = await db('suppliers').where({ id }).first();
    return res.json({ supplier: updated });
  } catch (err) {
    console.error('update supplier error', err);
    return res.status(500).json({ message: 'Failed to update supplier' });
  }
}

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await db('suppliers').where({ id }).first();
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    // Check for supply orders
    const orderCount = await db('supply_orders').where({ supplier_id: id }).count('id as count').first();
    if (Number(orderCount.count || 0) > 0) {
      return res.status(400).json({ message: 'Cannot delete supplier with associated supply orders. Deactivate instead.' });
    }

    // Delete supplier and optionally delete linked user if desired
    await db.transaction(async (trx) => {
      await trx('suppliers').where({ id }).del();
      if (supplier.cust_id) {
        await trx('users').where({ id: supplier.cust_id }).del();
      }
    });

    return res.json({ message: 'Supplier deleted' });
  } catch (err) {
    console.error('delete supplier error', err);
    return res.status(500).json({ message: 'Failed to delete supplier' });
  }
}

exports.createSupplier = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ errors: [{ field: 'name', msg: 'Supplier name is required' }] });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ errors: [{ field: 'email', msg: 'Valid email is required' }] });
    }
    if (!phone || phone.length < 7) {
      return res.status(400).json({ errors: [{ field: 'phone', msg: 'Valid phone is required' }] });
    }

    // Allow admin to omit password; default to '12345678' if not provided or too short
    const rawPassword = password && password.length >= 8 ? password : '12345678';

    // Check if email or phone already exists in users OR suppliers
    const existingEmailUser = await db('users').where({ email }).first();
    const existingEmailSupplier = await db('suppliers').where({ email }).first();
    if (existingEmailUser || existingEmailSupplier) {
      return res.status(409).json({ errors: [{ field: 'email', msg: 'Email already exists' }] });
    }

    const existingPhoneUser = await db('users').where({ phone }).first();
    const existingPhoneSupplier = await db('suppliers').where({ phone }).first();
    if (existingPhoneUser || existingPhoneSupplier) {
      return res.status(409).json({ errors: [{ field: 'phone', msg: 'Phone already exists' }] });
    }

    // Hash password (use rawPassword defaulted earlier)
    const hashed = await bcrypt.hash(rawPassword, 10);

    // Insert supplier only (do not create a users row)
    const supplier = await db.transaction(async (trx) => {
      const [supplierId] = await trx('suppliers').insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: hashed,
        is_active: true,
      });

      const created = await trx('suppliers').where({ id: supplierId }).first();
      return created;
    });

    // Remove password before sending response
    const safeSupplier = { ...supplier };
    delete safeSupplier.password;

    // send welcome email with credentials (try/catch to avoid failing the request)
    (async () => {
      try {
        if (safeSupplier.email) {
          const from = process.env.GMAIL_EMAIL || 'no-reply@example.com';
          const to = safeSupplier.email;
          const sub = `Welcome to RetailIQ!`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Welcome to RetailIQ</h2>
              <p>Hi ${safeSupplier.name || 'Supplier'},</p>
              <p>Your supplier account has been created by an administrator.</p>
              <p><strong>Login email:</strong> ${safeSupplier.email}</p>
              <p><strong>Temporary password:</strong> ${rawPassword}</p>
              <p>Please log in and change your password immediately.</p>
              <hr/>
              <p style="font-size: 12px; color: #666;">RetailIQ - Smart Retail Analytics Platform</p>
            </div>
          `;
          await emailService(from, to, sub, html);
        }
      } catch (mailErr) {
        console.error('failed to send supplier welcome email', mailErr);
      }
    })();

    return res.status(201).json({
      message: 'Supplier created successfully',
      supplier: safeSupplier,
    });
  } catch (err) {
    console.error('create supplier error', err);
    return res.status(500).json({ message: 'Failed to create supplier' });
  }
};

// ------------------- STORE MANAGERS (store_owner) MANAGEMENT -------------------

/**
 * List store managers with pagination, search, sort
 */
exports.listStoreManagers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;
    const sort = req.query.sort || 'created_at';
    const order = (req.query.order || 'desc').toUpperCase();

    const validSortFields = ['created_at', 'firstname', 'lastname', 'email'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortCol = `users.${sortField}`;
    const orderDir = order === 'DESC' ? 'desc' : 'asc';

    let query = db('users').select('id', 'firstname', 'lastname', 'email', 'phone', 'created_at', 'is_active').where('role', 'store_manager');

    if (search) {
      query = query.where(function () {
        this.where('firstname', 'like', `%${search}%`)
          .orWhere('lastname', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`)
          .orWhere('phone', 'like', `%${search}%`);
      });
    }

    const countQuery = query.clone();
    const countResult = await countQuery.clearSelect().clearOrder().count({ count: 'users.id' }).first();
    const total = Number(countResult.count || 0);

    const managers = await query.orderBy(sortCol, orderDir).limit(limit).offset(offset);

    return res.json({ managers, total, limit, offset });
  } catch (err) {
    console.error('list store managers error', err);
    return res.status(500).json({ message: 'Failed to load store managers' });
  }
}

/**
 * Simple list of store managers (id/name) for select dropdowns
 */
exports.listStoreManagersSimple = async (req, res) => {
  try {
    const onlyActive = req.query.active === '1' || req.query.active === 'true';
    let query = db('users').select('id', 'firstname', 'lastname').where('role', 'store_manager');
    if (onlyActive) query = query.andWhere('is_active', true);
    const list = await query.orderBy('firstname', 'asc');
    const formatted = list.map((r) => ({ id: r.id, name: `${r.firstname} ${r.lastname}` }));
    return res.json({ managers: formatted });
  } catch (err) {
    console.error('list store managers simple error', err);
    return res.status(500).json({ message: 'Failed to load store managers' });
  }
}

/**
 * Create a new store manager (admin action)
 */
exports.createStoreManager = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { firstname, lastname, email, phone, password } = req.body;

    if (!firstname || !firstname.trim()) return res.status(400).json({ errors: [{ field: 'firstname', msg: 'First name is required' }] });
    if (!lastname || !lastname.trim()) return res.status(400).json({ errors: [{ field: 'lastname', msg: 'Last name is required' }] });
    if (!email || !email.includes('@')) return res.status(400).json({ errors: [{ field: 'email', msg: 'Valid email is required' }] });
    if (!phone || phone.length < 7) return res.status(400).json({ errors: [{ field: 'phone', msg: 'Valid phone is required' }] });

    // Check uniqueness
    const existingEmail = await db('users').where({ email }).first();
    if (existingEmail) return res.status(409).json({ errors: [{ field: 'email', msg: 'Email already exists' }] });
    const existingPhone = await db('users').where({ phone }).first();
    if (existingPhone) return res.status(409).json({ errors: [{ field: 'phone', msg: 'Phone already exists' }] });

    const rawPassword = password && password.length >= 8 ? password : '12345678';
    const hashed = await bcrypt.hash(rawPassword, 10);

    const userId = await db.transaction(async (trx) => {
      const [id] = await trx('users').insert({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: hashed,
        role: 'store_manager',
        is_active: true,
      });
      return id;
    });

    const user = await db('users').where({ id: userId }).first();
    const safeUser = { ...user };
    delete safeUser.password; delete safeUser.otp; delete safeUser.otpGeneratedAt;

    // send welcome email
    (async () => {
      try {
        if (safeUser.email) {
          const from = process.env.GMAIL_EMAIL || 'no-reply@example.com';
          const to = safeUser.email;
          const sub = `Welcome to RetailIQ as Store Manager`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Welcome to RetailIQ</h2>
              <p>Hi ${safeUser.firstname},</p>
              <p>Your store manager account has been created by an administrator.</p>
              <p><strong>Login email:</strong> ${safeUser.email}</p>
              <p><strong>Temporary password:</strong> ${rawPassword}</p>
              <p>Please log in and change your password immediately.</p>
              <hr/>
              <p style="font-size: 12px; color: #666;">RetailIQ - Smart Retail Analytics Platform</p>
            </div>
          `;
          await emailService(from, to, sub, html);
        }
      } catch (mailErr) {
        console.error('failed to send store manager welcome email', mailErr);
      }
    })();

    return res.status(201).json({ message: 'Store manager created successfully', manager: safeUser });
  } catch (err) {
    console.error('create store manager error', err);
    return res.status(500).json({ message: 'Failed to create store manager' });
  }
}

/**
 * Update a store manager
 */
exports.updateStoreManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, email, phone, is_active } = req.body;

    const existing = await db('users').where({ id, role: 'store_manager' }).first();
    if (!existing) return res.status(404).json({ message: 'Store manager not found' });

    // email/phone uniqueness checks
    if (email && email !== existing.email) {
      const clash = await db('users').where({ email }).andWhereNot({ id }).first();
      if (clash) return res.status(409).json({ errors: [{ field: 'email', msg: 'Email already exists' }] });
    }
    if (phone && phone !== existing.phone) {
      const clash = await db('users').where({ phone }).andWhereNot({ id }).first();
      if (clash) return res.status(409).json({ errors: [{ field: 'phone', msg: 'Phone already exists' }] });
    }

    const payload = {};
    if (firstname !== undefined) payload.firstname = firstname.trim();
    if (lastname !== undefined) payload.lastname = lastname.trim();
    if (email !== undefined) payload.email = email.trim();
    if (phone !== undefined) payload.phone = phone.trim();
    if (is_active !== undefined) payload.is_active = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';

    await db('users').where({ id }).update(payload);
    const updated = await db('users').where({ id }).first();
    delete updated.password; delete updated.otp; delete updated.otpGeneratedAt;

    return res.json({ manager: updated });
  } catch (err) {
    console.error('update store manager error', err);
    return res.status(500).json({ message: 'Failed to update store manager' });
  }
}

/**
 * Delete a store manager (only if not owning stores or referenced records)
 */
exports.deleteStoreManager = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db('users').where({ id, role: 'store_manager' }).first();
    if (!user) return res.status(404).json({ message: 'Store manager not found' });

    // Check if manager owns stores
    const storeCount = await db('stores').where({ owner_id: id }).count('id as count').first();
    if (Number(storeCount.count || 0) > 0) {
      return res.status(400).json({ message: 'Cannot delete manager: they own one or more stores. Reassign or delete stores first.' });
    }

    await db('users').where({ id }).del();
    return res.json({ message: 'Store manager deleted' });
  } catch (err) {
    console.error('delete store manager error', err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ message: 'Cannot delete manager: referenced by other records.' });
    }
    return res.status(500).json({ message: 'Failed to delete store manager' });
  }
}

exports.listCustomerOrders = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;
    const status = req.query.status;
    const sort = req.query.sort || 'created_at';
    const order = (req.query.order || 'desc').toUpperCase();

    // Validate sort field
    const validSortFields = ['created_at', 'total_amount', 'order_no', 'status', 'payment_status'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortCol = `customer_orders.${sortField}`;
    const orderDir = order === 'DESC' ? 'desc' : 'asc';

    let query = db('customer_orders')
      .select(
        'customer_orders.*',
        'users.firstname',
        'users.lastname',
        'users.email as customer_email',
        'stores.name as store_name'
      )
      .leftJoin('users', 'customer_orders.cust_id', 'users.id')
      .leftJoin('stores', 'customer_orders.store_id', 'stores.id');

    if (search) {
      query = query.where(function () {
        this.where('customer_orders.order_no', 'like', `%${search}%`)
          .orWhere('users.firstname', 'like', `%${search}%`)
          .orWhere('users.lastname', 'like', `%${search}%`)
          .orWhere('users.email', 'like', `%${search}%`);
      });
    }

    if (status) {
      query = query.where('customer_orders.status', status);
    }

    const countQuery = query.clone();
    const countResult = await countQuery
      .clearSelect()
      .clearOrder()
      .count({ count: 'customer_orders.id' })
      .first();

    const total = Number(countResult.count || 0);

    const orders = await query
      .orderBy(sortCol, orderDir)
      .limit(limit)
      .offset(offset);

    return res.json({ orders, total, limit, offset });
  } catch (err) {
    console.error('list customer orders error', err);
    return res.status(500).json({ message: 'Failed to load customer orders' });
  }
};

// Get single order details (items + metadata)
exports.getCustomerOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db('customer_orders')
      .where({ id })
      .first();

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const items = await db('customer_order_items')
      .select(
        'customer_order_items.*',
        'products.name as product_name',
        'products.images as product_images',
        'users.firstname as customer_firstname',
        'users.lastname as customer_lastname'
      )
      .join(
        'products',
        'customer_order_items.product_id',
        'products.id'
      )
      .join(
        'customer_orders',
        'customer_order_items.customer_order_id',
        'customer_orders.id'
      )
      .join(
        'users',
        'customer_orders.cust_id',
        'users.id'
      )
      .where('customer_order_items.customer_order_id', id);


    return res.json({ order, items });
  } catch (err) {
    console.error('get order details error', err);
    return res.status(500).json({ message: 'Failed to load order details' });
  }
}

// Update order status and notify customer
exports.updateCustomerOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'processing', 'completed', 'cancelled', 'returned', 'shipped'];

    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const order = await db('customer_orders').where({ id }).first();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await db('customer_orders').where({ id }).update({ status });

    // Notify customer if email exists
    if (order.cust_id) {
      const user = await db('users').where({ id: order.cust_id }).first();
      if (user && user.email) {
        const from = process.env.GMAIL_EMAIL || 'no-reply@example.com';
        const to = user.email;
        const sub = `Your order ${order.order_no} status updated to ${status}`;
        const html = `
          <p>Hi ${user.firstname},</p>
          <p>Your order <strong>${order.order_no}</strong> status has been updated to <strong>${status}</strong>.</p>
          <p>Thank you for shopping with RetailIQ.</p>
        `;
        try {
          await emailService(from, to, sub, html);
        } catch (mailErr) {
          console.error('failed to send order status email', mailErr);
        }
      }
    }

    return res.json({ message: 'Order status updated', status });
  } catch (err) {
    console.error('update order status error', err);
    return res.status(500).json({ message: 'Failed to update order status' });
  }
}

// Deactivate user and send notification email
exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db('users').where({ id }).first();
    if (!user) return res.status(404).json({ message: 'User not found' });

    await db('users').where({ id }).update({ is_active: false });

    // send deactivation email
    if (user.email) {
      const from = process.env.GMAIL_EMAIL || 'no-reply@example.com';
      const to = user.email;
      const sub = `Your RetailIQ account has been deactivated`;
      const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p style="color: #666; font-size: 14px;">Hi ${user.firstName},</p>
          <p style="color: #666; font-size: 14px;">
        <p>Your account has been deactivated by our support team. If you believe this is a mistake, please contact support.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            RetailIQ - Smart Retail Analytics Platform
          </p>
        </div>
      </div>
    `;
      try {
        await emailService(from, to, sub, html);
      } catch (mailErr) {
        console.error('failed to send deactivation email', mailErr);
      }
    }

    return res.json({ message: 'User deactivated' });
  } catch (err) {
    console.error('deactivate user error', err);
    return res.status(500).json({ message: 'Failed to deactivate user' });
  }
}

// Reactivate user and notify
exports.reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db('users').where({ id }).first();
    if (!user) return res.status(404).json({ message: 'User not found' });

    await db('users').where({ id }).update({ is_active: true });

    if (user.email) {
      const from = process.env.GMAIL_EMAIL || 'no-reply@example.com';
      const to = user.email;
      const sub = `Your RetailIQ account has been reactivated`;
      const html = `
        <p>Hi ${user.firstname},</p>
        <p>Your account has been reactivated. You can now log in again.</p>
      `;
      try {
        await emailService(from, to, sub, html);
      } catch (mailErr) {
        console.error('failed to send reactivation email', mailErr);
      }
    }

    return res.json({ message: 'User reactivated' });
  } catch (err) {
    console.error('reactivate user error', err);
    return res.status(500).json({ message: 'Failed to reactivate user' });
  }
}

/**
 * listSupplierOrders - Fetch all supply orders with filtering, sorting, and pagination
 * Query Parameters:
 *   - limit: page size (default: 12, max: 500)
 *   - offset: pagination offset (default: 0)
 *   - search: search by order number, supplier name, or store name
 *   - status: filter by status (pending, sent, received, cancelled)
 *   - sortBy: field to sort by (created_at, total_amount, status, supplier_name, deliver_at)
 *   - sortDir: sort direction (ASC or DESC, default: DESC)
 */
exports.listSupplierOrders = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;
    const status = req.query.status;
    const sortBy = req.query.sortBy || 'created_at'; // Default sort by date
    const sortDir = (req.query.sortDir || 'DESC').toUpperCase(); // ASC or DESC

    // Validate sort field to prevent SQL injection
    const allowedSortFields = ['created_at', 'total_amount', 'status', 'supplier_name', 'deliver_at'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortDir = ['ASC', 'DESC'].includes(sortDir) ? sortDir : 'DESC';

    // Determine which column to use for ordering
    const sortColumn = validSortBy === 'supplier_name'
      ? 'suppliers.name'
      : validSortBy === 'status'
        ? 'supply_orders.status'
        : validSortBy === 'total_amount'
          ? 'supply_orders.total_amount'
          : validSortBy === 'deliver_at'
            ? 'supply_orders.deliver_at'
            : 'supply_orders.created_at';

    let query = db('supply_orders')
      .select(
        'supply_orders.*',
        'suppliers.name as supplier_name',
        'suppliers.email as supplier_email',
        'stores.name as store_name',
        'users.firstname as ordered_by_firstname',
        'users.lastname as ordered_by_lastname'
      )
      .leftJoin('suppliers', 'supply_orders.supplier_id', 'suppliers.id')
      .leftJoin('stores', 'supply_orders.store_id', 'stores.id')
      .leftJoin('users', 'supply_orders.ordered_by', 'users.id');

    // Apply search filter (checks order number, supplier name, store name)
    if (search) {
      query = query.where(function () {
        this.where('supply_orders.order_no', 'like', `%${search}%`)
          .orWhere('suppliers.name', 'like', `%${search}%`)
          .orWhere('stores.name', 'like', `%${search}%`);
      });
    }

    // Apply status filter
    if (status) {
      query = query.where('supply_orders.status', status);
    }

    // Count total results for pagination metadata
    const countQuery = query.clone();
    const countResult = await countQuery
      .clearSelect()
      .clearOrder()
      .count({ count: 'supply_orders.id' })
      .first();

    const total = Number(countResult.count || 0);

    // Execute main query with sorting and pagination
    const orders = await query
      .orderBy(sortColumn, validSortDir)
      .limit(limit)
      .offset(offset);

    return res.json({ orders, total, limit, offset });
  } catch (err) {
    console.error('list supplier orders error', err);
    return res.status(500).json({ message: 'Failed to load supplier orders' });
  }
};

// Admin: list payments for a supply order
exports.listSupplyPayments = async (req, res) => {
  try {
    const { id } = req.params;
    const payments = await db('supply_payments')
      .where('supply_payments.supply_order_id', id)
      .select('supply_payments.*')
      .orderBy('supply_payments.payment_date', 'desc');
    return res.json({ payments });
  } catch (err) {
    console.error('listSupplyPayments error', err);
    return res.status(500).json({ message: 'Failed to list supply payments' });
  }
}

// Admin: record a payment for a supply order
exports.createSupplyPayment = async (req, res) => {
  try {
    const { id } = req.params; // supply_order id
    const { amount, payment_date, method, payment_ref } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });

    await ensureSupplyOrderStockColumn();

    const order = await db('supply_orders').where('id', id).first();
    if (!order) return res.status(404).json({ message: 'Supply order not found' });

    const supplier_id = order.supplier_id;
    const [pid] = await db('supply_payments').insert({
      supply_order_id: id,
      supplier_id,
      amount,
      payment_date: payment_date || null,
      method: method || 'CASH',
      payment_ref: payment_ref || null
    });
    const payment = await db('supply_payments').where('id', pid).first();

    const totalAmount = Number(order.total_amount || 0);
    const paymentState = await getSupplyPaymentSummaryData(db, id, totalAmount);
    const { totalPaid, remainingAmount, isFullyPaid } = paymentState;

    // Auto-complete order if fully paid
    if (isFullyPaid && order.status !== 'received') {
      await db('supply_orders').where('id', id).update({ status: 'received' });
    }
    await syncSupplyOrderStockIfEligible(db, id);

    // Notify supplier about payment
    try {
      const supplier = await db('suppliers').where('id', supplier_id).first();
      if (supplier) {
        // Try direct email from suppliers table first, then fallback to linked user
        let supplierEmail = supplier.email;
        let supplierName = supplier.name;

        // If supplier is linked to users table, get email from there too
        if (supplier.cust_id) {
          const linkedUser = await db('users').where('id', supplier.cust_id).first();
          if (linkedUser) {
            supplierEmail = linkedUser.email || supplier.email;
            supplierName = `${linkedUser.firstname || ''} ${linkedUser.lastname || ''}`.trim() || supplier.name;
          }
        }

        if (supplierEmail) {
          const emailService = require('../services/mailService');
          let html = `<p>Hi ${supplierName},</p>`;
          html += `<p>A payment of ₹${Number(amount).toFixed(2)} has been recorded for order <strong>${order.order_no}</strong>.</p>`;
          html += `<p><strong>Payment Summary:</strong></p>`;
          html += `<ul>`;
          html += `<li>Total Amount: ₹${totalAmount.toFixed(2)}</li>`;
          html += `<li>Amount Paid: ₹${totalPaid.toFixed(2)}</li>`;
          html += `<li>Remaining: ₹${Math.max(0, remainingAmount).toFixed(2)}</li>`;
          html += `</ul>`;

          if (isFullyPaid) {
            html += `<p style="color: green; font-weight: bold;">✓ Payment Complete! Order status has been updated to 'Received'.</p>`;
          } else {
            html += `<p style="color: orange;">Note: Partial payment received. Awaiting remaining payment of ₹${remainingAmount.toFixed(2)}.</p>`;
          }

          html += `<p>Thank you!</p>`;

          const subject = isFullyPaid
            ? `Payment Complete for Order ${order.order_no}`
            : `Partial Payment Received for Order ${order.order_no}`;

          emailService(process.env.GMAIL_EMAIL, supplierEmail, subject, html)
            .catch(e => console.error('notify supplier email failed', e));
        }
      }
    } catch (e) {
      console.error('notify supplier on payment failed', e);
    }

    return res.json({
      payment,
      orderStatus: isFullyPaid ? 'received' : order.status,
      paymentSummary: {
        totalAmount,
        totalPaid,
        remainingAmount,
        isFullyPaid
      }
    });
  } catch (err) {
    console.error('createSupplyPayment error', err);
    return res.status(500).json({ message: 'Failed to record payment' });
  }
}

// Admin: Get payment summary for a supply order
exports.getSupplyPaymentSummary = async (req, res) => {
  try {
    const { id } = req.params;
    await ensureSupplyOrderStockColumn();
    const order = await db('supply_orders').where('id', id).first();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Get all payments for this order
    const payments = await db('supply_payments')
      .where('supply_order_id', id)
      .select('*')
      .orderBy('payment_date', 'desc');

    // Calculate totals
    const totalAmount = Number(order.total_amount || 0);
    const paymentState = await getSupplyPaymentSummaryData(db, id, totalAmount);
    const { totalPaid, remainingAmount, isFullyPaid } = paymentState;

    return res.json({
      orderId: id,
      orderNo: order.order_no,
      orderStatus: order.status,
      totalAmount,
      totalPaid,
      remainingAmount,
      isFullyPaid,
      paymentCount: payments.length,
      payments,
      stockSynced: Boolean(order.stock_synced_at),
    });
  } catch (err) {
    console.error('getSupplyPaymentSummary error', err);
    return res.status(500).json({ message: 'Failed to get payment summary' });
  }
}

// Admin: Notify supplier about incomplete payment
exports.notifySupplierIncompletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db('supply_orders').where('id', id).first();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Get payment summary
    const paymentSummary = await db('supply_payments')
      .where('supply_order_id', id)
      .sum('amount as total_paid')
      .first();

    const totalPaid = Number(paymentSummary?.total_paid || 0);
    const totalAmount = Number(order.total_amount || 0);
    const remainingAmount = totalAmount - totalPaid;

    if (remainingAmount <= 0) {
      return res.status(400).json({ message: 'Order is already fully paid' });
    }

    // Get supplier and send email
    const supplier = await db('suppliers').where('id', order.supplier_id).first();
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    let supplierEmail = supplier.email;
    let supplierName = supplier.name;

    if (supplier.cust_id) {
      const linkedUser = await db('users').where('id', supplier.cust_id).first();
      if (linkedUser) {
        supplierEmail = linkedUser.email || supplier.email;
        supplierName = `${linkedUser.firstname || ''} ${linkedUser.lastname || ''}`.trim() || supplier.name;
      }
    }

    if (supplierEmail) {
      const emailService = require('../services/mailService');
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Hi ${supplierName},</p>
          <p>We are writing to inform you about the payment status for your supply order <strong>${order.order_no}</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Payment Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px;"><strong>Total Order Amount:</strong></td>
                <td style="padding: 8px; text-align: right;">₹${totalAmount.toFixed(2)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px;"><strong>Amount Paid:</strong></td>
                <td style="padding: 8px; text-align: right; color: green;">₹${totalPaid.toFixed(2)}</td>
              </tr>
              <tr style="background-color: #fff3cd;">
                <td style="padding: 8px;"><strong>Outstanding Balance:</strong></td>
                <td style="padding: 8px; text-align: right; color: #ff6b6b;"><strong>₹${remainingAmount.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>

          <p style="color: #ff6b6b; font-weight: bold;">⚠ Action Required: Please arrange payment of the outstanding balance of <strong>₹${remainingAmount.toFixed(2)}</strong> at your earliest convenience.</p>

          <p>Once we receive the remaining payment, we will update your order status accordingly.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you have any questions or concerns, please don't hesitate to contact us.<br/>
            Thank you for your business!<br/>
            <br/>
            RetailIQ - Smart Retail Analytics Platform
          </p>
        </div>
      `;

      const subject = `Pending Payment Notification for Order ${order.order_no}`;

      await emailService(process.env.GMAIL_EMAIL, supplierEmail, subject, html);

      return res.json({
        message: 'Supplier notification sent',
        supplierEmail,
        outstandingBalance: remainingAmount
      });
    }

    return res.status(400).json({ message: 'No email address found for supplier' });
  } catch (err) {
    console.error('notifySupplierIncompletePayment error', err);
    return res.status(500).json({ message: 'Failed to send notification' });
  }
}

// Admin: update supply order status and optionally delivery/date/amount
exports.updateSupplyOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliver_at, total_amount } = req.body;
    const allowed = ['pending', 'sent', 'received', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    await ensureSupplyOrderStockColumn();

    const order = await db('supply_orders').where('id', id).first();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const payload = { status };
    if (deliver_at !== undefined) payload.deliver_at = deliver_at || null;
    if (total_amount !== undefined) payload.total_amount = total_amount;

    await db('supply_orders').where('id', id).update(payload);
    const updated = await db('supply_orders').where('id', id).first();
    const paymentState = await getSupplyPaymentSummaryData(db, id, updated.total_amount);
    await syncSupplyOrderStockIfEligible(db, id);

    // notify supplier when status changes
    try {
      const supplier = await db('suppliers').where('id', updated.supplier_id).first();
      if (supplier && supplier.email) {
        const sendEmail = require('../services/mailService');
        const subject = `Supply order ${updated.order_no} is now ${updated.status}`;
        const html = `<p>Your supply order (${updated.order_no}) status has been updated to <strong>${updated.status}</strong>.</p>`;
        sendEmail(process.env.GMAIL_EMAIL, supplier.email, subject, html).catch(e => console.error('notify supplier failed', e));
      }
    } catch (e) { console.error('post-update notify failed', e) }

    return res.json({
      message: 'Order updated',
      paymentSummary: paymentState,
      stockSynced: Boolean(updated.stock_synced_at),
    });
  } catch (err) {
    console.error('update supply order status error', err);
    return res.status(500).json({ message: 'Failed to update order' });
  }
};

exports.listProducts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const categoryId = req.query.category_id;
    const search = req.query.search;
    const sort = req.query.sort || 'created_at';
    const order = (req.query.order || 'desc').toUpperCase();

    // Validate sort field
    const validSortFields = ['name', 'sell_price', 'cost_price', 'created_at', 'stock_available'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortCol = sortField === 'price' || sortField === 'sell_price' ? 'products.sell_price' : `products.${sortField}`;
    const orderDir = order === 'DESC' ? 'desc' : 'asc';

    let query = db('products')
      .select(
        'products.id',
        'products.name',
        'products.description',
        'products.category_id',
        'products.supplier_id',
        'products.cost_price',
        'products.sell_price',
        'products.stock_available',
        'products.images',
        'products.created_at',
        'categories.name as category_name'
      )
      .leftJoin('categories', 'products.category_id', 'categories.id');

    // Apply filters
    if (categoryId) {
      query = query.where('products.category_id', categoryId);
    }
    if (search) {
      query = query.where('products.name', 'like', `%${search}%`);
    }

    // Count total before pagination
    const countQuery = query.clone();
    const countResult = await countQuery
      .clearSelect()
      .clearOrder()
      .count({ count: 'products.id' })
      .first();

    const total = Number(countResult.count || 0);

    // Apply sorting and pagination
    const products = await query
      .orderBy(sortCol, orderDir)
      .limit(limit)
      .offset(offset);

    // Parse images JSON for each product
    const formattedProducts = products.map((p) => ({
      ...p,
      images: normalizeImages(p.images),
    }));

    return res.json({ products: formattedProducts, total, limit, offset });
  } catch (err) {
    console.error('list products error', err);
    return res.status(500).json({ message: 'Failed to load products' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, category_id, supplier_id, cost_price, sell_price, stock_available } = req.body;

    // assemble images array from either uploaded files, base64 payloads, or JSON in body
    let imagesArray = [];
    if (req.files && req.files.length) {
      imagesArray = req.files.map((f) => `media/products/${f.filename}`);
    } else {
      let incoming = req.body.images;
      if (typeof incoming === 'string' && incoming.trim().length) {
        try {
          incoming = JSON.parse(incoming);
        } catch (e) {
          // leave as string
        }
      }

      if (Array.isArray(incoming) && incoming.some((it) => typeof it === 'string' && it.startsWith('data:image'))) {
        const saved = await saveBase64Images(incoming, name);
        imagesArray = imagesArray.concat(saved);
      } else {
        imagesArray = normalizeImages(incoming);
      }
    }

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ errors: [{ field: 'name', msg: 'Product name is required' }] });
    }
    if (!sell_price) {
      return res.status(400).json({ errors: [{ field: 'sell_price', msg: 'Selling price is required' }] });
    }
    if (!Array.isArray(imagesArray)) {
      return res.status(400).json({ errors: [{ field: 'images', msg: 'Images must be an array' }] });
    }
    if (imagesArray.length > 5) {
      return res.status(400).json({ errors: [{ field: 'images', msg: 'Maximum 5 images allowed' }] });
    }

    // Check if product name already exists
    const existing = await db('products').where({ name: name.trim() }).first();
    if (existing) {
      return res.status(409).json({ errors: [{ field: 'name', msg: 'Product name already exists' }] });
    }

    // Insert and then fetch the inserted row (MySQL-friendly)
    const insertPayload = {
      name: name.trim(),
      description: description || null,
      category_id: category_id || null,
      supplier_id: supplier_id || null,
      cost_price: cost_price || 0,
      sell_price,
      stock_available: stock_available || 0,
      images: JSON.stringify(imagesArray || []),
    };

    const [insertedId] = await db('products').insert(insertPayload);
    const product = await db('products').where({ id: insertedId }).first();

    const formatted = {
      ...product,
      images: product && product.images ? normalizeImages(product.images) : [],
    };

    return res.status(201).json({ product: formatted });
  } catch (err) {
    console.error('create product error', err);
    return res.status(500).json({ message: 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, supplier_id, cost_price, sell_price, stock_available } = req.body;

    if (!id) {
      return res.status(400).json({ errors: [{ field: 'id', msg: 'Product ID required' }] });
    }

    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // assemble images array similar to create
    let imagesArray;
    if (req.files && req.files.length) {
      imagesArray = req.files.map((f) => `media/products/${f.filename}`);
    } else {
      let incoming = req.body.images;
      if (typeof incoming === 'string' && incoming.trim().length) {
        try {
          incoming = JSON.parse(incoming);
        } catch (e) {
          // ignore parse error
        }
      }

      if (Array.isArray(incoming) && incoming.some((it) => typeof it === 'string' && it.startsWith('data:image'))) {
        const saved = await saveBase64Images(incoming, name || product.name);
        imagesArray = saved;
      } else if (incoming !== undefined) {
        imagesArray = normalizeImages(incoming);
      }
      // else imagesArray stays undefined -> means do not change images
    }

    // Validation
    if (name && !name.trim()) {
      return res.status(400).json({ errors: [{ field: 'name', msg: 'Product name cannot be empty' }] });
    }
    if (imagesArray !== undefined && !Array.isArray(imagesArray)) {
      return res.status(400).json({ errors: [{ field: 'images', msg: 'Images must be an array' }] });
    }
    if (imagesArray && imagesArray.length > 5) {
      return res.status(400).json({ errors: [{ field: 'images', msg: 'Maximum 5 images allowed' }] });
    }

    // Check name uniqueness (excluding current product)
    if (name && name.trim() !== product.name) {
      const existing = await db('products').where({ name: name.trim() }).andWhereNot({ id }).first();
      if (existing) {
        return res.status(409).json({ errors: [{ field: 'name', msg: 'Product name already exists' }] });
      }
    }

    // Build update payload
    const updatePayload = {
      name: name !== undefined ? (name ? name.trim() : name) : product.name,
      description: description !== undefined ? description : product.description,
      category_id: category_id !== undefined ? category_id : product.category_id,
      supplier_id: supplier_id !== undefined ? supplier_id : product.supplier_id,
      cost_price: cost_price !== undefined ? cost_price : product.cost_price,
      sell_price: sell_price !== undefined ? sell_price : product.sell_price,
      stock_available: stock_available !== undefined ? stock_available : product.stock_available,
      images: imagesArray !== undefined ? JSON.stringify(imagesArray) : product.images,
    };

    // Perform update
    const updatedCount = await db('products').where({ id }).update(updatePayload);

    if (!updatedCount) {
      return res.status(500).json({ message: 'Failed to update product' });
    }

    // Fetch the updated product
    const updated = await db('products').where({ id }).first();
    const formatted = {
      ...updated,
      images: updated.images ? normalizeImages(updated.images) : [],
    };

    return res.json({ product: formatted });
  } catch (err) {
    console.error('update product error', err);
    return res.status(500).json({ message: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ errors: [{ field: 'id', msg: 'Product ID required' }] });
    }

    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const deleted = await db('products').where({ id }).del();
    if (deleted) {
      return res.json({ message: 'Product deleted successfully' });
    } else {
      return res.status(500).json({ message: 'Failed to delete product' });
    }
  } catch (err) {
    console.error('delete product error', err);
    return res.status(500).json({ message: 'Failed to delete product' });
  }
}

exports.sendAssuranceEmail = async (req, res) => {

  try {
    const id = req.params.id;
    console.log(`feedback id is ${id}`);

    //fetch single feedback by id, with user info
    const feedback = await db('feedbacks')
      .join('users', 'feedbacks.cust_id', 'users.id')
      .where('feedbacks.id', id)
      .select(
        'feedbacks.id',
        'feedbacks.message',
        'feedbacks.created_at',
        'users.firstname as firstname',
        'users.lastname as lastname',
        'users.email as user_email'
      )
      .first(); // important: get single row (object) or undefined


    if (!feedback)
      return res.status(500).json({ message: "feedback not found.." })

    // defensive check: ensure recipient exists
    const from = process.env.GMAIL_EMAIL || 'no-reply@example.com';
    const to = feedback.user_email;
    if (!to) {
      console.error('No recipient email found for feedback id', id);
      return res.status(400).json({ message: "Recipient email not available." });
    }
    const sub = "Your Feedback Has Been Received - RetailIQ";
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">✓ Feedback Received</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">We're actively working on your feedback</p>
        </div>

        <!-- Content -->
        <div style="background-color: #ffffff; padding: 30px 20px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">Hi ${feedback.firstname},</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; border-radius: 4px; margin: 20px 0;">
            <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0;">
              Thank you for sharing your valuable feedback with RetailIQ. We truly appreciate you taking the time to help us improve our platform. 
              Your insights are important to us and help us deliver better solutions.
            </p>
          </div>

          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <h3 style="color: #667eea; font-size: 14px; margin: 0 0 10px 0;">What happens next?</h3>
            <ul style="color: #555; font-size: 14px; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Our team has received your feedback and is reviewing it</li>
              <li style="margin-bottom: 8px;">We're analyzing the suggestions and potential improvements</li>
              <li>You can expect updates or improvements based on your feedback</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            If you have any urgent concerns or additional information to share, please feel free to contact our support team.
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            Your Feedback message was: ${feedback.message}
          </p>

          <!-- Footer -->
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
              <strong>RetailIQ</strong> - Smart Retail Analytics Platform<br/>
              We're committed to delivering excellence
            </p>
            <p style="color: #bbb; font-size: 11px; margin: 10px 0 0 0; text-align: center;">
              © 2024 RetailIQ. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    await emailService(from, to, sub, htmlContent)
    return res.json({ message: "Assurance sent..." })
  }
  catch (err) {
    console.error("failed to fetch users", err);
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ==================== STORES MANAGEMENT ====================

/**
 * List stores with pagination, search, sort, and filter
 */
exports.listStores = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 500);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;
    const isActive = req.query.is_active; // filter by active status
    const sort = req.query.sort || 'created_at';
    const order = (req.query.order || 'desc').toUpperCase();

    // Validate sort field
    const validSortFields = ['name', 'created_at', 'rating', 'address'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortCol = `stores.${sortField}`;
    const orderDir = order === 'DESC' ? 'desc' : 'asc';

    let query = db('stores')
      .select(
        'stores.*',
        'users.firstname as owner_firstname',
        'users.lastname as owner_lastname',
        'users.email as owner_email'
      )
      .leftJoin('users', 'stores.owner_id', 'users.id');

    // Apply search filter
    if (search) {
      query = query.where(function () {
        this.where('stores.name', 'like', `%${search}%`)
          .orWhere('stores.address', 'like', `%${search}%`)
          .orWhere('stores.phone', 'like', `%${search}%`);
      });
    }

    // Apply active status filter
    if (isActive !== undefined && isActive !== '') {
      const activeBool = isActive === 'true' || isActive === '1' || isActive === true;
      query = query.where('stores.is_active', activeBool);
    }

    // Get total count
    const countQuery = query.clone();
    const countResult = await countQuery
      .clearSelect()
      .clearOrder()
      .count({ count: 'stores.id' })
      .first();

    const total = Number(countResult.count || 0);

    // Apply sorting and pagination
    const stores = await query
      .orderBy(sortCol, orderDir)
      .limit(limit)
      .offset(offset);

    return res.json({ stores, total, limit, offset });
  } catch (err) {
    console.error('list stores error', err);
    return res.status(500).json({ message: 'Failed to load stores' });
  }
};

/**
 * Create new store
 */
exports.createStore = async (req, res) => {
  try {
    const { name, address, phone, owner_id, rating } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ errors: [{ field: 'name', msg: 'Store name is required' }] });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ errors: [{ field: 'address', msg: 'Store address is required' }] });
    }

    // Check if store name already exists
    const existingName = await db('stores').where({ name: name.trim() }).first();
    if (existingName) {
      return res.status(409).json({ errors: [{ field: 'name', msg: 'Store name already exists' }] });
    }

    // Check if phone already exists (if provided)
    if (phone && phone.trim()) {
      const existingPhone = await db('stores').where({ phone: phone.trim() }).first();
      if (existingPhone) {
        return res.status(409).json({ errors: [{ field: 'phone', msg: 'Phone number already exists' }] });
      }
    }

    // Validate owner_id if provided
    if (owner_id) {
      const owner = await db('users').where({ id: owner_id }).first();
      if (!owner) {
        return res.status(404).json({ errors: [{ field: 'owner_id', msg: 'Owner not found' }] });
      }
    }

    // Validate rating if provided (1-5)
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ errors: [{ field: 'rating', msg: 'Rating must be between 1 and 5' }] });
      }
    }

    // Insert store
    const [storeId] = await db('stores').insert({
      name: name.trim(),
      address: address.trim(),
      phone: phone ? phone.trim() : null,
      owner_id: owner_id || null,
      rating: rating ? parseFloat(rating) : null,
      is_active: true,
    });

    // Fetch created store with owner details
    const store = await db('stores')
      .select(
        'stores.*',
        'users.firstname as owner_firstname',
        'users.lastname as owner_lastname',
        'users.email as owner_email'
      )
      .leftJoin('users', 'stores.owner_id', 'users.id')
      .where('stores.id', storeId)
      .first();

    return res.status(201).json({ store });
  } catch (err) {
    console.error('create store error', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ errors: [{ field: 'name', msg: 'Store name or phone already exists' }] });
    }
    return res.status(500).json({ message: 'Failed to create store' });
  }
};

/**
 * Update store
 */
exports.updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, owner_id, rating, is_active } = req.body;

    // Check if store exists
    const existing = await db('stores').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Validate name uniqueness (excluding current store)
    if (name && name.trim() !== existing.name) {
      const nameClash = await db('stores').where({ name: name.trim() }).andWhereNot({ id }).first();
      if (nameClash) {
        return res.status(409).json({ errors: [{ field: 'name', msg: 'Store name already exists' }] });
      }
    }

    // Validate phone uniqueness (excluding current store)
    if (phone && phone.trim() && phone.trim() !== existing.phone) {
      const phoneClash = await db('stores').where({ phone: phone.trim() }).andWhereNot({ id }).first();
      if (phoneClash) {
        return res.status(409).json({ errors: [{ field: 'phone', msg: 'Phone number already exists' }] });
      }
    }

    // Validate owner_id if provided
    if (owner_id !== undefined && owner_id !== null) {
      if (owner_id) {
        const owner = await db('users').where({ id: owner_id }).first();
        if (!owner) {
          return res.status(404).json({ errors: [{ field: 'owner_id', msg: 'Owner not found' }] });
        }
      }
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseFloat(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ errors: [{ field: 'rating', msg: 'Rating must be between 1 and 5' }] });
      }
    }

    // Build update payload
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (address !== undefined) updatePayload.address = address.trim();
    if (phone !== undefined) updatePayload.phone = phone ? phone.trim() : null;
    if (owner_id !== undefined) updatePayload.owner_id = owner_id || null;
    if (rating !== undefined) updatePayload.rating = rating ? parseFloat(rating) : null;
    if (is_active !== undefined) updatePayload.is_active = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';

    // Perform update
    await db('stores').where({ id }).update(updatePayload);

    // Fetch updated store with owner details
    const updated = await db('stores')
      .select(
        'stores.*',
        'users.firstname as owner_firstname',
        'users.lastname as owner_lastname',
        'users.email as owner_email'
      )
      .leftJoin('users', 'stores.owner_id', 'users.id')
      .where('stores.id', id)
      .first();

    return res.json({ store: updated });
  } catch (err) {
    console.error('update store error', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ errors: [{ field: 'name', msg: 'Store name or phone already exists' }] });
    }
    return res.status(500).json({ message: 'Failed to update store' });
  }
};

/**
 * Delete store
 */
exports.deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if store exists
    const store = await db('stores').where({ id }).first();
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if store has associated orders (soft check - you might want to prevent deletion if orders exist)
    const orderCount = await db('customer_orders').where({ store_id: id }).count('id as count').first();
    const orderCountNum = Number(orderCount.count || 0);

    if (orderCountNum > 0) {
      return res.status(400).json({
        message: `Cannot delete store. It has ${orderCountNum} associated order(s). Deactivate the store instead.`,
      });
    }

    // Delete store
    await db('stores').where({ id }).del();

    return res.json({ message: 'Store deleted successfully' });
  } catch (err) {
    console.error('delete store error', err);
    // Check for foreign key constraint violations
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        message: 'Cannot delete store. It is referenced by other records. Deactivate the store instead.',
      });
    }
    return res.status(500).json({ message: 'Failed to delete store' });
  }
};

/**
 * Get single store details
 */
exports.getStoreDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await db('stores')
      .select(
        'stores.*',
        'users.firstname as owner_firstname',
        'users.lastname as owner_lastname',
        'users.email as owner_email'
      )
      .leftJoin('users', 'stores.owner_id', 'users.id')
      .where('stores.id', id)
      .first();

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    return res.json({ store });
  } catch (err) {
    console.error('get store details error', err);
    return res.status(500).json({ message: 'Failed to load store details' });
  }
};
