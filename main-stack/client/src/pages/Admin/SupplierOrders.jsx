import React, { useEffect, useState } from 'react'
import {
    Box,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    VStack,
    HStack,
    Heading,
    Text,
    useToast,
    Input,
    Spinner,
    TableContainer,
    Select,
    SimpleGrid,
    useColorModeValue,
    Flex,
    Divider,
    Badge,
    InputGroup,
    InputLeftElement,
    FormControl,
    FormLabel,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import AdminSidebar from '../../components/AdminSidebar'
import * as adminApi from '../../api/admin'

export default function SupplierOrdersPage() {
    const toast = useToast()
    
    const pageBg = useColorModeValue('gray.50', 'gray.900')
    const subtleCard = useColorModeValue('white', 'gray.800')
    const mutedText = useColorModeValue('gray.600', 'gray.300')
    const borderColor = useColorModeValue('gray.100', 'gray.700')
    const headerBg = useColorModeValue(
        'linear-gradient(90deg, rgba(59,130,246,0.06), rgba(99,102,241,0.03))',
        'transparent'
    )
    const accent = useColorModeValue('blue.600', 'blue.300')
    const tableStripe = useColorModeValue('white', 'gray.800')
    const hoverBg = useColorModeValue('gray.50', 'gray.700')
    const tableHeadBg = useColorModeValue('white', 'gray.800')

    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [filters, setFilters] = useState({
        search: '',
        status: '',
    })
    const [limit] = useState(12)
    const [offset, setOffset] = useState(0)

    useEffect(() => {
        fetchOrders()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, offset, limit])

    async function fetchOrders() {
        setLoading(true)
        try {
            const res = await adminApi.getSupplierOrders(limit, offset, filters)
            setOrders(res.data.orders || [])
            setTotal(res.data.total || 0)
        } catch (err) {
            console.error('Failed to fetch orders:', err)
            toast({ title: 'Failed to load orders', status: 'error', duration: 3000 })
            setOrders([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (key, value) => {
        setOffset(0)
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: 'yellow',
            sent: 'blue',
            received: 'green',
            cancelled: 'red',
        }
        return colors[status] || 'gray'
    }

    const totalPages = Math.ceil(total / limit)
    const currentPage = Math.floor(offset / limit) + 1

    // payments modal state
    const [paymentsOpen, setPaymentsOpen] = useState(false)
    const [currentOrderId, setCurrentOrderId] = useState(null)
    const [payments, setPayments] = useState([])
    const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: '', method: 'CASH', payment_ref: '' })
    const [savingPayment, setSavingPayment] = useState(false)

    const openPayments = async (orderId) => {
        setCurrentOrderId(orderId)
        setPaymentsOpen(true)
        try {
            const res = await adminApi.getSupplyPayments(orderId)
            setPayments(res.data.payments || [])
        } catch (err) {
            console.error('Failed to load payments', err)
            setPayments([])
        }
    }

    const closePayments = () => {
        setPaymentsOpen(false)
        setCurrentOrderId(null)
        setPayments([])
        setPaymentForm({ amount: '', payment_date: '', method: 'CASH', payment_ref: '' })
    }

    const handleRecordPayment = async () => {
        if (!paymentForm.amount || Number(paymentForm.amount) <= 0) return toast({ title: 'Amount required', status: 'warning' })
        try {
            setSavingPayment(true)
            await adminApi.recordSupplyPayment(currentOrderId, paymentForm)
            toast({ title: 'Payment recorded', status: 'success' })
            const res = await adminApi.getSupplyPayments(currentOrderId)
            setPayments(res.data.payments || [])
            setPaymentForm({ amount: '', payment_date: '', method: 'CASH', payment_ref: '' })
        } catch (err) {
            console.error('Failed to record payment', err)
            toast({ title: 'Failed to record payment', status: 'error' })
        } finally {
            setSavingPayment(false)
        }
    }

    return (
        <Box minH="100vh" bg={pageBg} display="flex" flexDirection="column" w="100vw">
            <Navbar />

            <Box flex={1} py={{ base: 6, md: 10 }}>
                <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }}>
                    <SimpleGrid columns={{ base: 1, lg: 5 }} spacing={6} alignItems="flex-start">
                        <Box
                            as="aside"
                            display={{ base: 'none', lg: 'block' }}
                            rounded="2xl"
                            overflow="hidden"
                            boxShadow="sm"
                            bg={subtleCard}
                            border="1px solid"
                            borderColor={borderColor}
                        >
                            <AdminSidebar />
                        </Box>

                        <Box
                            gridColumn={{ base: '1 / -1', lg: 'span 4' }}
                            bg={subtleCard}
                            borderRadius="2xl"
                            boxShadow="lg"
                            border="1px solid"
                            borderColor={borderColor}
                            p={{ base: 4, md: 6 }}
                        >
                            <Flex justify="space-between" align="flex-start" mb={6} wrap="wrap" gap={4}>
                                <VStack align="flex-start" spacing={1}>
                                    <HStack spacing={3}>
                                        <Heading size="lg">Supplier Orders</Heading>
                                    </HStack>
                                    <Text color={mutedText} fontSize="sm">
                                        View and manage purchase orders from suppliers.
                                    </Text>
                                </VStack>
                            </Flex>

                            <Divider mb={5} />

                            {/* Filters */}
                            <Box bg={subtleCard} p={{ base: 4, md: 6 }} borderRadius="xl" boxShadow="sm" mb={6} border="1px solid" borderColor={borderColor}>
                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} alignItems="end">
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="600" color={mutedText}>
                                            Search
                                        </FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <SearchIcon color={mutedText} />
                                            </InputLeftElement>
                                            <Input
                                                placeholder="Search orders..."
                                                value={filters.search}
                                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                                borderRadius="lg"
                                                bg={useColorModeValue('white', 'gray.700')}
                                                borderColor={borderColor}
                                                _focus={{
                                                    borderColor: accent,
                                                    boxShadow: `0 0 0 1px ${accent}`,
                                                }}
                                            />
                                        </InputGroup>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="600" color={mutedText}>
                                            Status
                                        </FormLabel>
                                        <Select
                                            value={filters.status}
                                            onChange={(e) => handleFilterChange('status', e.target.value)}
                                            borderRadius="lg"
                                            bg={useColorModeValue('white', 'gray.700')}
                                            borderColor={borderColor}
                                        >
                                            <option value="">All statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="sent">Sent</option>
                                            <option value="received">Received</option>
                                            <option value="cancelled">Cancelled</option>
                                        </Select>
                                    </FormControl>
                                </SimpleGrid>
                            </Box>

                            {/* Table */}
                            {loading ? (
                                <Box textAlign="center" py={12} display="flex" flexDirection="column" alignItems="center">
                                    <Spinner size="xl" thickness="4px" color={accent} />
                                    <Text mt={4} color={mutedText} fontSize="sm">
                                        Loading orders...
                                    </Text>
                                </Box>
                            ) : orders.length === 0 ? (
                                <Box
                                    borderRadius="2xl"
                                    textAlign="center"
                                    border="1px dashed"
                                    borderColor={borderColor}
                                    py={10}
                                    px={6}
                                    bg={headerBg}
                                >
                                    <Heading size="sm" color="gray.700" mb={2}>
                                        No orders found
                                    </Heading>
                                </Box>
                            ) : (
                                <>
                                    <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor={borderColor} bg={tableStripe}>
                                        <TableContainer maxH="62vh" overflowY="auto">
                                            <Table variant="simple" size="sm">
                                                <Thead position="sticky" top={0} zIndex={1} bg={tableHeadBg}>
                                                    <Tr>
                                                        <Th fontWeight="700" color="white.700">Order No</Th>
                                                        <Th fontWeight="700" color="white.700">Supplier</Th>
                                                        <Th fontWeight="700" color="white.700">Store</Th>
                                                        <Th fontWeight="700" color="white.700">Ordered By</Th>
                                                        <Th fontWeight="700" color="white.700" isNumeric>Amount</Th>
                                                        <Th fontWeight="700" color="white.700" textAlign="center">Status</Th>
                                                        <Th fontWeight="700" color="white.700">Delivery Date</Th>
                                                        <Th fontWeight="700" color="white.700">Date</Th>
                                                        <Th fontWeight="700" color="white.700">Actions</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {orders.map((order, idx) => (
                                                        <Tr
                                                            key={order.id}
                                                            borderBottom="1px"
                                                            borderColor={borderColor}
                                                            bg={idx % 2 === 0 ? 'transparent' : tableStripe}
                                                            _hover={{ bg: hoverBg, transform: 'translateY(-1px)', boxShadow: 'sm' }}
                                                            transition="all 0.15s ease-out"
                                                        >
                                                            <Td fontWeight="600" color="white.800" fontSize="sm">{order.order_no}</Td>
                                                            <Td fontSize="sm" color={mutedText}>{order.supplier_name || '-'}</Td>
                                                            <Td fontSize="sm" color={mutedText}>{order.store_name || '-'}</Td>
                                                            <Td fontSize="sm" color={mutedText}>
                                                                {order.ordered_by_firstname && order.ordered_by_lastname
                                                                    ? `${order.ordered_by_firstname} ${order.ordered_by_lastname}`
                                                                    : '-'}
                                                            </Td>
                                                            <Td isNumeric fontWeight="700" color="green.600" fontSize="sm">
                                                                ${Number(order.total_amount || 0).toFixed(2)}
                                                            </Td>
                                                            <Td textAlign="center">
                                                                <Badge colorScheme={getStatusColor(order.status)} borderRadius="full" px={3} py={0.5} textTransform="capitalize">
                                                                    {order.status}
                                                                </Badge>
                                                            </Td>
                                                            <Td fontSize="sm" color={mutedText}>
                                                                {order.deliver_at ? new Date(order.deliver_at).toLocaleDateString() : '-'}
                                                            </Td>
                                                            <Td fontSize="sm" color={mutedText}>
                                                                {new Date(order.created_at).toLocaleDateString()}
                                                            </Td>
                                                            <Td>
                                                                <Button size="sm" onClick={() => openPayments(order.id)}>Payments</Button>
                                                            </Td>
                                                        </Tr>
                                                    ))}
                                                </Tbody>
                                            </Table>
                                        </TableContainer>
                                    </Box>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <Flex justify="center" gap={4} align="center" mt={6}>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setOffset(Math.max(0, offset - limit))}
                                                isDisabled={offset === 0}
                                                borderRadius="md"
                                            >
                                                Previous
                                            </Button>

                                            <Text fontWeight="600" color={mutedText}>
                                                Page {currentPage} of {totalPages} ({total} total)
                                            </Text>

                                            <Button
                                                variant="ghost"
                                                onClick={() => setOffset(offset + limit)}
                                                isDisabled={currentPage === totalPages}
                                                borderRadius="md"
                                            >
                                                Next
                                            </Button>
                                        </Flex>
                                    )}
                                </>
                            )}
                        </Box>
                    </SimpleGrid>
                </Box>
            </Box>

            <Footer />

            {/* Payments Modal */}
            <Modal isOpen={paymentsOpen} onClose={closePayments} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Payments for Order {currentOrderId}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {payments.length === 0 ? (
                            <Text>No payments found</Text>
                        ) : (
                            <Table size="sm">
                                <Thead><Tr><Th>Date</Th><Th isNumeric>Amount</Th><Th>Method</Th><Th>Ref</Th></Tr></Thead>
                                <Tbody>
                                    {payments.map(p => (
                                        <Tr key={p.id}><Td>{p.payment_date || new Date(p.created_at).toLocaleDateString()}</Td><Td isNumeric>${Number(p.amount).toFixed(2)}</Td><Td>{p.method}</Td><Td>{p.payment_ref || '-'}</Td></Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        )}

                        <Box mt={4}>
                            <FormControl>
                                <FormLabel>Amount</FormLabel>
                                <Input value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                            </FormControl>
                            <FormControl mt={3}>
                                <FormLabel>Payment Date</FormLabel>
                                <Input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
                            </FormControl>
                            <FormControl mt={3}>
                                <FormLabel>Method</FormLabel>
                                <Select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                                    <option value="CASH">CASH</option>
                                    <option value="CARD">CARD</option>
                                    <option value="IMPS">IMPS</option>
                                    <option value="OTHER">OTHER</option>
                                </Select>
                            </FormControl>
                            <FormControl mt={3}>
                                <FormLabel>Reference</FormLabel>
                                <Input value={paymentForm.payment_ref} onChange={(e) => setPaymentForm({ ...paymentForm, payment_ref: e.target.value })} />
                            </FormControl>
                        </Box>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={closePayments}>Close</Button>
                        <Button colorScheme="green" onClick={handleRecordPayment} isLoading={savingPayment}>Record Payment</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Box>
    )
}

