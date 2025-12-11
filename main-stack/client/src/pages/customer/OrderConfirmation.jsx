import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Divider,
  Spinner,
  useColorModeValue,
  Badge,
  SimpleGrid,
  Card,
  CardBody,
  Icon,
} from '@chakra-ui/react';
import { CheckCircleIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getOrderDetails } from '../../api/orders';
import { FaBox, FaCreditCard, FaCalendarAlt } from 'react-icons/fa';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- ALL hooks (including useColorModeValue) must be called unconditionally here ---
  const bgCard = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textMuted = useColorModeValue('gray.600', 'gray.400');
  const bgSuccess = useColorModeValue('green.50', 'green.900');
  const borderSuccess = useColorModeValue('green.200', 'green.700');

  // Replace inline calls with dedicated variables so the hook count/order never changes.
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const itemBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await getOrderDetails(orderId);
        setOrder(response);
        setError(null);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'blue';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      case 'returned':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      case 'refunded':
        return 'orange';
      default:
        return 'gray';
    }
  };

  // Loading
  if (loading) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" bg={pageBg} w="100vw">
        <Navbar />
        <Box flex={1} display="flex" justifyContent="center" alignItems="center">
          <VStack spacing={4}>
            <Spinner size="xl" thickness="4px" color="green.500" />
            <Text color={textMuted}>Loading order details...</Text>
          </VStack>
        </Box>
        <Footer />
      </Box>
    );
  }

  // Error
  if (error || !order) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" bg={pageBg} w="100vw">
        <Navbar />
        <Box flex={1} display="flex" justifyContent="center" alignItems="center">
          <Container maxW="container.md">
            <Box bg={bgCard} p={8} borderRadius="xl" textAlign="center">
              <Heading size="md" color="red.600" mb={4}>
                ❌ Error Loading Order
              </Heading>
              <Text color={textMuted} mb={6}>
                {error || 'Order not found'}
              </Text>
              <Button
                leftIcon={<ArrowBackIcon />}
                colorScheme="blue"
                onClick={() => navigate('/customer/home')}
              >
                Back to Home
              </Button>
            </Box>
          </Container>
        </Box>
        <Footer />
      </Box>
    );
  }

  // Success render
  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg={pageBg} w="100vw">
      <Navbar />

      <Box flex={1} py={{ base: 6, md: 12 }}>
        <Container maxW="container.lg">
          <VStack spacing={6} align="stretch">
            <Box
              bg={bgSuccess}
              borderWidth="2px"
              borderColor={borderSuccess}
              borderRadius="xl"
              p={8}
              textAlign="center"
            >
              <VStack spacing={3}>
                <Icon as={CheckCircleIcon} boxSize={16} color="green.600" />
                <Heading size="lg" color="green.600">
                  Order Confirmed!
                </Heading>
                <Text color={textMuted} fontSize="md">
                  Thank you for your purchase. Your order has been placed successfully.
                </Text>
              </VStack>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Card bg={bgCard} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <HStack spacing={2}>
                      <Icon as={FaBox} boxSize={5} color="blue.500" />
                      <Heading size="sm">Order Number</Heading>
                    </HStack>
                    <Text fontSize="lg" fontWeight="700" color="blue.600">
                      {order.order.orderNo}
                    </Text>
                    <Text fontSize="xs" color={textMuted}>
                      Order ID: {order.order.id}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={bgCard} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <HStack spacing={2}>
                      <Icon as={FaCreditCard} boxSize={5} color="green.500" />
                      <Heading size="sm">Payment Status</Heading>
                    </HStack>
                    <Badge colorScheme={getPaymentStatusColor(order.order.paymentStatus)}>
                      {order.order.paymentStatus.toUpperCase()}
                    </Badge>
                    <Text fontSize="sm" color={textMuted}>
                      Amount: ₹{order.order.totalAmount}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={bgCard} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <HStack spacing={2}>
                      <Icon as={FaCalendarAlt} boxSize={5} color="orange.500" />
                      <Heading size="sm">Order Status</Heading>
                    </HStack>
                    <Badge colorScheme={getStatusColor(order.order.status)}>
                      {order.order.status.toUpperCase()}
                    </Badge>
                    <Text fontSize="xs" color={textMuted}>
                      Placed on{' '}
                      {new Date(order.order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>

            <Card bg={bgCard} borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <Heading size="sm" mb={4}>
                  Order Items
                </Heading>
                <VStack spacing={3} align="stretch">
                  {order.items && order.items.map((item) => (
                    <HStack
                      key={item.id}
                      justify="space-between"
                      p={3}
                      borderRadius="md"
                      bg={itemBg}
                    >
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="600" fontSize="sm">
                          {item.name}
                        </Text>
                        <Text fontSize="xs" color={textMuted}>
                          Qty: {item.qty} × ₹{item.unit_price}
                        </Text>
                      </VStack>
                      <Text fontWeight="700" color="green.600">
                        ₹{item.total_amount}
                      </Text>
                    </HStack>
                  ))}
                </VStack>

                <Divider my={4} />

                <HStack justify="space-between">
                  <Heading size="sm">Total Amount</Heading>
                  <Heading size="sm" color="green.600">
                    ₹{order.order.totalAmount}
                  </Heading>
                </HStack>
              </CardBody>
            </Card>

            {order.payment && (
              <Card bg={bgCard} borderWidth="1px" borderColor={borderColor}>
                <CardBody>
                  <Heading size="sm" mb={4}>
                    Payment Details
                  </Heading>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text color={textMuted}>Payment Method</Text>
                      <Text fontWeight="600" textTransform="uppercase">
                        {order.payment.method}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color={textMuted}>Reference ID</Text>
                      <Text fontWeight="600" fontSize="sm" fontFamily="mono">
                        {order.payment.reference}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color={textMuted}>Payment Date</Text>
                      <Text fontWeight="600">
                        {new Date(order.payment.date).toLocaleDateString('en-IN')}
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            )}

            <Card bg="blue.50" borderWidth="2px" borderColor="blue.200">
              <CardBody>
                <Heading size="sm" mb={3} color="blue.700">
                  📋 What's Next?
                </Heading>
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" color="blue.700">
                    ✅ Your order has been confirmed and is being processed
                  </Text>
                  <Text fontSize="sm" color="blue.700">
                    📦 You will receive a tracking number via email shortly
                  </Text>
                  <Text fontSize="sm" color="blue.700">
                    🚚 Expected delivery within 3-5 business days
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <HStack spacing={4} justify="center" pt={4}>
              <Button
                leftIcon={<ArrowBackIcon />}
                variant="outline"
                onClick={() => navigate('/customer/home')}
              >
                Back to Home
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => navigate('/customer/products')}
              >
                Continue Shopping
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
