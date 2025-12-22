import React, { useEffect, useState } from 'react'
import {
    Box,
    Button,
    VStack,
    HStack,
    Heading,
    Text,
    useToast,
    Spinner,
    SimpleGrid,
    useColorModeValue,
    Flex,
    Badge,
    Divider,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { getUserOrders, cancelOrder } from '../../api/orders'

export default function OrdersPage() {
    const navigate = useNavigate()
    const toast = useToast()
    
    const pageBg = useColorModeValue('gray.50', 'gray.900')
    const subtleCard = useColorModeValue('white', 'gray.800')
    const mutedText = useColorModeValue('gray.600', 'gray.300')
    const borderColor = useColorModeValue('gray.100', 'gray.700')
    const accent = useColorModeValue('blue.600', 'blue.300')

    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(false)
    const [cancellingId, setCancellingId] = useState(null)

    useEffect(() => {
        fetchOrders()
    }, [])

    async function fetchOrders() {
        setLoading(true)
        try {
            const res = await getUserOrders()
            setOrders(res.orders || [])
        } catch (err) {
            console.error('Failed to fetch orders:', err)
            toast({ title: 'Failed to load orders', status: 'error', duration: 3000 })
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const handleCancelOrder = async (orderId, order) => {
        // Show contextual confirmation, especially for paid orders
        const isPaid = order?.payment_status === 'paid'
        const confirmMsg = isPaid
            ? `This order was paid. Cancelling will initiate a refund which may take 3-7 business days. Do you want to continue?`
            : 'Are you sure you want to cancel this order? Stock will be restored.'

        if (!window.confirm(confirmMsg)) {
            return
        }

        // Optional reason for cancellation (simple prompt)
        const reason = window.prompt('Optional: give a reason for cancellation (helpful for support)', '')

        setCancellingId(orderId)
        try {
            const res = await cancelOrder(orderId, reason)
            toast({
                title: 'Order Cancelled',
                description: res.message || 'Order has been cancelled successfully',
                status: 'success',
                duration: 4000,
            })
            fetchOrders() // Refresh orders list
        } catch (err) {
            console.error('Failed to cancel order:', err)
            toast({
                title: 'Cancellation Failed',
                description: err?.message || err?.response?.data?.message || 'Failed to cancel order',
                status: 'error',
                duration: 4000,
            })
        } finally {
            setCancellingId(null)
        }
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: 'yellow',
            processing: 'blue',
            completed: 'green',
            cancelled: 'red',
            returned: 'orange',
        }
        return colors[status] || 'gray'
    }

    const getPaymentStatusColor = (status) => {
        const colors = {
            pending: 'yellow',
            paid: 'green',
            failed: 'red',
            refunded: 'orange',
            refund_pending: 'yellow',
        }
        return colors[status] || 'gray'
    }

    const canCancelOrder = (order) => {
        // Don't allow if already finalised
        if (['cancelled', 'returned', 'completed'].includes(order.status)) return false

        const orderDate = new Date(order.created_at)
        const currentDate = new Date()
        const daysDifference = (currentDate - orderDate) / (1000 * 60 * 60 * 24)

        // Allow cancellation only within 3 days of placement
        return daysDifference <= 3
    }

    return (
        <Box minH="100vh" bg={pageBg} display="flex" flexDirection="column" w="100vw">
            <Navbar />

            <Box flex={1} py={{ base: 6, md: 10 }}>
                <Box maxW="6xl" mx="auto" px={{ base: 4, md: 8 }}>
                    <VStack align="start" spacing={4} mb={8}>
                        <Heading size="lg">My Orders</Heading>
                        <Text color={mutedText}>
                            View and manage your orders
                        </Text>
                    </VStack>

                    {loading ? (
                        <Box textAlign="center" py={12}>
                            <Spinner size="xl" thickness="4px" color={accent} />
                            <Text mt={4} color={mutedText} fontSize="sm">
                                Loading orders...
                            </Text>
                        </Box>
                    ) : orders.length === 0 ? (
                        <Box
                            bg={subtleCard}
                            p={12}
                            borderRadius="xl"
                            textAlign="center"
                            border="1px dashed"
                            borderColor={borderColor}
                        >
                            <Heading size="md" color="gray.600" mb={3}>
                                No orders yet
                            </Heading>
                            <Text color={mutedText} mb={6}>
                                Start shopping to see your orders here
                            </Text>
                            <Button colorScheme="blue" onClick={() => navigate('/customer/products')}>
                                Start Shopping
                            </Button>
                        </Box>
                    ) : (
                        <VStack spacing={4} align="stretch">
                            {orders.map((order) => (
                                <Box
                                    key={order.id}
                                    bg={subtleCard}
                                    p={6}
                                    borderRadius="xl"
                                    boxShadow="md"
                                    border="1px solid"
                                    borderColor={borderColor}
                                >
                                    <Flex justify="space-between" align="start" wrap="wrap" gap={4} mb={4}>
                                        <VStack align="start" spacing={1}>
                                            <Heading size="sm">Order #{order.order_no}</Heading>
                                            <Text fontSize="sm" color={mutedText}>
                                                Placed on {new Date(order.created_at).toLocaleDateString()}
                                            </Text>
                                        </VStack>
                                        <HStack spacing={3}>
                                            <Badge colorScheme={getStatusColor(order.status)} borderRadius="full" px={3} py={1} textTransform="capitalize">
                                                {order.status}
                                            </Badge>
                                            <Badge colorScheme={getPaymentStatusColor(order.payment_status)} borderRadius="full" px={3} py={1} textTransform="capitalize">
                                                {order.payment_status}
                                            </Badge>
                                        </HStack>
                                    </Flex>

                                    <Divider my={4} />

                                    <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                                        <Text fontWeight="700" fontSize="lg" color="green.600">
                                            ${Number(order.total_amount || 0).toFixed(2)}
                                        </Text>
                                        <HStack spacing={3}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => navigate(`/customer/orders/${order.id}`)}
                                            >
                                                View Details
                                            </Button>
                                            {canCancelOrder(order) && (
                                                <Button
                                                    size="sm"
                                                    colorScheme="red"
                                                    variant="outline"
                                                    onClick={() => handleCancelOrder(order.id, order)}
                                                    isLoading={cancellingId === order.id}
                                                    loadingText="Cancelling..."
                                                >
                                                    Cancel Order
                                                </Button>
                                            )}
                                        </HStack>
                                    </Flex>
                                </Box>
                            ))}
                        </VStack>
                    )}
                </Box>
            </Box>

            <Footer />
        </Box>
    )
}

