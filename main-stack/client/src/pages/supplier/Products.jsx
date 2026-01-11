import { useState, useEffect, useRef } from 'react'
import * as productApi from '../../api/products'
import {
    Box,
    SimpleGrid,
    Button,
    HStack,
    VStack,
    Heading,
    Text,
    Input,
    Select,
    Spinner,
    Badge,
    useToast,
    Tooltip,
    Flex,
    useColorModeValue,
    VisuallyHidden,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { getPublicProducts } from '../../api/products'
import { useAuth } from '../../context/AuthContext'
import * as bidsApi from '../../api/bids'

function ProductCard({ product, onViewDetail, onAskSupply, isInWishlist }) {
    const cardRef = useRef()
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

    const cardBg = useColorModeValue('white', 'gray.800')
    const cardShadow = useColorModeValue('sm', 'dark-lg')
    const muted = useColorModeValue('gray.600', 'gray.300')
    const priceColor = useColorModeValue('green.600', 'green.300')
    const badgeBg = useColorModeValue('whiteAlpha.900', 'blackAlpha.500')

    useEffect(() => {
        if (cardRef.current) {
            gsap.fromTo(cardRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45 })
        }
    }, [])

    const stockStatus =
        product.stock_available > 10 ? 'In stock' : product.stock_available > 0 ? 'Low stock' : 'Out of stock'
    const stockColor = product.stock_available > 10 ? 'green.400' : product.stock_available > 0 ? 'orange.400' : 'red.400'

    const primaryImage = product.images && product.images[0]
    const imageUrl = primaryImage ? `${BACKEND_URL}/${primaryImage}` : null

    return (
        <Box
            ref={cardRef}
            bg={cardBg}
            borderRadius="lg"
            overflow="hidden"
            boxShadow={cardShadow}
            transition="transform 220ms, box-shadow 220ms"
            _hover={{ transform: 'translateY(-6px)', boxShadow: 'lg' }}
            display="flex"
            flexDirection="column"
            role="group"
        >
            <Box pos="relative" w="100%" paddingBottom="85%" bg="gray.50" overflow="hidden">
                <Box
                    pos="absolute"
                    inset={0}
                    bgImage={imageUrl ? `url(${imageUrl})` : undefined}
                    bgSize="cover"
                    bgPos="center"
                    bgRepeat="no-repeat"
                    transition="transform 350ms ease"
                    _groupHover={{ transform: 'scale(1.05)' }}
                />

                <Badge pos="absolute" bottom={3} left={3} px={2} py={1} borderRadius="full" bg="whiteAlpha.800" color={stockColor} fontSize="xs">
                    {stockStatus}
                </Badge>
            </Box>

            <VStack align="stretch" spacing={3} p={4} flex={1}>
                <Box>
                    <Heading size="sm" noOfLines={2} color="orange.200">
                        {product.name}
                    </Heading>
                    {product.description && (
                        <Text fontSize="xs" color={muted} mt={1} noOfLines={2}>
                            {product.description}
                        </Text>
                    )}
                </Box>

                <HStack justify="space-between" align="center">
                    <Heading size="md" color={priceColor} fontWeight="700">
                        ${Number(product.sell_price).toFixed(2)}
                    </Heading>
                </HStack>

                <Flex direction="column" gap={3} mt={1}>
                    <Button
                        variant="solid"
                        colorScheme="blue"
                        size="sm"
                        onClick={() => onViewDetail(product.id)}
                        borderRadius="md"
                    >
                        View details
                    </Button>

                    <Button
                        colorScheme="purple"
                        size="sm"
                        onClick={() => onAskSupply(product)}
                        // isDisabled={product.stock_available === 0}
                        borderRadius="md"
                    >
                        Ask to place supply order
                    </Button>
                </Flex>
            </VStack>
        </Box>
    )
}

export default function SupplierProductsPage() {
    const toast = useToast()
    const navigate = useNavigate()
    const { user } = useAuth()

    const pageBg = useColorModeValue('gray.50', 'gray.900')
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)

    const [filters, setFilters] = useState({ search: '', category_id: '', sort: 'name', order: 'asc' })
    const [limit] = useState(12)
    const [offset, setOffset] = useState(0)

    // supply order modal state
    const [supplyModalOpen, setSupplyModalOpen] = useState(false)
    const [supplyProduct, setSupplyProduct] = useState(null)
    const [supplyQty, setSupplyQty] = useState(1)
    const [supplyCost, setSupplyCost] = useState(0)
    const [stores, setStores] = useState([])
    const [supplyStoreId, setSupplyStoreId] = useState(null)
    const [placingSupply, setPlacingSupply] = useState(false)

    useEffect(() => {
        fetchCategories()
        fetchProducts()
        fetchStores()
    }, [filters, offset, limit])

    async function fetchCategories() {
        try {
            const res = await productApi.getCategories(100, 0)
            setCategories(res?.data?.categories || [])
        } catch (err) {
            console.error('Failed to fetch categories:', err)
        }
    }

    async function fetchStores() {
        try {
            const res = await fetch('/api/stores', { credentials: 'include' })
            if (!res.ok) throw new Error('Failed to fetch stores')
            const data = await res.json()
            const arr = data.stores || []
            setStores(arr)
            if (arr.length > 0) setSupplyStoreId(arr[0].id)
        } catch (err) {
            console.error('Failed to fetch stores:', err)
            setStores([])
            setSupplyStoreId(null)
        }
    }

    async function fetchProducts() {
        setLoading(true)
        try {
            const data = await getPublicProducts(limit, offset, filters)
            setProducts(data.products || [])
            setTotal(data.total || 0)
        } catch (err) {
            console.error('Failed to fetch products:', err)
            toast({ title: 'Failed to load products', status: 'error', duration: 2000 })
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const openSupplyModal = (product) => {
        setSupplyProduct(product)
        setSupplyQty(1)
        setSupplyCost(product.cost_price || product.sell_price || 0)
        setSupplyModalOpen(true)
    }

    const closeSupplyModal = () => {
        setSupplyModalOpen(false)
        setSupplyProduct(null)
    }

    async function handlePlaceSupplyOrder() {
        if (!supplyProduct) return
        if (!supplyQty || supplyQty <= 0) return toast({ title: 'Quantity must be at least 1', status: 'warning' })
        if (!supplyCost || supplyCost <= 0) return toast({ title: 'Cost must be greater than 0', status: 'warning' })
        if (!stores.length) return toast({ title: 'No stores available to select', status: 'error' })
        if (!supplyStoreId) return toast({ title: 'Please select a store', status: 'warning' })

        try {
            setPlacingSupply(true)
            const payload = { store_id: supplyStoreId, items: [{ product_id: supplyProduct.id, qty: supplyQty, cost: supplyCost }] }
            const res = await bidsApi.placeSupplyOrder(payload)
            toast({ title: 'Supply order requested', description: `Order ${res?.data?.order?.order_no} created`, status: 'success' })
            closeSupplyModal()
        } catch (err) {
            console.error('Failed to place supply order', err)
            toast({ title: 'Failed to place supply order', status: 'error' })
        } finally {
            setPlacingSupply(false)
        }
    }

    const handleViewDetail = (productId) => {
        navigate(`/supplier/products/${productId}`)
    }

    const handleFilterChange = (key, value) => {
        setOffset(0)
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    return (
        <Box minH="100vh" bg={pageBg} display="flex" flexDirection="column">
            <Navbar />

            <Box flex={1} py={{ base: 8, md: 12 }}>
                <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }}>
                    <VStack align="start" spacing={3} mb={6}>
                        <HStack spacing={3} justify="space-between" w="100%">
                            <Heading size="lg">Supplier Catalog</Heading>
                            <HStack spacing={2}>
                                <Input placeholder="Search" size="sm" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
                                <Select size="sm" width="160px" value={filters.category_id || ''} onChange={(e) => handleFilterChange('category_id', e.target.value)}>
                                    <option value="">All Categories</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Select>
                            </HStack>
                        </HStack>
                    </VStack>

                    {loading ? (
                        <Flex justify="center" py={10}><Spinner /></Flex>
                    ) : (
                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6}>
                            {products.map(p => (
                                <ProductCard key={p.id} product={p} onViewDetail={handleViewDetail} onAskSupply={(prod) => openSupplyModal(prod)} />
                            ))}
                        </SimpleGrid>
                    )}
                </Box>
            </Box>

            <Footer />

            {/* Supply Modal */}
            <Modal isOpen={supplyModalOpen} onClose={closeSupplyModal} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Request Supply Order</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack align="stretch" spacing={3}>
                            <Text fontWeight={600}>{supplyProduct?.name}</Text>

                            <NumberInput value={supplyQty} min={1} onChange={(val) => setSupplyQty(parseInt(val) || 1)}>
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>

                            <NumberInput value={supplyCost} min={0} onChange={(val) => setSupplyCost(parseFloat(val) || 0)}>
                                <NumberInputField />
                            </NumberInput>

                            <Select value={supplyStoreId || ''} onChange={(e) => setSupplyStoreId(e.target.value)}>
                                <option value="">Select Store</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </Select>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={closeSupplyModal}>Cancel</Button>
                        <Button colorScheme="purple" onClick={handlePlaceSupplyOrder} isLoading={placingSupply}>Request Order</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    )
}