import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Divider,
  Spinner,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Heading,
  useColorModeValue,
} from '@chakra-ui/react';
import { createRazorpayOrder, verifyPayment } from '../api/orders';
import { useCart } from '../context/CartContext';

export default function CheckoutModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const { cart, getCartTotal, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [orderCreated, setOrderCreated] = useState(null);

  // Colors for light/dark mode
  const bgCard = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textMuted = useColorModeValue('gray.600', 'gray.400');

  // Calculate totals
  const subtotal = getCartTotal();
  const taxAmount = subtotal * 0.1; // 10% tax
  const shippingAmount = 0; // Free shipping
  const totalAmount = subtotal + taxAmount + shippingAmount;

  /**
   * Handle checkout button click
   * Creates a Razorpay order and initiates payment flow
   */
  const handleCheckout = async () => {
    try {
      setIsLoading(true);

      // ✅ Validate cart
      if (cart.length === 0) {
        toast({
          title: 'Cart is empty',
          description: 'Add items to cart before checking out',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }

      // ✅ Prepare cart items for API
      const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.sell_price,
      }));

      // ✅ Create Razorpay order on backend
      const orderResponse = await createRazorpayOrder(
        items,
        totalAmount,
        taxAmount,
        shippingAmount
      );

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create order');
      }

      // ✅ Store order details for payment verification
      setOrderCreated({
        orderId: orderResponse.orderId,
        orderNo: orderResponse.orderNo,
        razorpayOrderId: orderResponse.razorpayOrderId,
      });

      // ✅ Initialize Razorpay payment
      initializeRazorpay(orderResponse);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Failed',
        description: error.message || 'Unable to process checkout',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initialize Razorpay payment modal
   * This opens the Razorpay secure payment gateway
   */
  const initializeRazorpay = (orderResponse) => {
    // ✅ Check if Razorpay script is loaded
    if (!window.Razorpay) {
      toast({
        title: 'Payment Gateway Error',
        description: 'Razorpay payment gateway failed to load. Please refresh the page.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }


    // console.log(orderResponse.logoUrl)

    if (!orderResponse || !orderResponse.razorpayKeyId || !orderResponse.razorpayOrderId) {
      console.error('Missing Razorpay config in orderResponse', orderResponse);
      toast({
        title: 'Payment Gateway Error',
        description: 'Invalid payment configuration. Please try again later.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    // ✅ Create Razorpay options with proper configuration for test mode
    const options = {
      key: orderResponse.razorpayKeyId, // Razorpay Key ID
      amount: orderResponse.amountInPaise, // Amount in paise (smallest unit)
      currency: 'INR',
      name: 'RetailIQ', // Business name
      description: `Order #${orderResponse.orderNo}`,
      order_id: orderResponse.razorpayOrderId, // Razorpay order ID
      // User contact details
      prefill: {
        // name: orderResponse.userName || 'Test User',
        email: orderResponse.userEmail || 'test@example.com',
      },

      // Theme configuration for better UX
      theme: {
        color: '#FF5722',
      },

      // Test mode configuration - allows card input
      notes: {
        order_id: orderResponse.orderId,
        order_no: orderResponse.orderNo,
      },

      // Callback when payment is successful
      handler: async (response) => {
        await handlePaymentSuccess(response, orderResponse);
      },

      // Callback when payment modal is closed
      modal: {
        ondismiss: () => {
          setPaymentInProgress(false);
          toast({
            title: 'Payment Cancelled',
            description: 'You closed the payment modal',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
        },
      },

      // Enable retry on payment failure
      retry: {
        enabled: true,
        max_count: 3,
      },
    };

    try {
      // ✅ Open Razorpay payment modal
      setPaymentInProgress(true);
      const razorpay = new window.Razorpay(options);

      // Ensure modal is properly initialized
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        setPaymentInProgress(false);
        toast({
          title: 'Payment Failed',
          description: response.error.description || 'Payment could not be processed',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      });

      razorpay.open();
    } catch (error) {
      console.error('Error initializing Razorpay:', error);
      setPaymentInProgress(false);
      setIsLoading(false);
      toast({
        title: 'Payment Gateway Error',
        description: 'Failed to initialize payment gateway. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  /**
   * Handle successful payment from Razorpay
   * Verifies payment signature and confirms order
   */
  const handlePaymentSuccess = async (response, orderResponse) => {
    try {
      setPaymentInProgress(true);

      // ✅ Verify payment on backend
      const verificationResponse = await verifyPayment(
        response.razorpay_order_id,
        response.razorpay_payment_id,
        response.razorpay_signature,
        orderResponse.orderId
      );

      if (!verificationResponse.success) {
        throw new Error(verificationResponse.message || 'Payment verification failed');
      }

      // ✅ Payment verified - Order confirmed
      toast({
        title: '✅ Order Confirmed',
        description: `Order ${verificationResponse.orderNo} has been placed successfully`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      // ✅ Clear cart from local storage
      clearCart();

      // ✅ Call success callback to navigate to confirmation page
      if (onSuccess) {
        onSuccess({
          orderId: verificationResponse.orderId,
          orderNo: verificationResponse.orderNo,
          totalAmount: verificationResponse.totalAmount,
        });
      }

      // ✅ Close checkout modal
      onClose();
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: '⚠️ Payment Verification Failed',
        description: error.message || 'Payment was processed but verification failed. Please contact support.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setPaymentInProgress(false);
    }
  };

  /**
   * Load Razorpay script if not already loaded
   * Enhanced loading with proper error handling
   */
  useEffect(() => {
    // ✅ Check if script already loaded
    if (window.Razorpay) {
      // console.log('✅ Razorpay script already loaded');
      return;
    }

    // ✅ Load Razorpay script from CDN
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      console.log('✅ Razorpay script loaded successfully');
      // Verify Razorpay is accessible
      if (window.Razorpay) {
        console.log('✅ Razorpay object is available');
      } else {
        console.error('❌ Razorpay object not found after script load');
      }
    };

    script.onerror = (error) => {
      console.error('❌ Failed to load Razorpay script:', error);
      toast({
        title: 'Payment Gateway Error',
        description: 'Unable to load payment gateway. Please check your internet connection and refresh the page.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup is optional (script will remain for subsequent payments)
    };
  }, [toast]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent bg={bgCard}>
        {/* ✅ Modal Header */}
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Heading size="md">Order Summary</Heading>
            <Text fontSize="sm" color={textMuted}>
              Review your order before payment
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isLoading || paymentInProgress} />

        {/* ✅ Modal Body */}
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* ✅ Cart Items Summary */}
            <Box>
              <Heading size="sm" mb={3}>
                Items ({cart.length})
              </Heading>
              <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
                {cart.map(item => (
                  <HStack
                    key={item.id}
                    justify="space-between"
                    p={2}
                    borderRadius="md"
                    bg={useColorModeValue('white', 'gray.700')}
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="600" fontSize="sm">
                        {item.name}
                      </Text>
                      <Text fontSize="xs" color={textMuted}>
                        Qty: {item.quantity}
                      </Text>
                    </VStack>
                    <Text fontWeight="600" color="green.600">
                      ₹{(item.sell_price * item.quantity).toFixed(2)}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>

            <Divider />

            {/* ✅ Order Summary Details */}
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text color={textMuted}>Subtotal</Text>
                <Text fontWeight="600">₹{subtotal.toFixed(2)}</Text>
              </HStack>

              <HStack justify="space-between">
                <Text color={textMuted}>Tax (10%)</Text>
                <Text fontWeight="600">₹{taxAmount.toFixed(2)}</Text>
              </HStack>

              <HStack justify="space-between">
                <Text color={textMuted}>Shipping</Text>
                <Text fontWeight="600" color="green.600">
                  Free
                </Text>
              </HStack>

              <Divider />

              <HStack justify="space-between">
                <Heading size="md">Total Amount</Heading>
                <Heading size="md" color="green.600">
                  ₹{totalAmount.toFixed(2)}
                </Heading>
              </HStack>
            </VStack>

            {/* ✅ Security Note */}
            <Box
              p={3}
              bg="blue.50"
              borderRadius="md"
              borderLeftWidth="4px"
              borderLeftColor="blue.500"
            >
              <Text fontSize="xs" color="blue.700">
                🔒 This is a secure payment. Your payment details are encrypted and processed by Razorpay.
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        {/* ✅ Modal Footer */}
        <ModalFooter>
          <HStack spacing={3} w="100%">
            <Button
              variant="outline"
              onClick={onClose}
              isDisabled={isLoading || paymentInProgress}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleCheckout}
              isLoading={isLoading || paymentInProgress}
              loadingText={
                isLoading ? 'Creating Order...' : 'Processing Payment...'
              }
              isDisabled={cart.length === 0}
              flex={1}
            >
              {paymentInProgress ? 'Complete Payment' : 'Proceed to Payment'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
