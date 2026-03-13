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

    const pageBg = "var(--surface-light)"
    const subtleCard = "var(--surface-card)"
    const mutedText = "var(--text-secondary)"
    const borderColor = "var(--border-light)"
    const headerBg = "transparent"
    const accent = "var(--primary-color)"
    const tableStripe = "var(--surface-card)"
    const hoverBg = "var(--surface-light)"
    const tableHeadBg = "var(--surface-light)"

    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        sortBy: 'created_at', // field to sort by
        sortDir: 'DESC', // ASC or DESC
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

    /**
     * Toggle sort direction (ASC/DESC) for the selected sort field
     * Helpful for quickly reversing sort order while staying on same column
     */
    const toggleSortDir = () => {
        setFilters((prev) => ({
            ...prev,
            sortDir: prev.sortDir === 'ASC' ? 'DESC' : 'ASC',
        }))
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
    const [currentOrder, setCurrentOrder] = useState(null)
    const [payments, setPayments] = useState([])
    const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: '', method: 'CASH', payment_ref: '' })
    const [savingPayment, setSavingPayment] = useState(false)
    const inputBg = subtleCard

    // order details modal state
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [orderItems, setOrderItems] = useState([])
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [paymentSummary, setPaymentSummary] = useState(null)
    const [notifyingSupplier, setNotifyingSupplier] = useState(false)

    const openPayments = async (orderId, order) => {
        setCurrentOrderId(orderId)
        setCurrentOrder(order)
        setPaymentsOpen(true)
        try {
            const [paymentsRes, summaryRes] = await Promise.all([
                adminApi.getSupplyPayments(orderId),
                adminApi.getSupplyPaymentSummary(orderId),
            ])
            setPayments(paymentsRes.data.payments || [])
            setPaymentSummary(summaryRes.data || null)
        } catch (err) {
            console.error('Failed to load payments', err)
            setPayments([])
            setPaymentSummary(null)
        }
    }

    const openDetails = async (order) => {
        setSelectedOrder(order)
        setDetailsOpen(true)
        setPaymentSummary(null)

        // Fetch payment summary
        try {
            const res = await adminApi.getSupplyPaymentSummary(order.id)
            setPaymentSummary(res.data)
        } catch (err) {
            console.error('Failed to load payment summary', err)
            setPaymentSummary(null)
        }
    }

    const closeDetails = () => {
        setDetailsOpen(false)
        setSelectedOrder(null)
        setOrderItems([])
        setPaymentSummary(null)
    }

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            setUpdatingStatus(true)
            await adminApi.updateSupplyOrderStatus(orderId, newStatus)
            toast({ title: `Order status updated to ${newStatus}`, status: 'success', duration: 2000 })
            fetchOrders()
            // Refresh payment summary if details modal is open
            if (selectedOrder) {
                const res = await adminApi.getSupplyPaymentSummary(orderId)
                setPaymentSummary(res.data)
            }
        } catch (err) {
            console.error('Failed to update order status', err)
            toast({ title: 'Failed to update status', status: 'error' })
        } finally {
            setUpdatingStatus(false)
        }
    }

    const handleNotifySupplierPayment = async (orderId) => {
        try {
            setNotifyingSupplier(true)
            await adminApi.notifySupplierIncompletePayment(orderId)
            toast({ title: 'Supplier notification sent successfully!', status: 'success', duration: 3000 })
        } catch (err) {
            console.error('Failed to send notification', err)
            toast({ title: err.response?.data?.message || 'Failed to send notification', status: 'error' })
        } finally {
            setNotifyingSupplier(false)
        }
    }

    const closePayments = () => {
        setPaymentsOpen(false)
        setCurrentOrderId(null)
        setCurrentOrder(null)
        setPayments([])
        setPaymentForm({ amount: '', payment_date: '', method: 'CASH', payment_ref: '' })
    }

    const handleRecordPayment = async () => {
        if (!paymentForm.amount || Number(paymentForm.amount) <= 0) return toast({ title: 'Amount required', status: 'warning' })
        try {
            setSavingPayment(true)
            const res = await adminApi.recordSupplyPayment(currentOrderId, paymentForm)
            toast({ title: 'Payment recorded successfully!', status: 'success', duration: 2000 })

            // Refresh payments list
            const paymentsRes = await adminApi.getSupplyPayments(currentOrderId)
            setPayments(paymentsRes.data.payments || [])

            const summaryRes = await adminApi.getSupplyPaymentSummary(currentOrderId)
            setPaymentSummary(summaryRes.data)

            if (summaryRes.data.isFullyPaid) {
                toast({ title: 'Order fully paid! Status updated to Received', status: 'info', duration: 3000 })
            }

            if (selectedOrder && selectedOrder.id === currentOrderId) {
                setSelectedOrder({
                    ...selectedOrder,
                    status: summaryRes.data.isFullyPaid ? 'received' : selectedOrder.status,
                })
            }

            // Refresh main orders list
            fetchOrders()

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
                                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} alignItems="end">
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
                                                bg={subtleCard}
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
                                            bg={subtleCard}
                                            borderColor={borderColor}
                                        >
                                            <option value="">All statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="sent">Sent</option>
                                            <option value="received">Received</option>
                                            <option value="cancelled">Cancelled</option>
                                        </Select>
                                    </FormControl>

                                    {/* Sort By dropdown */}
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="600" color={mutedText}>
                                            Sort By
                                        </FormLabel>
                                        <Select
                                            value={filters.sortBy}
                                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                            borderRadius="lg"
                                            bg={subtleCard}
                                            borderColor={borderColor}
                                        >
                                            <option value="created_at">Date Created</option>
                                            <option value="total_amount">Amount</option>
                                            <option value="status">Status</option>
                                            <option value="supplier_name">Supplier Name</option>
                                            <option value="deliver_at">Delivery Date</option>
                                        </Select>
                                    </FormControl>

                                    {/* Sort Direction toggle */}
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="600" color={mutedText}>
                                            Direction
                                        </FormLabel>
                                        <Flex gap={2}>
                                            <Select
                                                value={filters.sortDir}
                                                onChange={(e) => handleFilterChange('sortDir', e.target.value)}
                                                borderRadius="lg"
                                                bg={subtleCard}
                                                borderColor={borderColor}
                                                flex={1}
                                            >
                                                <option value="ASC">Ascending</option>
                                                <option value="DESC">Descending</option>
                                            </Select>
                                            <Button
                                                colorScheme="blue"
                                                variant="outline"
                                                onClick={toggleSortDir}
                                                title="Quick toggle sort direction"
                                            >
                                                ↕️
                                            </Button>
                                        </Flex>
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
                                                                ₹{Number(order.total_amount || 0).toFixed(2)}
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
                                                                <HStack spacing={2}>
                                                                    <Button size="sm" colorScheme="blue" variant="outline" onClick={() => openDetails(order)}>Details</Button>
                                                                    <Button size="sm" colorScheme="green" variant="outline" onClick={() => openPayments(order.id, order)}>Payments</Button>
                                                                </HStack>
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
            <Modal isOpen={paymentsOpen} onClose={closePayments} isCentered scrollBehavior="inside" size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <VStack align="flex-start" spacing={1}>
                            <Text fontSize="lg" fontWeight="700">Payments for Order {currentOrder?.order_no}</Text>
                            <Text fontSize="sm" color={mutedText}>Supplier: {currentOrder?.supplier_name}</Text>
                        </VStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={6} align="stretch">
                            {/* Existing Payments */}
                            <Box>
                                <Text fontWeight="600" mb={3}>Payment History</Text>
                                {payments.length === 0 ? (
                                    <Box bg="yellow.50" p={3} borderRadius="md" textAlign="center">
                                        <Text fontSize="sm" color="gray.600">No payments recorded yet</Text>
                                    </Box>
                                ) : (
                                    <Box borderRadius="lg" overflow="hidden" border="1px solid" borderColor={borderColor}>
                                        <Table size="sm">
                                            <Thead bg={tableHeadBg}>
                                                <Tr>
                                                    <Th>Date</Th>
                                                    <Th isNumeric>Amount</Th>
                                                    <Th>Method</Th>
                                                    <Th>Reference</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {payments.map(p => (
                                                    <Tr key={p.id}>
                                                        <Td fontSize="sm">{p.payment_date || new Date(p.created_at).toLocaleDateString()}</Td>
                                                        <Td isNumeric fontWeight="600" color="green.600">₹{Number(p.amount).toFixed(2)}</Td>
                                                        <Td fontSize="sm">{p.method}</Td>
                                                        <Td fontSize="sm">{p.payment_ref || '-'}</Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                )}
                            </Box>

                            {/* Record New Payment */}
                            <Box borderTop="1px" borderColor={borderColor} pt={4}>
                                <Text fontWeight="600" mb={3}>Record New Payment</Text>
                                <VStack spacing={3} align="stretch">
                                    <FormControl>
                                        <FormLabel fontSize="sm">Amount *</FormLabel>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            borderRadius="md"
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontSize="sm">Payment Date</FormLabel>
                                        <Input
                                            type="date"
                                            value={paymentForm.payment_date}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                            borderRadius="md"
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontSize="sm">Payment Method</FormLabel>
                                        <Select
                                            value={paymentForm.method}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                            borderRadius="md"
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="CARD">Card</option>
                                            <option value="IMPS">IMPS</option>
                                            {/* <option value="BANK_TRANSFER">Bank Transfer</option> */}
                                            <option value="CHEQUE">Cheque</option>
                                            <option value="OTHER">Other</option>
                                        </Select>
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontSize="sm">Reference (Optional)</FormLabel>
                                        <Input
                                            placeholder="Transaction ID / Cheque no etc."
                                            value={paymentForm.payment_ref}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, payment_ref: e.target.value })}
                                            borderRadius="md"
                                        />
                                    </FormControl>
                                    {paymentSummary && !paymentSummary.isFullyPaid && (
                                        <Box borderRadius="lg" border="1px dashed" borderColor="orange.400" p={4} bg="orange.50">
                                            <VStack spacing={3} align="stretch">
                                                <Text fontSize="sm" color={mutedText}>
                                                    Remaining balance: <strong>₹{paymentSummary.remainingAmount.toFixed(2)}</strong>
                                                </Text>
                                                <Button
                                                    size="sm"
                                                    colorScheme="orange"
                                                    variant="outline"
                                                    onClick={() => handleNotifySupplierPayment(currentOrderId)}
                                                    isLoading={notifyingSupplier}
                                                >
                                                    Notify Supplier for Remaining Payment
                                                </Button>
                                            </VStack>
                                        </Box>
                                    )}
                                </VStack>
                            </Box>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={closePayments}>Close</Button>
                        <Button colorScheme="green" onClick={handleRecordPayment} isLoading={savingPayment}>Record Payment</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Order Details Modal */}
            <Modal isOpen={detailsOpen} onClose={closeDetails} isCentered scrollBehavior="inside" size="2xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <VStack align="flex-start" spacing={1}>
                            <Text fontSize="lg" fontWeight="700">Order Details</Text>
                            <HStack spacing={3}>
                                <Badge colorScheme={getStatusColor(selectedOrder?.status)} fontSize="md" px={3} py={1}>
                                    {selectedOrder?.status}
                                </Badge>
                                <Text fontSize="sm" color={mutedText}>{selectedOrder?.order_no}</Text>
                            </HStack>
                        </VStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedOrder && (
                            <VStack spacing={6} align="stretch">
                                {/* Order Info */}
                                <Box borderRadius="lg" border="1px solid" borderColor={borderColor} p={4} bg={inputBg}>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        <Box>
                                            <Text fontSize="xs" fontWeight="600" color={mutedText} mb={1}>Supplier</Text>
                                            <Text fontWeight="600">{selectedOrder.supplier_name || '-'}</Text>
                                            <Text fontSize="sm" color={mutedText}>{selectedOrder.supplier_email || '-'}</Text>
                                        </Box>
                                        <Box>
                                            <Text fontSize="xs" fontWeight="600" color={mutedText} mb={1}>Store</Text>
                                            <Text fontWeight="600">{selectedOrder.store_name || '-'}</Text>
                                        </Box>
                                        <Box>
                                            <Text fontSize="xs" fontWeight="600" color={mutedText} mb={1}>Order Amount</Text>
                                            <Text fontSize="lg" fontWeight="700" color="green.600">₹{Number(selectedOrder.total_amount || 0).toFixed(2)}</Text>
                                        </Box>
                                        <Box>
                                            <Text fontSize="xs" fontWeight="600" color={mutedText} mb={1}>Order Date</Text>
                                            <Text fontWeight="600">{new Date(selectedOrder.created_at).toLocaleDateString()}</Text>
                                        </Box>
                                        <Box>
                                            <Text fontSize="xs" fontWeight="600" color={mutedText} mb={1}>Delivery Date</Text>
                                            <Text fontWeight="600">{selectedOrder.deliver_at ? new Date(selectedOrder.deliver_at).toLocaleDateString() : 'Not set'}</Text>
                                        </Box>
                                        <Box>
                                            <Text fontSize="xs" fontWeight="600" color={mutedText} mb={1}>Ordered By</Text>
                                            <Text fontWeight="600">
                                                {selectedOrder.ordered_by_firstname && selectedOrder.ordered_by_lastname
                                                    ? `${selectedOrder.ordered_by_firstname} ${selectedOrder.ordered_by_lastname}`
                                                    : '-'}
                                            </Text>
                                        </Box>
                                    </SimpleGrid>
                                </Box>

                                {/* Payment Summary */}
                                {paymentSummary && (
                                    <Box borderRadius="lg" border="2px solid" borderColor={paymentSummary.isFullyPaid ? 'green.400' : 'orange.400'} p={4} bg={paymentSummary.isFullyPaid ? 'green.50' : 'orange.50'}>
                                        <HStack mb={3} justify="space-between">
                                            <Text fontWeight="700" fontSize="lg">Payment Summary</Text>
                                            <Badge colorScheme={paymentSummary.isFullyPaid ? 'green' : 'orange'} fontSize="md" px={3} py={1}>
                                                {paymentSummary.isFullyPaid ? '✓ Fully Paid' : '⚠ Partial Payment'}
                                            </Badge>
                                        </HStack>
                                        <SimpleGrid columns={1} spacing={2}>
                                            <HStack justify="space-between">
                                                <Text color={mutedText}>Total Order Amount:</Text>
                                                <Text fontWeight="700">₹{paymentSummary.totalAmount.toFixed(2)}</Text>
                                            </HStack>
                                            <HStack justify="space-between" borderBottom="1px" borderColor={borderColor} pb={2}>
                                                <Text color={mutedText}>Total Paid:</Text>
                                                <Text fontWeight="700" color="green.600">₹{paymentSummary.totalPaid.toFixed(2)}</Text>
                                            </HStack>
                                            <HStack justify="space-between" pt={2}>
                                                <Text fontWeight="600" color={paymentSummary.isFullyPaid ? 'green.600' : 'red.600'}>Remaining Balance:</Text>
                                                <Text fontWeight="700" fontSize="lg" color={paymentSummary.isFullyPaid ? 'green.600' : 'red.600'}>
                                                    ₹{paymentSummary.remainingAmount.toFixed(2)}
                                                </Text>
                                            </HStack>
                                            <Text fontSize="xs" color={mutedText} mt={1}>
                                                {paymentSummary.paymentCount} payment(s) recorded
                                            </Text>
                                        </SimpleGrid>
                                    </Box>
                                )}

                                {/* Incomplete Payment Notification */}
                                {paymentSummary && !paymentSummary.isFullyPaid && (
                                    <Box borderRadius="lg" border="1px dashed" borderColor="orange.400" p={4} bg={'orange.50'}>
                                        <VStack spacing={3} align="stretch">
                                            <HStack>
                                                <Box color="orange.600" fontSize="lg">⚠</Box>
                                                <Text fontWeight="600">Outstanding Payment</Text>
                                            </HStack>
                                            <Text fontSize="sm" color={mutedText}>
                                                This order has an outstanding balance of <strong>₹{paymentSummary.remainingAmount.toFixed(2)}</strong>.
                                                You can send a payment reminder to the supplier.
                                            </Text>
                                            <Button
                                                size="sm"
                                                colorScheme="orange"
                                                onClick={() => handleNotifySupplierPayment(selectedOrder.id)}
                                                isLoading={notifyingSupplier}
                                                leftIcon={<Text>📧</Text>}
                                            >
                                                Send Payment Reminder Email
                                            </Button>
                                        </VStack>
                                    </Box>
                                )}

                                {paymentSummary && paymentSummary.isFullyPaid && (
                                    <Box borderRadius="lg" border="1px solid" borderColor="green.400" p={4} bg={'green.50'}>
                                        <HStack>
                                            <Box color="green.600" fontSize="xl">✓</Box>
                                            <VStack align="flex-start" spacing={0}>
                                                <Text fontWeight="600" color="green.600">Payment Complete</Text>
                                                <Text fontSize="sm" color={mutedText}>All payment has been received for this order.</Text>
                                            </VStack>
                                        </HStack>
                                    </Box>
                                )}

                                {/* Quick Actions */}
                                <Box borderTop="1px" borderColor={borderColor} pt={4}>
                                    <Text fontWeight="600" mb={3}>Quick Actions</Text>
                                    <HStack spacing={2}>
                                        <Button size="sm" colorScheme="blue" onClick={() => { openPayments(selectedOrder.id, selectedOrder) }}>View/Add Payments</Button>
                                        <Button size="sm" colorScheme="purple" variant="outline" onClick={() => window.open(`/invoice/${selectedOrder.id}`, '_blank')}>Generate Invoice</Button>
                                    </HStack>
                                </Box>
                                <Box borderTop="1px" borderColor={borderColor} pt={4}>
                                    <Text fontWeight="600" mb={3}>Update Status</Text>
                                    <HStack spacing={2}>
                                        {['pending', 'sent', 'received', 'cancelled'].map((st) => (
                                            <Button
                                                key={st}
                                                size="sm"
                                                colorScheme={selectedOrder.status === st ? getStatusColor(st) : 'gray'}
                                                variant={selectedOrder.status === st ? 'solid' : 'outline'}
                                                onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                                                isLoading={updatingStatus}
                                                isDisabled={selectedOrder.status === st}
                                                textTransform="capitalize"
                                            >
                                                {st}
                                            </Button>
                                        ))}
                                    </HStack>
                                </Box>
                            </VStack>
                        )}
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="blue" onClick={closeDetails}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Box>
    )
}
