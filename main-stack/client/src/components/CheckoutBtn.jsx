import React from 'react';

export default function CheckoutButton({ orderId, amount, razorpayKey }) {
    const openCheckout = () => {
        const options = {
            key: razorpayKey, // RAZORPAY_KEY_ID (test)
            amount: amount,
            currency: 'INR',
            name: 'RetailIQ',
            description: 'Order payment',
            order_id: orderId, // from server /api/create-order
            handler: function (response) {
                // response.razorpay_payment_id
                // response.razorpay_order_id
                // response.razorpay_signature
                // send these to your backend to verify signature
                fetch('/api/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(response),
                }).then(r => r.json()).then(console.log);
            },
            prefill: { name: 'Customer', email: 'cust@example.com', contact: '9999999999' },
            theme: { color: '#1E90FF' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    return <button onClick={openCheckout}>Pay Now</button>;
}
