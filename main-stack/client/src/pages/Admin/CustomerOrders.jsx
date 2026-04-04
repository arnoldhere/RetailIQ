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
    useDisclosure,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import AdminSidebar from '../../components/AdminSidebar'
import * as adminApi from '../../api/admin'
import {
    AdminTablePagination,
    AdminTableShell,
    SortableTh,
} from '../../components/AdminTable'

export default function CustomerOrdersPage() {
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
        sort: 'created_at',
        order: 'desc',
    })
    const [limit, setLimit] = useState(12)
    const [offset, setOffset] = useState(0)

    // Order details modal
    const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure()
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null)
    const [detailsLoading, setDetailsLoading] = useState(false)

    useEffect(() => {
        fetchOrders()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, offset, limit])

    async function fetchOrders() {
        setLoading(true)
        try {
            const res = await adminApi.getCustomerOrders(limit, offset, filters)
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

    // Open order details modal and fetch items
    async function openOrderDetails(order) {
        setDetailsLoading(true)
        try {
            const res = await adminApi.getCustomerOrderDetails(order.id)

            // Normalize response
            let items = []

            if (Array.isArray(res.data)) {
                items = res.data
            } else if (Array.isArray(res.data?.items)) {
                items = res.data.items
            }

            setSelectedOrderDetails({
                customer_firstname: items[0]?.customer_firstname || '',
                customer_lastname: items[0]?.customer_lastname || '',
                customer_email: order.customer_email || '',
                order_no: order.order_no,
                total_amount: order.total_amount,
                items
            })

            onDetailsOpen()
        } catch (err) {
            console.error('Failed to load order details:', err)
            toast({ title: 'Failed to load order details', status: 'error', duration: 3000 })
        } finally {
            setDetailsLoading(false)
        }
    }



    // Quick status update
    async function handleChangeStatus(orderId, newStatus) {
        const ok = window.confirm(`Change order status to ${newStatus}?`)
        if (!ok) return
        try {
            setLoading(true)
            await adminApi.updateOrderStatus(orderId, newStatus)
            toast({ title: 'Order updated', status: 'success', duration: 3000 })
            await fetchOrders()
        } catch (err) {
            console.error('Failed to update order status:', err)
            toast({ title: 'Failed to update order', status: 'error', duration: 3000 })
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (key, value) => {
        setOffset(0)
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const handleResetFilters = () => {
        setOffset(0)
        setFilters({
            search: '',
            status: '',
            sort: 'created_at',
            order: 'desc',
        })
    }

    const handleTableSort = (column) => {
        setOffset(0)
        setFilters((prev) => ({
            ...prev,
            sort: column,
            order: prev.sort === column && prev.order === 'asc' ? 'desc' : 'asc',
        }))
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: 'yellow',
            processing: 'blue',
            completed: 'green',
            cancelled: 'red',
            returned: 'orange',
            'shipped': 'teal',
        }
        return colors[status] || 'gray'
    }

    const getPaymentStatusColor = (status) => {
        const colors = {
            pending: 'yellow',
            paid: 'green',
            failed: 'red',
            refunded: 'orange',
        }
        return colors[status] || 'gray'
    }

    const totalPages = Math.ceil(total / limit)
    const currentPage = Math.floor(offset / limit) + 1

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
                                        <Heading size="lg">Customer Orders</Heading>
                                    </HStack>
                                    <Text color={mutedText} fontSize="sm">
                                        View and manage customer orders and transactions.
                                    </Text>
                                </VStack>
                            </Flex>

                            <Divider mb={5} />

                            {/* Filters */}
                            <Box bg={subtleCard} p={{ base: 4, md: 6 }} borderRadius="xl" boxShadow="sm" mb={6} border="1px solid" borderColor={borderColor}>
                                <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4} alignItems="end">
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
                                            <option value="processing">Processing</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="returned">Returned</option>
                                            <option value="shipped">shipped</option>
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="600" color={mutedText}>
                                            Sort By
                                        </FormLabel>
                                        <Select
                                            value={filters.sort}
                                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                                            borderRadius="lg"
                                            bg={subtleCard}
                                            borderColor={borderColor}
                                        >
                                            <option value="created_at">Date</option>
                                            <option value="total_amount">Amount</option>
                                            <option value="order_no">Order No</option>
                                            <option value="status">Status</option>
                                            <option value="payment_status">Payment Status</option>
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="600" color={mutedText}>
                                            Order
                                        </FormLabel>
                                        <Select
                                            value={filters.order}
                                            onChange={(e) => handleFilterChange('order', e.target.value)}
                                            borderRadius="lg"
                                            bg={subtleCard}
                                            borderColor={borderColor}
                                        >
                                            <option value="desc">Descending</option>
                                            <option value="asc">Ascending</option>
                                        </Select>
                                    </FormControl>
                                    <Flex justify={{ base: 'stretch', md: 'flex-end' }}>
                                        <Button variant="outline" borderRadius="full" onClick={handleResetFilters}>
                                            Reset
                                        </Button>
                                    </Flex>
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
                                    <AdminTableShell bg={tableStripe} borderColor={borderColor}>
                                            <Table variant="simple" size="sm">
                                                <Thead position="sticky" top={0} zIndex={1} bg={tableHeadBg}>
                                                    <Tr>
                                                        <SortableTh
                                                            label="Order No"
                                                            sortKey="order_no"
                                                            sortBy={filters.sort}
                                                            sortOrder={filters.order}
                                                            onSort={handleTableSort}
                                                        />
                                                        <Th fontWeight="700" color={mutedText}>Customer</Th>
                                                        <Th fontWeight="700" color="white.700">Store</Th>
                                                        <SortableTh
                                                            label="Amount"
                                                            sortKey="total_amount"
                                                            sortBy={filters.sort}
                                                            sortOrder={filters.order}
                                                            onSort={handleTableSort}
                                                            isNumeric
                                                        />
                                                        <SortableTh
                                                            label="Status"
                                                            sortKey="status"
                                                            sortBy={filters.sort}
                                                            sortOrder={filters.order}
                                                            onSort={handleTableSort}
                                                        />
                                                        <SortableTh
                                                            label="Payment"
                                                            sortKey="payment_status"
                                                            sortBy={filters.sort}
                                                            sortOrder={filters.order}
                                                            onSort={handleTableSort}
                                                        />
                                                        <SortableTh
                                                            label="Date"
                                                            sortKey="created_at"
                                                            sortBy={filters.sort}
                                                            sortOrder={filters.order}
                                                            onSort={handleTableSort}
                                                        />
                                                        <Th fontWeight="700" color={mutedText} textAlign="center">Actions</Th>
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
                                                            <Td fontSize="sm" color={mutedText}>
                                                                {order.firstname && order.lastname
                                                                    ? `${order.firstname} ${order.lastname}`
                                                                    : order.customer_email || 'Guest'}
                                                            </Td>
                                                            <Td fontSize="sm" color={mutedText}>{order.store_name || '-'}</Td>
                                                            <Td isNumeric fontWeight="700" color="green.600" fontSize="sm">
                                                                ₹{Number(order.total_amount || 0).toFixed(2)}
                                                            </Td>
                                                            <Td textAlign="center">
                                                                <Badge colorScheme={getStatusColor(order.status)} borderRadius="full" px={3} py={0.5} textTransform="capitalize">
                                                                    {order.status}
                                                                </Badge>
                                                            </Td>
                                                            <Td textAlign="center">
                                                                <Badge colorScheme={getPaymentStatusColor(order.payment_status)} borderRadius="full" px={3} py={0.5} textTransform="capitalize">
                                                                    {order.payment_status}
                                                                </Badge>
                                                            </Td>
                                                            <Td fontSize="sm" color={mutedText}>
                                                                {new Date(order.created_at).toLocaleDateString()}
                                                            </Td>

                                                            {/* Actions */}
                                                            <Td textAlign="center">
                                                                <HStack justifyContent="center" spacing={2}>
                                                                    <Button size="sm" onClick={() => openOrderDetails(order)}>
                                                                        View
                                                                    </Button>

                                                                    <Select size="sm" value={order.status} onChange={(e) => handleChangeStatus(order.id, e.target.value)} width="160px">
                                                                        <option value="pending">pending</option>
                                                                        <option value="processing">processing</option>
                                                                        <option value="completed">completed</option>
                                                                        <option value="cancelled">cancelled</option>
                                                                        <option value="returned">returned</option>
                                                                        <option value="shipped">shipped</option>
                                                                    </Select>
                                                                </HStack>
                                                            </Td>
                                                        </Tr>
                                                    ))}
                                                </Tbody>
                                            </Table>
                                    </AdminTableShell>

                                    {/* Pagination */}
                                    <AdminTablePagination
                                        currentPage={currentPage}
                                        totalPages={Math.max(totalPages, 1)}
                                        totalItems={total}
                                        pageSize={limit}
                                        onPageSizeChange={(size) => {
                                            setLimit(size)
                                            setOffset(0)
                                        }}
                                        onPrevious={() => setOffset(Math.max(0, offset - limit))}
                                        onNext={() => setOffset(offset + limit)}
                                        itemLabel="orders"
                                    />

                                    {/* Order details modal */}
                                    <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="lg" isCentered>
                                        <ModalOverlay />
                                        <ModalContent>
                                            <ModalHeader>Order Details</ModalHeader>
                                            <ModalCloseButton />

                                            <ModalBody>
                                                {detailsLoading ? (
                                                    <Box textAlign="center" py={6}>
                                                        <Spinner />
                                                    </Box>
                                                ) : selectedOrderDetails ? (
                                                    <Box>
                                                        <Text fontWeight="600">
                                                            Order: {selectedOrderDetails.order_no}
                                                        </Text>

                                                        <Text mb={3}>
                                                            Customer: {selectedOrderDetails.customer_firstname}{" "}
                                                            {selectedOrderDetails.customer_lastname}
                                                            {" "}({selectedOrderDetails.customer_email})
                                                        </Text>

                                                        <Divider mb={3} />

                                                        <Box>
                                                            <Heading size="sm" mb={2}>Items</Heading>
                                                            {selectedOrderDetails.items.map((it) => (
                                                                <HStack key={it.id} justify="space-between" py={2}>
                                                                    <Text>
                                                                        {it.product_name || 'Product'} x {it.qty}
                                                                    </Text>
                                                                    <Text>
                                                                        ₹{Number(it.total_amount || 0).toFixed(2)}
                                                                    </Text>
                                                                </HStack>
                                                            ))}
                                                        </Box>

                                                        <Divider my={3} />

                                                        <Text fontWeight="700">
                                                            Total: ₹{Number(selectedOrderDetails.total_amount || 0).toFixed(2)}
                                                        </Text>
                                                    </Box>
                                                ) : (
                                                    <Text>No details to show</Text>
                                                )}

                                            </ModalBody>

                                            <ModalFooter>
                                                <Button onClick={onDetailsClose}>Close</Button>
                                            </ModalFooter>
                                        </ModalContent>
                                    </Modal>
                                </>
                            )}
                        </Box>
                    </SimpleGrid>
                </Box>
            </Box>

            <Footer />
        </Box>
    )
}
