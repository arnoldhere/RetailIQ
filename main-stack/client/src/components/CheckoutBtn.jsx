import React, { useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { SpinnerIcon } from '@chakra-ui/icons';

export default function CheckoutButton({ orderId, amount, razorpayKey }) {
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const openCheckout = () => {
        if (!window.Razorpay) {
            toast({
                title: 'Error',
                description: 'Payment system not loaded. Please refresh and try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);
        const options = {
            key: razorpayKey,
            amount: amount,
            currency: 'INR',
            name: 'RetailIQ',
            description: 'Order payment',
            order_id: orderId,
            handler: function (response) {
                setIsLoading(false);
                fetch('/api/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(response),
                })
                    .then(r => r.json())
                    .then(data => {
                        toast({
                            title: 'Success',
                            description: 'Payment completed successfully!',
                            status: 'success',
                            duration: 5000,
                            isClosable: true,
                        });
                    })
                    .catch(err => {
                        toast({
                            title: 'Error',
                            description: 'Payment verification failed. Please contact support.',
                            status: 'error',
                            duration: 5000,
                            isClosable: true,
                        });
                    });
            },
            prefill: { name: 'Customer', email: 'cust@example.com', contact: '9999999999' },
            theme: { color: '#0066cc' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    return (
        <Button
            onClick={openCheckout}
            isLoading={isLoading}
            loadingText="Processing..."
            bg="var(--primary-color)"
            color="white"
            fontWeight="600"
            px={6}
            py={2.5}
            borderRadius="var(--border-radius-md)"
            transition="all var(--transition-normal)"
            _hover={{
                bg: "var(--primary-dark)",
                transform: "translateY(-2px)",
                boxShadow: "var(--shadow-md)",
            }}
            _active={{
                transform: "translateY(0)",
            }}
            isDisabled={isLoading}
            w="100%"
        >
            {isLoading ? 'Processing Payment...' : 'Pay with Razorpay'}
        </Button>
    );
}
