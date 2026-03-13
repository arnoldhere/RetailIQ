import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Select,
  Heading,
  Icon,
} from '@chakra-ui/react';

import { FiLock, FiCheckCircle } from 'react-icons/fi';
import { createRazorpayOrder, verifyPayment } from '../api/orders';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8888';

export default function CheckoutModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const navigate = useNavigate();

  const { cart, getCartTotal, clearCart } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [loadingStores, setLoadingStores] = useState(false);

  const subtotal = getCartTotal();
  const taxAmount = subtotal * 0.1;
  const shippingAmount = 0;
  const totalAmount = subtotal + taxAmount + shippingAmount;

  /* --------------------------------------------------
     Load Razorpay Script Safely
  ---------------------------------------------------*/

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;

      script.onload = () => resolve(true);
      script.onerror = () =>
        reject(new Error('Razorpay SDK failed to load'));

      document.body.appendChild(script);
    });
  };

  /* --------------------------------------------------
     Fetch Stores
  ---------------------------------------------------*/

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoadingStores(true);

        const response = await axios.get(`${BACKEND_URL}/api/stores`);

        setStores(response.data.stores || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingStores(false);
      }
    };

    if (isOpen) fetchStores();
  }, [isOpen]);

  /* --------------------------------------------------
     Checkout Handler
  ---------------------------------------------------*/

  const handleCheckout = async () => {
    try {
      setIsLoading(true);

      if (cart.length === 0) {
        toast({
          title: 'Cart is empty',
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      const items = cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.sell_price,
      }));

      const orderResponse = await createRazorpayOrder(
        items,
        totalAmount,
        taxAmount,
        shippingAmount,
        selectedStoreId || null
      );

      if (!orderResponse.success) {
        throw new Error(orderResponse.message);
      }

      await loadRazorpayScript();

      initializeRazorpay(orderResponse);
    } catch (error) {
      toast({
        title: 'Checkout Failed',
        description: error.message,
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* --------------------------------------------------
     Razorpay Initialization
  ---------------------------------------------------*/

  const initializeRazorpay = (orderResponse) => {
    const options = {
      key: orderResponse.razorpayKeyId,
      amount: orderResponse.amountInPaise,
      currency: 'INR',

      name: 'RetailIQ',
      description: `Order #${orderResponse.orderNo}`,
      order_id: orderResponse.razorpayOrderId,

      theme: {
        color: '#0066cc',
      },

      prefill: {
        name: orderResponse.userName,
        email: orderResponse.userEmail,
        contact: orderResponse.userPhone || '',
      },

      handler: async function (response) {
        await handlePaymentSuccess(response, orderResponse);
      },

      modal: {
        ondismiss: () => {
          toast({
            title: 'Payment cancelled',
            status: 'info',
          });
        },
      },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on('payment.failed', function (response) {
      toast({
        title: 'Payment Failed',
        description: response.error.description,
        status: 'error',
      });
    });

    setPaymentInProgress(true);
    razorpay.open();
  };

  /* --------------------------------------------------
     Payment Success
  ---------------------------------------------------*/

  const handlePaymentSuccess = async (response, orderResponse) => {
    try {
      const verificationResponse = await verifyPayment(
        response.razorpay_order_id,
        response.razorpay_payment_id,
        response.razorpay_signature,
        orderResponse.orderId
      );

      if (!verificationResponse.success) {
        throw new Error('Payment verification failed');
      }

      toast({
        title: 'Order Confirmed',
        status: 'success',
      });

      clearCart();

      if (onSuccess) {
        onSuccess({
          orderId: verificationResponse.orderId,
          orderNo: verificationResponse.orderNo,
        });
      }

      navigate('/customer/my-orders');
      onClose();
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        status: 'error',
      });
    } finally {
      setPaymentInProgress(false);
    }
  };

  /* --------------------------------------------------
     UI
  ---------------------------------------------------*/

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(5px)" />

      <ModalContent>

        <ModalHeader>
          <HStack>
            <Icon as={FiCheckCircle} />
            <Heading size="md">Order Summary</Heading>
          </HStack>
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>

          <VStack spacing={4} align="stretch">

            <Heading size="sm">Items ({cart.length})</Heading>

            {cart.map((item) => (
              <HStack key={item.id} justify="space-between">
                <Text>{item.name}</Text>
                <Text>
                  ₹{(item.sell_price * item.quantity).toFixed(2)}
                </Text>
              </HStack>
            ))}

            <Divider />

            <FormControl>
              <FormLabel>Select Store</FormLabel>

              {loadingStores ? (
                <Spinner />
              ) : (
                <Select
                  placeholder="Optional store"
                  value={selectedStoreId}
                  onChange={(e) =>
                    setSelectedStoreId(e.target.value)
                  }
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormControl>

            <Divider />

            <HStack justify="space-between">
              <Text>Subtotal</Text>
              <Text>₹{subtotal.toFixed(2)}</Text>
            </HStack>

            <HStack justify="space-between">
              <Text>Tax</Text>
              <Text>₹{taxAmount.toFixed(2)}</Text>
            </HStack>

            <HStack justify="space-between">
              <Heading size="md">Total</Heading>
              <Heading size="md">
                ₹{totalAmount.toFixed(2)}
              </Heading>
            </HStack>

            <Box bg="gray.50" p={3} borderRadius="md">
              <HStack>
                <Icon as={FiLock} />
                <Text fontSize="sm">
                  Secure payment powered by Razorpay
                </Text>
              </HStack>
            </Box>

          </VStack>

        </ModalBody>

        <ModalFooter>

          <HStack w="100%">

            <Button flex={1} onClick={onClose}>
              Cancel
            </Button>

            <Button
              flex={1}
              colorScheme="blue"
              onClick={handleCheckout}
              isLoading={isLoading || paymentInProgress}
            >
              Proceed to Payment
            </Button>

          </HStack>

        </ModalFooter>

      </ModalContent>
    </Modal>
  );
}