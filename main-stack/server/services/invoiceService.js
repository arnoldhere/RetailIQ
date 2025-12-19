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
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown();

      // Company/Store Info
      doc.fontSize(12).font('Helvetica-Bold').text('RetailIQ', { align: 'center' });
      if (order.store_name) {
        doc.fontSize(10).font('Helvetica').text(order.store_name, { align: 'center' });
      }
      if (order.store_address) {
        doc.fontSize(9).font('Helvetica').text(order.store_address, { align: 'center' });
      }
      if (order.store_phone) {
        doc.fontSize(9).font('Helvetica').text(`Phone: ${order.store_phone}`, { align: 'center' });
      }
      doc.moveDown(2);

      // Invoice Details
      doc.fontSize(10);
      doc.font('Helvetica-Bold').text('Invoice No:', 50, doc.y);
      doc.font('Helvetica').text(amounts.invoiceNo, 150, doc.y - 10);
      
      doc.font('Helvetica-Bold').text('Invoice Date:', 50, doc.y + 5);
      doc.font('Helvetica').text(amounts.invoiceDate.toLocaleDateString('en-IN'), 150, doc.y - 5);
      
      doc.font('Helvetica-Bold').text('Order No:', 50, doc.y + 5);
      doc.font('Helvetica').text(order.order_no, 150, doc.y - 5);

      // Customer Details
      const customerY = doc.y + 20;
      doc.font('Helvetica-Bold').fontSize(11).text('Bill To:', 350, customerY);
      doc.font('Helvetica').fontSize(9);
      if (order.firstname || order.lastname) {
        doc.text(`${order.firstname || ''} ${order.lastname || ''}`.trim(), 350, doc.y + 5);
      }
      if (order.customer_email) {
        doc.text(`Email: ${order.customer_email}`, 350, doc.y + 5);
      }
      if (order.customer_phone) {
        doc.text(`Phone: ${order.customer_phone}`, 350, doc.y + 5);
      }
      if (order.customer_address) {
        doc.text(`Address: ${order.customer_address}`, 350, doc.y + 5);
      }

      doc.moveDown(3);

      // Items Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('S.No.', 50, tableTop);
      doc.text('Product Name', 100, tableTop);
      doc.text('Qty', 300, tableTop);
      doc.text('Unit Price', 340, tableTop);
      doc.text('Total', 420, tableTop, { align: 'right' });

      // Table Line
      doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

      // Items
      let yPos = tableTop + 25;
      orderItems.forEach((item, index) => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        doc.font('Helvetica').fontSize(9);
        doc.text((index + 1).toString(), 50, yPos);
        doc.text(item.product_name || 'Product', 100, yPos, { width: 180, ellipsis: true });
        doc.text(item.qty.toString(), 300, yPos);
        doc.text(`₹${parseFloat(item.unit_price).toFixed(2)}`, 340, yPos);
        doc.text(`₹${parseFloat(item.total_amount).toFixed(2)}`, 420, yPos, { align: 'right' });
        yPos += 20;
      });

      doc.moveDown();
      const totalsY = Math.max(yPos + 10, 600);

      // Totals
      doc.font('Helvetica').fontSize(9);
      doc.text('Subtotal:', 350, totalsY, { align: 'right' });
      doc.text(`₹${amounts.subtotal.toFixed(2)}`, 500, totalsY, { align: 'right' });

      if (amounts.discountAmount > 0) {
        doc.text('Discount:', 350, totalsY + 15, { align: 'right' });
        doc.text(`-₹${amounts.discountAmount.toFixed(2)}`, 500, totalsY + 15, { align: 'right' });
      }

      doc.text('CGST (5%):', 350, totalsY + 30, { align: 'right' });
      doc.text(`₹${amounts.cgstAmount.toFixed(2)}`, 500, totalsY + 30, { align: 'right' });

      doc.text('SGST (5%):', 350, totalsY + 45, { align: 'right' });
      doc.text(`₹${amounts.sgstAmount.toFixed(2)}`, 500, totalsY + 45, { align: 'right' });

      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('Grand Total:', 350, totalsY + 65, { align: 'right' });
      doc.text(`₹${amounts.grandTotal.toFixed(2)}`, 500, totalsY + 65, { align: 'right' });

      // Payment Status
      doc.font('Helvetica').fontSize(9);
      doc.text(`Payment Status: ${order.payment_status.toUpperCase()}`, 50, totalsY + 90);

      // Footer
      doc.fontSize(8).font('Helvetica');
      const footerY = 750;
      doc.text('Thank you for your business!', 50, footerY, { align: 'center', width: 500 });
      doc.text('This is a computer-generated invoice.', 50, footerY + 15, { align: 'center', width: 500 });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (error) {
      reject(error);
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

