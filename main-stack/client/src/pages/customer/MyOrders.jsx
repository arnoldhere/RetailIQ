import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Spinner,
    useColorModeValue,
    Badge,
    Card,
    CardBody,
    SimpleGrid,
    Icon,
    useToast,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
} from '@chakra-ui/react';
import { ArrowBackIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getUserOrders, cancelOrder, getOrderDetails } from '../../api/orders';
import { FaBox, FaCheckCircle, FaClock, FaTimesCircle, FaUndoAlt } from 'react-icons/fa';

export default function MyOrders() {
    const navigate = useNavigate();
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const cancelRef = React.useRef();

    // Colors for light/dark mode
    const bgCard = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const textMuted = useColorModeValue('gray.600', 'gray.400');
    const headerBg = useColorModeValue('gray.50', 'gray.700');
    const hoverBg = useColorModeValue('gray.100', 'gray.700');

    /**
     * Fetch all user orders on component mount
     */
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await getUserOrders();
                setOrders(response.orders || []);
                setError(null);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError(err.message || 'Failed to fetch orders');
                toast({
                    title: 'Error',
                    description: 'Failed to load your orders',
                    status: 'error',
                    duration: 5,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [toast]);

    /**
     * Get status badge color based on order status
     */
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'green';
            case 'processing':
                return 'blue';
            case 'pending':
                return 'yellow';
            case 'cancelled':
                return 'red';
            case 'returned':
                return 'orange';
            default:
                return 'gray';
        }
    };

    /**
     * Get payment status badge color
     */
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

    /**
     * Get status icon based on order status
     */
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <Icon as={FaCheckCircle} color="green.500" />;
            case 'processing':
                return <Icon as={FaClock} color="blue.500" />;
            case 'pending':
                return <Icon as={FaClock} color="yellow.500" />;
            case 'cancelled':
                return <Icon as={FaTimesCircle} color="red.500" />;
            default:
                return <Icon as={FaBox} color="gray.500" />;
        }
    };

    /**
     * Handle view order details
     */
    const handleViewOrder = (orderId) => {
        navigate(`/customer/order-confirmation/${orderId}`);
    };

    /**
     * Open cancel confirmation dialog
     */
    const handleCancelClick = (order) => {
        setSelectedOrder(order);
        setIsAlertOpen(true);
    };

    /**
     * Confirm order cancellation
     */
    const handleConfirmCancel = async () => {
        if (!selectedOrder) return;

        try {
            setCancellingId(selectedOrder.id);
            await cancelOrder(selectedOrder.id);

            // Remove cancelled order from list
            setOrders(orders.map((order) =>
                order.id === selectedOrder.id ? { ...order, status: 'cancelled' } : order
            ));

            toast({
                title: 'Success',
                description: `Order ${selectedOrder.orderNo} cancelled successfully`,
                status: 'success',
                duration: 5,
                isClosable: true,
            });

            setIsAlertOpen(false);
            setSelectedOrder(null);
        } catch (err) {
            console.error('Error cancelling order:', err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to cancel order',
                status: 'error',
                duration: 5,
                isClosable: true,
            });
        } finally {
            setCancellingId(null);
        }
    };

    // ✅ Loading state
    if (loading) {
        return (
            <Box minH="100vh" display="flex" flexDirection="column" bg={useColorModeValue('gray.50', 'gray.900')} w="100vw">
                <Navbar />
                <Box flex={1} display="flex" justifyContent="center" alignItems="center">
                    <VStack spacing={4}>
                        <Spinner size="xl" thickness="4px" color="blue.500" />
                        <Text color={textMuted}>Loading your orders...</Text>
                    </VStack>
                </Box>
                <Footer />
            </Box>
        );
    }

    // ✅ Error state
    if (error) {
        return (
            <Box minH="100vh" display="flex" flexDirection="column" bg={useColorModeValue('gray.50', 'gray.900')} w="100vw">
                <Navbar />
                <Box flex={1} display="flex" justifyContent="center" alignItems="center">
                    <Container maxW="container.md">
                        <Box bg={bgCard} p={8} borderRadius="xl" textAlign="center">
                            <Heading size="md" color="red.600" mb={4}>
                                ❌ Error Loading Orders
                            </Heading>
                            <Text color={textMuted} mb={6}>
                                {error}
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

    // ✅ Empty state
    if (orders.length === 0) {
        return (
            <Box minH="100vh" display="flex" flexDirection="column" bg={useColorModeValue('gray.50', 'gray.900')} w="100vw">
                <Navbar />

                <Box flex={1} py={{ base: 6, md: 12 }}>
                    <Container maxW="container.lg">
                        <Card bg={bgCard} borderWidth="1px" borderColor={borderColor}>
                            <CardBody textAlign="center" py={12}>
                                <Icon as={FaBox} boxSize={16} color="gray.400" mb={4} mx="auto" />
                                <Heading size="lg" mb={2}>
                                    No Orders Yet
                                </Heading>
                                <Text color={textMuted} mb={6} fontSize="md">
                                    You haven't placed any orders yet. Start shopping to create your first order!
                                </Text>
                                <Button
                                    colorScheme="blue"
                                    size="lg"
                                    onClick={() => navigate('/customer/products')}
                                >
                                    Continue Shopping
                                </Button>
                            </CardBody>
                        </Card>
                    </Container>
                </Box>

                <Footer />
            </Box>
        );
    }

    return (
        <Box minH="100vh" display="flex" flexDirection="column" bg={useColorModeValue('gray.50', 'gray.900')} w="100vw">
            <Navbar />

            <Box flex={1} py={{ base: 6, md: 12 }}>
                <Container maxW="container.lg">
                    <VStack spacing={6} align="stretch">
                        {/* ✅ Header */}
                        <HStack justify="space-between" align="center">
                            <VStack align="start" spacing={1}>
                                <Heading size="lg">My Orders</Heading>
                                <Text color={textMuted} fontSize="sm">
                                    You have {orders.length} order{orders.length !== 1 ? 's' : ''}
                                </Text>
                            </VStack>
                            <Button
                                leftIcon={<ArrowBackIcon />}
                                variant="outline"
                                onClick={() => navigate('/customer/home')}
                            >
                                Back to Home
                            </Button>
                        </HStack>

                        {/* ✅ Order Stats */}
                        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                            <Card bg={bgCard} borderWidth="1px" borderColor={borderColor}>
                                <CardBody>
                                    <VStack align="start" spacing={2}>
                                        <Icon as={FaBox} boxSize={5} color="blue.500" />
                                        <Text fontSize="xs" color={textMuted} textTransform="uppercase">
                                            Total Orders
                                        </Text>
                                        <Heading size="lg">{orders.length}</Heading>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card bg={bgCard} borderWidth="1px" borderColor={borderColor}>
                                <CardBody>
                                    <VStack align="start" spacing={2}>
                                        <Icon as={FaCheckCircle} boxSize={5} color="green.500" />
                                        <Text fontSize="xs" color={textMuted} textTransform="uppercase">
                                            Completed
                                        </Text>
                                        <Heading size="lg">
                                            {orders.filter((o) => o.status === 'completed').length}
                                        </Heading>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card bg={bgCard} borderWidth="1px" borderColor={borderColor}>
                                <CardBody>
                                    <VStack align="start" spacing={2}>
                                        <Icon as={FaClock} boxSize={5} color="yellow.500" />
                                        <Text fontSize="xs" color={textMuted} textTransform="uppercase">
                                            Processing
                                        </Text>
                                        <Heading size="lg">
                                            {orders.filter((o) => o.status === 'processing' || o.status === 'pending').length}
                                        </Heading>
                                    </VStack>
                                </CardBody>
                            </Card>

                            <Card bg={bgCard} borderWidth="1px" borderColor={borderColor}>
                                <CardBody>
                                    <VStack align="start" spacing={2}>
                                        <Icon as={FaTimesCircle} boxSize={5} color="red.500" />
                                        <Text fontSize="xs" color={textMuted} textTransform="uppercase">
                                            Cancelled
                                        </Text>
                                        <Heading size="lg">
                                            {orders.filter((o) => o.status === 'cancelled').length}
                                        </Heading>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>

                        {/* ✅ Orders Table */}
                        <Card bg={bgCard} borderWidth="1px" borderColor={borderColor} overflowX="auto">
                            <CardBody p={0}>
                                <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
                                    <Thead bg={headerBg}>
                                        <Tr>
                                            <Th>Order No.</Th>
                                            <Th>Date</Th>
                                            <Th isNumeric>Amount</Th>
                                            <Th>Status</Th>
                                            <Th>Payment</Th>
                                            <Th>Actions</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {orders.map((order) => (
                                            <Tr key={order.id} _hover={{ bg: hoverBg }} cursor="pointer">
                                                <Td fontWeight="600">{order.orderNo}</Td>
                                                <Td>
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </Td>
                                                <Td isNumeric fontWeight="700" color="green.600">
                                                    ₹{order.totalAmount.toFixed(2)}
                                                </Td>
                                                <Td>
                                                    <HStack spacing={2}>
                                                        {getStatusIcon(order.status)}
                                                        <Badge colorScheme={getStatusColor(order.status)}>
                                                            {order.status.toUpperCase()}
                                                        </Badge>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={getPaymentStatusColor(order.paymentStatus)}>
                                                        {order.paymentStatus.toUpperCase()}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <HStack spacing={2}>
                                                        <Button
                                                            leftIcon={<ViewIcon />}
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleViewOrder(order.id)}
                                                            title="View order details"
                                                        >
                                                            View
                                                        </Button>

                                                        {/* ✅ Show cancel button only for pending/processing orders */}
                                                        {(order.status === 'pending' || order.status === 'processing') && order.paymentStatus !== 'paid' && (
                                                            <Button
                                                                leftIcon={<DeleteIcon />}
                                                                size="sm"
                                                                colorScheme="red"
                                                                variant="ghost"
                                                                isLoading={cancellingId === order.id}
                                                                onClick={() => handleCancelClick(order)}
                                                                title="Cancel this order"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        )}
                                                    </HStack>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </VStack>
                </Container>
            </Box>

            <Footer />

            {/* ✅ Cancel Confirmation Dialog */}
            <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={() => setIsAlertOpen(false)}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Cancel Order?
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to cancel order <strong>{selectedOrder?.orderNo}</strong>? This action cannot be undone.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => setIsAlertOpen(false)}>
                                Keep Order
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={handleConfirmCancel}
                                ml={3}
                                isLoading={cancellingId === selectedOrder?.id}
                            >
                                Yes, Cancel Order
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
}
