import React, { useState, useEffect, useRef } from 'react'
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
    useColorModeValue,
    Avatar,
    Stack,
    Tag,
    // chakra,
    VisuallyHidden,
} from '@chakra-ui/react'
import { SearchIcon, StarIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { getPublicProducts } from '../../api/products'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { FaHeart, FaShoppingCart } from 'react-icons/fa'

/**
 * ProductCard - purely presentational + local animations.
 * Hooks are called at top-level of this component only.
 */
function ProductCard({ product, onViewDetail, onAddCart, onToggleWishlist, isInWishlist }) {
    const cardRef = useRef()
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

    // theme tokens (top-level hooks)
    const cardBg = useColorModeValue('white', 'gray.800')
    const cardShadow = useColorModeValue('sm', 'dark-lg')
    const muted = useColorModeValue('gray.600', 'gray.300')
    const priceColor = useColorModeValue('green.600', 'green.300')
    const badgeBg = useColorModeValue('whiteAlpha.900', 'blackAlpha.500')
    const wishlistBg = useColorModeValue('white', 'gray.700')

    useEffect(() => {
        if (cardRef.current) {
            gsap.fromTo(cardRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45 })
        }
    }, [])

    const stockStatus =
        product.stock_available > 10 ? 'In stock' : product.stock_available > 0 ? 'Low stock' : 'Out of stock'
    const stockColor = product.stock_available > 10 ? 'green.400' : product.stock_available > 0 ? 'orange.400' : 'red.400'

    const primaryImage = product.images && product.images[0]
    const isBase64 = typeof primaryImage === 'string' && primaryImage.startsWith('data:')
    // If your backend provides full URLs, use them; otherwise primaryImage might already be a full URL.
    const imagePathUrl = primaryImage && !isBase64 ? primaryImage : primaryImage
    const imageUrl = `${BACKEND_URL}/${imagePathUrl}`
    // console.log('imageUrl:', imageUrl)
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
            {/* Image */}
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

                {/* top-left category / tag */}
                {product.category_name && (
                    <Tag
                        pos="absolute"
                        top={3}
                        left={3}
                        bg={badgeBg}
                        color="purple.600"
                        borderRadius="full"
                        px={3}
                        py={1}
                        fontSize="xs"
                        boxShadow="sm"
                    >
                        {product.category_name}
                    </Tag>
                )}

                {/* wishlist button top-right */}
                <Tooltip label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}>
                    <Button
                        pos="absolute"
                        top={3}
                        right={3}
                        size="sm"
                        aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                        onClick={() => onToggleWishlist(product)}
                        zIndex={3}
                        borderRadius="full"
                        bg={isInWishlist ? 'red.500' : wishlistBg}
                        color={isInWishlist ? 'white' : 'red.500'}
                        _hover={{ bg: isInWishlist ? 'red.600' : 'gray.100' }}
                        boxShadow="sm"
                    >
                        <FaHeart />
                        <VisuallyHidden>{isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}</VisuallyHidden>
                    </Button>
                </Tooltip>

                {/* stock badge bottom-left */}
                <Badge pos="absolute" bottom={3} left={3} px={2} py={1} borderRadius="full" bg="whiteAlpha.800" color={stockColor} fontSize="xs">
                    {stockStatus}
                </Badge>
            </Box>

            {/* Content */}
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

                {/* rating + price */}
                <HStack justify="space-between" align="center">
                    {/* <HStack spacing={1}>
                        {[...Array(5)].map((_, i) => (
                            <Icon key={i} as={StarIcon} boxSize={3} color={i < 4 ? 'yellow.400' : 'gray.300'} />
                        ))}
                        <Text fontSize="xs" color="gray.500">
                            (0)
                        </Text>
                    </HStack> */}

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
                        _active={{ transform: 'scale(0.99)' }}
                        borderRadius="md"
                    >
                        View details
                    </Button>

                    <Button
                        leftIcon={<FaShoppingCart />}
                        colorScheme="green"
                        size="sm"
                        onClick={() => onAddCart(product)}
                        isDisabled={product.stock_available === 0}
                        borderRadius="md"
                        _active={{ transform: 'scale(0.99)' }}
                    >
                        Add to cart
                    </Button>
                </Flex>
            </VStack>
        </Box>
    )
}

export default function ProductsPage() {
    const toast = useToast()
    const navigate = useNavigate()
    const { addToCart } = useCart()
    const { toggleWishlist, isInWishlist } = useWishlist()

    // theme tokens (top-level)
    const pageBg = useColorModeValue('gray.50', 'gray.900')
    const containerBg = useColorModeValue('white', 'gray.800')
    const muted = useColorModeValue('gray.600', 'gray.300')
    const accent = useColorModeValue('blue.600', 'blue.300')
    const inputBg = useColorModeValue('white', 'gray.700')
    const panelShadow = useColorModeValue('sm', 'dark-lg')

    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)

    const [filters, setFilters] = useState({
        search: '',
        category_id: '',
        sort: 'name',
        order: 'asc',
    })
    const [limit] = useState(12)
    const [offset, setOffset] = useState(0)

    // Fetch categories
    async function fetchCategories() {
        try {
            const res = await productApi.getCategories(100, 0)
            if (res) {
                // console.log('Fetched categories:', res?.data)
                setCategories(res?.data?.categories || [])
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err)
        }
    }



    // Fetch products
    useEffect(() => {
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
        fetchProducts()
        // console.log('Filters:', filters, 'Offset:', offset, 'Limit:', limit)
        fetchCategories()
    }, [filters, offset, limit, toast])

    const handleViewDetail = (productId) => {
        navigate(`/customer/products/${productId}`)
    }

    const handleAddCart = (product) => {
        addToCart(product, 1)
        toast({
            title: 'Added to cart',
            description: `${product.name} added to your cart`,
            status: 'success',
            duration: 2000,
        })
    }

    const handleToggleWishlist = (product) => {
        const already = isInWishlist(product.id)
        toggleWishlist(product)
        toast({
            title: already ? 'Removed from wishlist' : 'Added to wishlist',
            status: 'success',
            duration: 1800,
        })
    }

    const handleFilterChange = (key, value) => {
        setOffset(0)
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const handleResetFilters = () => {
        setOffset(0)
        setFilters({ search: '', category_id: '', sort: 'name', order: 'asc' })
    }

    const totalPages = Math.ceil(total / limit)
    const currentPage = Math.floor(offset / limit) + 1

    return (
        <Box minH="100vh" bg={pageBg} display="flex" flexDirection="column">
            <Navbar />

            <Box flex={1} py={{ base: 8, md: 12 }}>
                <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }}>
                    {/* Header */}
                    <VStack align="start" spacing={3} mb={6}>
                        <Heading size="xl" color="white.900">
                            Explore Our Products
                        </Heading>
                        <Text color={muted} fontSize="md">
                            Curated selection — {total} items available
                        </Text>
                    </VStack>

                    {/* Filters */}
                    <Box bg={containerBg} p={{ base: 4, md: 6 }} borderRadius="xl" boxShadow={panelShadow} mb={6} border="1px" borderColor={useColorModeValue('transparent', 'transparent')}>
                        <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4} alignItems="end">
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color={muted}>
                                    Search
                                </FormLabel>
                                <Input
                                    placeholder="Search products..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    borderRadius="lg"
                                    bg={inputBg}
                                    _placeholder={{ color: 'gray.400' }}
                                    size="md"
                                    icon={<SearchIcon />}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color={muted}>
                                    Category
                                </FormLabel>
                                <Select
                                    value={filters.category_id}
                                    onChange={(e) => handleFilterChange('category_id', e.target.value)}
                                    borderRadius="lg"
                                    bg={inputBg}
                                    size="md"
                                >
                                    <option value="">All categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color={muted}>
                                    Sort
                                </FormLabel>
                                <Select
                                    value={filters.sort}
                                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                                    borderRadius="lg"
                                    bg={inputBg}
                                    size="md"
                                >
                                    <option value="name">Name</option>
                                    <option value="price">Price</option>
                                    <option value="created_at">Newest</option>
                                    <option value="stock">Stock</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color={muted}>
                                    Order
                                </FormLabel>
                                <Select
                                    value={filters.order}
                                    onChange={(e) => handleFilterChange('order', e.target.value)}
                                    borderRadius="lg"
                                    bg={inputBg}
                                    size="md"
                                >
                                    <option value="asc">Ascending</option>
                                    <option value="desc">Descending</option>
                                </Select>
                            </FormControl>

                            <Flex alignItems="center" justifyContent="flex-end">
                                <Button variant="outline" onClick={handleResetFilters} borderRadius="lg" size="md">
                                    Reset
                                </Button>
                            </Flex>
                        </SimpleGrid>

                        {/* active filter chips */}
                        {(filters.search || filters.category_id) && (
                            <HStack mt={3} spacing={3} flexWrap="wrap">
                                {filters.search && <Badge colorScheme="blue">Search: {filters.search}</Badge>}
                                {filters.category_id && <Badge colorScheme="purple">Category: {categories.find((c) => c.id == filters.category_id)?.name}</Badge>}
                            </HStack>
                        )}
                    </Box>

                    {/* Products grid */}
                    {loading ? (
                        <Flex justify="center" py={20}>
                            <Spinner size="xl" color={accent} />
                        </Flex>
                    ) : products.length === 0 ? (
                        <Box bg={containerBg} p={14} borderRadius="xl" textAlign="center" border="1px dashed" borderColor="gray.200">
                            <Heading size="md" color="gray.600" mb={2}>
                                No products found
                            </Heading>
                            <Text color={muted}>Try adjusting filters or search terms.</Text>
                        </Box>
                    ) : (
                        <>
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6} mb={6}>
                                {products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onViewDetail={handleViewDetail}
                                        onAddCart={handleAddCart}
                                        onToggleWishlist={handleToggleWishlist}
                                        isInWishlist={isInWishlist(product.id)}
                                    />
                                ))}
                            </SimpleGrid>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Flex justify="center" gap={4} align="center" mb={8}>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setOffset(Math.max(0, offset - limit))}
                                        isDisabled={offset === 0}
                                        borderRadius="md"
                                    >
                                        Previous
                                    </Button>

                                    <Text fontWeight="600">
                                        Page {currentPage} of {totalPages}
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
            </Box>

            <Footer />
        </Box>
    )
}
