import { useState, useEffect, useRef, useCallback } from 'react'
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
    Icon,
    FormControl,
    FormLabel,
    Tag,
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
    VisuallyHidden,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { getPublicProducts } from '../../api/products'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useAuth } from '../../context/AuthContext'
import { FaHeart, FaShoppingCart, FaArrowDown } from 'react-icons/fa'
import * as bidsApi from '../../api/bids'
import { buildApiUrl, resolveMediaUrl } from '../../api/base'
import { getRecommendedProducts } from '../../api/ml_services'

/**
 * ProductCard Component
 */
function ProductCard({ product, onViewDetail, onAddCart, onToggleWishlist, isInWishlist, onAskSupply }) {
    const cardRef = useRef()
    const { user } = useAuth()

    const cardBg = "var(--surface-card)"
    const cardShadow = "sm"
    const muted = "var(--text-secondary)"
    const priceColor = "green.600"
    const badgeBg = "var(--surface-card)"
    const wishlistBg = "var(--surface-card)"

    useEffect(() => {
        if (cardRef.current) {
            gsap.fromTo(cardRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
            )
        }
    }, [])

    const stockStatus = product.stock_available > 10 ? 'In stock' : product.stock_available > 0 ? 'Low stock' : 'Out of stock'
    const stockColor = product.stock_available > 10 ? 'green.400' : product.stock_available > 0 ? 'orange.400' : 'red.400'
    const imageUrl = resolveMediaUrl(product.images && product.images[0])

    return (
        <Box
            ref={cardRef}
            bg={cardBg}
            borderRadius="lg"
            overflow="hidden"
            boxShadow={cardShadow}
            transition="all 0.25s ease"
            _hover={{ transform: 'translateY(-5px)', boxShadow: 'xl' }}
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
                    transition="transform 0.5s ease"
                    _groupHover={{ transform: 'scale(1.08)' }}
                />
                {product.category_name && (
                    <Tag pos="absolute" top={3} left={3} bg={badgeBg} color="purple.600" borderRadius="full" px={3} py={1} fontSize="xs" boxShadow="sm">
                        {product.category_name}
                    </Tag>
                )}
                {user?.role !== 'supplier' && (
                    <Tooltip label={isInWishlist ? 'Remove' : 'Add to wishlist'}>
                        <Button
                            pos="absolute" top={3} right={3} size="sm" onClick={() => onToggleWishlist(product)}
                            zIndex={3} borderRadius="full" bg={isInWishlist ? 'red.500' : wishlistBg}
                            color={isInWishlist ? 'white' : 'red.500'} _hover={{ bg: isInWishlist ? 'red.600' : 'gray.100' }}
                        >
                            <FaHeart />
                        </Button>
                    </Tooltip>
                )}
                <Badge pos="absolute" bottom={3} left={3} px={2} py={1} borderRadius="full" bg="whiteAlpha.900" color={stockColor} fontSize="xs">
                    {stockStatus}
                </Badge>
            </Box>

            <VStack align="stretch" spacing={3} p={4} flex={1}>
                <Box>
                    <Heading size="sm" noOfLines={2} color="orange.200">{product.name}</Heading>
                    {product.description && <Text fontSize="xs" color={muted} mt={1} noOfLines={2}>{product.description}</Text>}
                </Box>
                <HStack justify="space-between" align="center">
                    <Heading size="md" color={priceColor} fontWeight="700">₹{Number(product.sell_price).toFixed(2)}</Heading>
                </HStack>
                <Flex direction="column" gap={3} mt={1}>
                    <Button variant="solid" colorScheme="blue" size="sm" onClick={() => onViewDetail(product.id)}>View details</Button>
                    {user?.role === 'supplier' ? (
                        <Button colorScheme="purple" size="sm" onClick={() => onAskSupply(product)} isDisabled={product.stock_available === 0}>
                            Ask to supply
                        </Button>
                    ) : (
                        <Button leftIcon={<FaShoppingCart />} colorScheme="green" size="sm" onClick={() => onAddCart(product)} isDisabled={product.stock_available === 0}>
                            Add to cart
                        </Button>
                    )}
                </Flex>
            </VStack>
        </Box>
    )
}

/**
 * Main Products Page
 */
export default function ProductsPage() {
    const toast = useToast()
    const navigate = useNavigate()
    const { user, loading: authLoading } = useAuth()
    const { addToCart } = useCart()
    const { toggleWishlist, isInWishlist } = useWishlist()

    const [products, setProducts] = useState([])
    const [recommendedProducts, setRecommendedProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [recommendationsLoading, setRecommendationsLoading] = useState(false)
    const [recommendationsMeta, setRecommendationsMeta] = useState(null)
    const [total, setTotal] = useState(0)

    const [filters, setFilters] = useState({ search: '', category_id: '', sort: 'name', order: 'asc' })
    const [offset, setOffset] = useState(0)
    const limit = 8 // Exactly 2 rows of 4

    // Theme Variables
    const pageBg = "var(--surface-light)", containerBg = "var(--surface-card)", muted = "var(--text-secondary)", accent = "var(--primary-color)"

    // Supply Modal States
    const [supplyModalOpen, setSupplyModalOpen] = useState(false)
    const [supplyProduct, setSupplyProduct] = useState(null)
    const [supplyQty, setSupplyQty] = useState(1)
    const [supplyCost, setSupplyCost] = useState(0)
    const [stores, setStores] = useState([])
    const [supplyStoreId, setSupplyStoreId] = useState('')
    const [placingSupply, setPlacingSupply] = useState(false)

    // 1. Lifecycle: Fetch Categories & Stores
    useEffect(() => {
        fetchCategories()
        if (user?.role === 'supplier') fetchStores()
    }, [user])

    // 2. Lifecycle: Reset and Fetch when filters change
    useEffect(() => {
        setOffset(0)
        fetchProducts(true)
    }, [])

    const fetchCategories = async () => {
        try {
            const res = await productApi.getCategories(100, 0)
            if (res) setCategories(res?.data?.categories || [])
        } catch (err) { console.error(err) }
    }


    /**
     * Fetch customer recommendations from the backend.
     * The backend validates the user from the auth token before it forwards
     * the request to the FastAPI service, so the UI keeps a small payload.
     */
    const fetchRecommendations = useCallback(async () => {
        if (!user?.id || user.role !== 'customer') return

        setRecommendationsLoading(true)
        try {
            const data = await getRecommendedProducts(user.id, 4)
            setRecommendedProducts(Array.isArray(data?.recommendations) ? data.recommendations : [])
            setRecommendationsMeta(data?.metadata || null)
        } catch (err) {
            console.error('Failed to fetch recommendations:', err)
            setRecommendedProducts([])
            setRecommendationsMeta(null)
        } finally {
            setRecommendationsLoading(false)
        }
    }, [user?.id, user?.role])

    // Load recommendations when the customer opens the products page.
    useEffect(() => {
        if (authLoading) return

        if (!user?.id || user.role !== 'customer') {
            setRecommendedProducts([])
            setRecommendationsMeta(null)
            return
        }

        fetchRecommendations()
    }, [authLoading, fetchRecommendations, user?.id, user?.role])

    const fetchStores = async () => {
        try {
            const res = await fetch(buildApiUrl('/api/stores'), { credentials: 'include' })
            const data = await res.json()
            setStores(data.stores || [])
            if (data.stores?.length) setSupplyStoreId(data.stores[0].id)
        } catch (err) { console.error(err) }
    }

    const fetchProducts = async (isInitial = false) => {
        if (isInitial) setLoading(true)
        else setLoadingMore(true)

        try {
            const currentOffset = isInitial ? 0 : offset + limit
            const data = await getPublicProducts(limit, currentOffset, filters)
            const nextProducts = Array.isArray(data.products) ? data.products : []

            setProducts(prev => isInitial ? nextProducts : [...prev, ...nextProducts])
            setTotal(Number(data.total) || 0)
            if (!isInitial) setOffset(currentOffset)
        } catch (err) {
            toast({ title: 'Failed to load products', status: 'error' })
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const handleLoadMore = () => fetchProducts(false)

    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
    const handleResetFilters = () => setFilters({ search: '', category_id: '', sort: 'name', order: 'asc' })

    const openSupplyModal = (product) => {
        setSupplyProduct(product)
        setSupplyQty(1)
        setSupplyCost(product.cost_price || product.sell_price || 0)
        setSupplyModalOpen(true)
    }

    const handlePlaceSupplyOrder = async () => {
        if (!supplyStoreId) return toast({ title: 'Select a store', status: 'warning' })
        setPlacingSupply(true)
        try {
            const payload = { store_id: supplyStoreId, items: [{ product_id: supplyProduct.id, qty: supplyQty, cost: supplyCost }] }
            const res = await bidsApi.placeSupplyOrder(payload)
            toast({ title: 'Success', description: `Order ${res?.data?.order?.order_no} created`, status: 'success' })
            setSupplyModalOpen(false)
        } catch (err) { toast({ title: 'Error', status: 'error' }) }
        finally { setPlacingSupply(false) }
    }

    const handleAddCart = (product) => {
        addToCart(product, 1)
        toast({ title: 'Added to cart', description: product.name, status: 'success', duration: 1500 })
    }

    const handleToggleWishlist = (product) => {
        const already = isInWishlist(product.id)
        toggleWishlist(product)
        toast({ title: already ? 'Removed' : 'Added to wishlist', status: 'success', duration: 1500 })
    }

    const handleViewDetail = (id) => navigate(user?.role === 'supplier' ? `/supplier/products/${id}` : `/customer/products/${id}`)

    const hasMore = products.length < total

    return (
        <Box minH="100vh" bg={pageBg} display="flex" flexDirection="column">
            <Navbar />

            <Box flex={1} py={{ base: 8, md: 12 }}>
                <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }}>
                    <VStack align="start" spacing={3} mb={6}>
                        <Heading size="xl" color="white.900">Explore Our Products</Heading>
                        <Text color={muted} fontSize="md">Showing {products.length} of {total} items</Text>
                    </VStack>

                    {/* Filter Panel */}
                    <Box bg={containerBg} p={6} borderRadius="xl" boxShadow="sm" mb={8}>
                        <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4} alignItems="end">
                            <FormControl>
                                <FormLabel fontSize="sm" color={muted}>Search</FormLabel>
                                <Input placeholder="Search..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} bg={containerBg} />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm" color={muted}>Category</FormLabel>
                                <Select value={filters.category_id} onChange={(e) => handleFilterChange('category_id', e.target.value)}>
                                    <option value="">All Categories</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm" color={muted}>Sort By</FormLabel>
                                <Select value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)}>
                                    <option value="name">Name</option>
                                    <option value="price">Price</option>
                                    <option value="created_at">Newest</option>
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm" color={muted}>Order</FormLabel>
                                <Select value={filters.order} onChange={(e) => handleFilterChange('order', e.target.value)}>
                                    <option value="asc">Ascending</option>
                                    <option value="desc">Descending</option>
                                </Select>
                            </FormControl>
                            <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
                        </SimpleGrid>
                    </Box>

                    {/* Grid & Load More Logic */}
                    {loading ? (
                        <Flex justify="center" py={20}><Spinner size="xl" color={accent} /></Flex>
                    ) : products.length === 0 ? (
                        <Box bg={containerBg} p={14} borderRadius="xl" textAlign="center" border="1px dashed" borderColor="gray.200">
                            <Heading size="md" color="gray.600">No products found</Heading>
                        </Box>
                    ) : (
                        <>
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6} mb={10}>
                                {products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onViewDetail={handleViewDetail}
                                        onAddCart={handleAddCart}
                                        onToggleWishlist={handleToggleWishlist}
                                        isInWishlist={isInWishlist(product.id)}
                                        onAskSupply={openSupplyModal}
                                    />
                                ))}
                            </SimpleGrid>

                            <Flex justify="center" direction="column" align="center" mb={12}>
                                {hasMore ? (
                                    <Button
                                        size="lg" colorScheme="blue" variant="outline" borderRadius="full" px={10}
                                        onClick={handleLoadMore} isLoading={loadingMore} leftIcon={<FaArrowDown />}
                                        _hover={{ bg: "blue.500", color: "white" }}
                                    >
                                        Load More Products
                                    </Button>
                                ) : (
                                    <Tag size="lg" colorScheme="gray" variant="subtle" borderRadius="full">You've reached the end</Tag>
                                )}
                            </Flex>
                        </>
                    )}

                    {/* Recommendation section */}
                    <Box bg={containerBg} p={6} borderRadius="xl" border="1px solid" borderColor="gray.100">
                        <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={5}>
                            <Box>
                                <Heading size="md">Recommended Products</Heading>
                                <Text color={muted} fontSize="sm">
                                    {recommendationsMeta?.strategy === 'popular_products_fallback'
                                        ? 'Showing popular fallback picks while the ML service is unavailable.'
                                        : 'Personalized suggestions based on your profile and activity.'}
                                </Text>
                            </Box>
                            {user?.role === 'customer' && (
                                <Button variant="outline" size="sm" onClick={fetchRecommendations} isLoading={recommendationsLoading}>
                                    Refresh Recommendations
                                </Button>
                            )}
                        </Flex>

                        {user?.role !== 'customer' ? (
                            <Box w="full" borderRadius="xl" border="1px dashed" borderColor="gray.200" bg="gray.50" py={10} textAlign="center">
                                <Text color={muted} fontWeight="600">Recommendations are available for customer accounts.</Text>
                            </Box>
                        ) : recommendationsLoading ? (
                            <Flex justify="center" py={12}><Spinner size="lg" color={accent} /></Flex>
                        ) : recommendedProducts.length === 0 ? (
                            <Box w="full" borderRadius="xl" border="1px dashed" borderColor="gray.200" bg="gray.50" py={10} textAlign="center">
                                <Text color={muted} fontWeight="600">Start purchasing for personalized recommendations.</Text>
                            </Box>
                        ) : (
                            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
                                {recommendedProducts.map((entry) => (
                                    <Box key={entry.product_id}>
                                        <ProductCard
                                            product={entry.product}
                                            onViewDetail={handleViewDetail}
                                            onAddCart={handleAddCart}
                                            onToggleWishlist={handleToggleWishlist}
                                            isInWishlist={isInWishlist(entry.product.id)}
                                            onAskSupply={openSupplyModal}
                                        />
                                        <Text mt={2} fontSize="sm" color={muted}>
                                            {entry.reason}
                                        </Text>
                                    </Box>
                                ))}
                            </SimpleGrid>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Supply Modal */}
            <Modal isOpen={supplyModalOpen} onClose={() => setSupplyModalOpen(false)} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Request Supply Order</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Store</FormLabel>
                                <Select value={supplyStoreId} onChange={(e) => setSupplyStoreId(e.target.value)}>
                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Quantity</FormLabel>
                                <NumberInput min={1} value={supplyQty} onChange={(_, v) => setSupplyQty(v)}>
                                    <NumberInputField />
                                    <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                                </NumberInput>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Unit Cost</FormLabel>
                                <Input type="number" value={supplyCost} onChange={(e) => setSupplyCost(Number(e.target.value))} />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={() => setSupplyModalOpen(false)}>Cancel</Button>
                        <Button colorScheme="purple" onClick={handlePlaceSupplyOrder} isLoading={placingSupply}>Request</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Footer />
        </Box>
    )
}
