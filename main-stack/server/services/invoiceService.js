const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Directory for storing invoice PDFs
const INVOICE_DIR = path.join(__dirname, '..', 'media', 'invoices');
if (!fs.existsSync(INVOICE_DIR)) {
  fs.mkdirSync(INVOICE_DIR, { recursive: true });
}

/**
 * Generate invoice number
 */
function generateInvoiceNumber() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

/**
 * Generate invoice and save to database and PDF file
 * @param {Number} orderId - Customer order ID
 * @returns {Promise<Object>} Invoice data with PDF path
 */
async function generateInvoice(orderId) {
  try {
    // Fetch order details with related data
    const order = await db('customer_orders')
      .select(
        'customer_orders.*',
        'users.firstname',
        'users.lastname',
        'users.email as customer_email',
        'users.phone as customer_phone',
        'users.address as customer_address',
        'stores.name as store_name',
        'stores.address as store_address',
        'stores.phone as store_phone'
      )
      .leftJoin('users', 'customer_orders.cust_id', 'users.id')
      .leftJoin('stores', 'customer_orders.store_id', 'stores.id')
      .where('customer_orders.id', orderId)
      .first();

    if (!order) {
      throw new Error('Order not found');
    }

    // Fetch order items with product details
    const orderItems = await db('customer_order_items')
      .select(
        'customer_order_items.*',
        'products.name as product_name',
        'products.description as product_description'
      )
      .leftJoin('products', 'customer_order_items.product_id', 'products.id')
      .where('customer_order_items.customer_order_id', orderId);

    if (!orderItems || orderItems.length === 0) {
      throw new Error('Order items not found');
    }

    // Check if invoice already exists
    const existingInvoice = await db('invoices')
      .where({ customer_order_id: orderId })
      .first();

    if (existingInvoice) {
      // Return existing invoice
      return {
        invoice: existingInvoice,
        pdfPath: path.join(INVOICE_DIR, `${existingInvoice.invoice_no}.pdf`),
      };
    }

    // Calculate invoice amounts
    const subtotal = parseFloat(order.total_amount) || 0;
    const discountAmount = parseFloat(order.discount) || 0;

    // Calculate tax (assuming 10% GST - you can customize this)
    const taxRate = 0.10;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * taxRate;
    const grandTotal = taxableAmount + taxAmount;

    // Split tax into CGST and SGST (9% each for 18% total, or 5% each for 10% total)
    const cgstRate = taxRate / 2;
    const sgstRate = taxRate / 2;
    const cgstAmount = taxableAmount * cgstRate;
    const sgstAmount = taxableAmount * sgstRate;

    const invoiceNo = generateInvoiceNumber();
    const invoiceDate = new Date();

    // Create invoice record in database
    const [invoiceId] = await db('invoices').insert({
      invoice_no: invoiceNo,
      invoice_date: invoiceDate,
      customer_order_id: orderId,
      store_id: order.store_id,
      cust_id: order.cust_id,
      cashier_id: null, // Can be set if cashier is processing
      subtotal: subtotal,
      discount: discountAmount,
      tax: taxAmount,
      cgst: cgstAmount,
      sgst: sgstAmount,
      igst: 0, // IGST for inter-state transactions
      grand_total: grandTotal,
      payment_status: order.payment_status === 'paid' ? 'paid' : 'pending',
      invoice_status: 'generated',
      notes: `Order #${order.order_no}`,
    });

    // Insert invoice items
    const invoiceItemsData = orderItems.map(item => ({
      invoice_id: invoiceId,
      product_id: item.product_id,
      product_name: item.product_name || 'Product',
      qty: item.qty,
      unit_price: parseFloat(item.unit_price) || 0,
      discount: parseFloat(item.discount) || 0,
      tax: (parseFloat(item.total_amount) - parseFloat(item.discount || 0)) * taxRate,
      total_amount: parseFloat(item.total_amount) || 0,
    }));

    await db('invoice_items').insert(invoiceItemsData);

    // Update payment record with invoice_id if exists
    const payment = await db('customer_payments')
      .where({ customer_order_id: orderId })
      .first();

    if (payment) {
      await db('customer_payments')
        .where({ id: payment.id })
        .update({ invoice_id: invoiceId });
    }

    // Generate PDF
    const pdfPath = path.join(INVOICE_DIR, `${invoiceNo}.pdf`);
    await generateInvoicePDF(invoiceId, pdfPath, order, orderItems, {
      invoiceNo,
      invoiceDate,
      subtotal,
      discountAmount,
      taxAmount,
      cgstAmount,
      sgstAmount,
      grandTotal,
    });

    // Fetch complete invoice data
    const invoice = await db('invoices').where({ id: invoiceId }).first();

    return {
      invoice,
      pdfPath,
    };
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
}

/**
 * Generate invoice PDF
 */
async function generateInvoicePDF(invoiceId, pdfPath, order, orderItems, amounts) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      const primaryColor = '#1F4FD8';
      const lightGray = '#F2F2F2';
      const darkGray = '#555';

      /* ================= HEADER ================= */
      const headerHeight = 90;
      doc.rect(0, 0, 595, headerHeight).fill(primaryColor);

      // LEFT: TITLE
      doc
        .fillColor('#FFF')
        .font('Helvetica-Bold')
        .fontSize(28)
        .text('INVOICE', 50, 30);

      // RIGHT: META (NO OVERLAP GUARANTEED)
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Invoice No', 360, 28, { width: 85, align: 'right' })
        .text(amounts.invoiceNo, 450, 28, { width: 95, align: 'right' });

      doc
        .text('Date', 360, 45, { width: 85, align: 'right' })
        .text(
          amounts.invoiceDate.toLocaleDateString('en-IN'),
          450,
          45,
          { width: 95, align: 'right' }
        );

      doc.fillColor('#000');
      doc.y = headerHeight + 15;

      /* ================= STORE INFO ================= */
      doc.font('Helvetica-Bold').fontSize(14).text('RetailIQ');
      doc.font('Helvetica').fontSize(9).fillColor(darkGray);

      if (order.store_name) doc.text(order.store_name);
      if (order.store_address) doc.text(order.store_address);
      if (order.store_phone) doc.text(`Phone: ${order.store_phone}`);

      /* Divider */
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#DDD').stroke();

      /* ================= CUSTOMER INFO ================= */
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fillColor('#000').text('Bill To:');
      doc.font('Helvetica').fillColor(darkGray);

      doc.text(`${order.firstname || ''} ${order.lastname || ''}`.trim());
      if (order.customer_email) doc.text(order.customer_email);
      if (order.customer_phone) doc.text(order.customer_phone);
      if (order.customer_address) doc.text(order.customer_address);

      /* ================= TABLE ================= */
      doc.moveDown(2);
      const tableTop = doc.y;

      doc.rect(50, tableTop, 495, 22).fill(lightGray);

      doc
        .fillColor('#000')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('S.No', 55, tableTop + 7, { width: 30 })
        .text('Product', 90, tableTop + 7, { width: 200 })
        .text('Qty', 300, tableTop + 7, { width: 40, align: 'right' })
        .text('Unit Price', 350, tableTop + 7, { width: 80, align: 'right' })
        .text('Total', 440, tableTop + 7, { width: 95, align: 'right' });

      let y = tableTop + 28;
      doc.font('Helvetica').fontSize(9);

      /* ===== SINGLE PAGE LIMIT (IMPORTANT) ===== */
      const maxRows = 10; // hard limit to prevent overflow
      orderItems.slice(0, maxRows).forEach((item, i) => {
        doc
          .fillColor('#000')
          .text(i + 1, 55, y, { width: 30 })
          .text(item.product_name || 'Product', 90, y, { width: 200 })
          .text(item.qty, 300, y, { width: 40, align: 'right' })
          .text(`₹${Number(item.unit_price).toFixed(2)}`, 350, y, {
            width: 80,
            align: 'right'
          })
          .text(`₹${Number(item.total_amount).toFixed(2)}`, 440, y, {
            width: 95,
            align: 'right'
          });

        doc
          .moveTo(50, y + 15)
          .lineTo(545, y + 15)
          .strokeColor('#EEE')
          .stroke();

        y += 20;
      });

      /* ================= TOTALS ================= */
      const totalsTop = 600;

      doc.rect(330, totalsTop, 215, 120).fill('#FAFAFA').stroke('#DDD');

      const row = (label, value, offset, bold = false) => {
        doc
          .font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(bold ? 11 : 9)
          .fillColor('#000')
          .text(label, 340, totalsTop + offset)
          .text(`₹${value.toFixed(2)}`, 440, totalsTop + offset, {
            width: 95,
            align: 'right'
          });
      };

      row('Subtotal', amounts.subtotal, 10);
      if (amounts.discountAmount > 0)
        row('Discount', -amounts.discountAmount, 28);
      row('CGST (5%)', amounts.cgstAmount, 46);
      row('SGST (5%)', amounts.sgstAmount, 64);
      row('Grand Total', amounts.grandTotal, 90, true);

      /* ================= PAYMENT ================= */
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(primaryColor)
        .text(`Payment Status: ${order.payment_status.toUpperCase()}`, 50, totalsTop + 95);

      /* ================= FOOTER ================= */
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#777')
        .text('Thank you for your business!', 50, 780, {
          width: 495,
          align: 'center'
        })
        .text('This is a computer-generated invoice.', {
          width: 495,
          align: 'center'
        });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Get invoice by order ID
 */
async function getInvoiceByOrderId(orderId) {
  try {
    const invoice = await db('invoices')
      .where({ customer_order_id: orderId })
      .first();

    if (!invoice) {
      return null;
    }

    const items = await db('invoice_items')
      .where({ invoice_id: invoice.id });

    return {
      invoice,
      items,
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
}

module.exports = {
  generateInvoice,
  getInvoiceByOrderId,
  INVOICE_DIR,
};

