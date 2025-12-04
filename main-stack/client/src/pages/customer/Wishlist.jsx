import React from 'react'
import {
    Box,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    SimpleGrid,
    useToast,
    useColorModeValue,
    Badge,
    Icon,
    Tooltip,
    IconButton,
    Divider,
} from '@chakra-ui/react'
import { DeleteIcon, ArrowBackIcon, StarIcon } from '@chakra-ui/icons'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useWishlist } from '../../context/WishlistContext'
import { useCart } from '../../context/CartContext'
import { FaShoppingCart } from 'react-icons/fa'

function WishlistCard({ product, onRemove, onMoveToCart, onViewDetail }) {
    const bgCard = useColorModeValue('white', 'gray.800')
    const borderColor = useColorModeValue('gray.200', 'gray.700')
    const textMuted = useColorModeValue('gray.600', 'gray.400')
    // const accent = useColorModeValue('blue.500', 'blue.300')

    const primaryImage =
        product.images && product.images[0]
            ? product.images[0]
            : 'https://via.placeholder.com/200x200?text=No+Image'

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const ImgUrl = `${BACKEND_URL}/` + primaryImage;

    const isBase64 =
        typeof primaryImage === 'string' && primaryImage.startsWith('data:')

    const stockStatus = product.stock_available > 0 ? 'In Stock' : 'Out of Stock'
    const stockColor = product.stock_available > 0 ? 'green' : 'red'

    const discount =
        product.cost_price && product.cost_price > product.sell_price
            ? Math.round(
                ((product.cost_price - product.sell_price) / product.cost_price) * 100
            )
            : 0

    return (
        <Box
            bg={bgCard}
            borderRadius="2xl"
            overflow="hidden"
            boxShadow="lg"
            border="1px solid"
            borderColor={borderColor}
            transition="all 0.2s ease-out"
            _hover={{ boxShadow: '2xl', transform: 'translateY(-4px)' }}
            display="flex"
            flexDirection="column"
        >
            {/* Image section */}
            <Box pos="relative" h="190px" overflow="hidden">
                <Box
                    h="100%"
                    bgImage={isBase64 ? ImgUrl : `url(${ImgUrl})`}
                    bgSize="cover"
                    bgPos="center"
                    transition="transform 0.3s ease"
                    _groupHover={{ transform: 'scale(1.05)' }}
                />
                {/* Category + discount chips on image */}
                <HStack pos="absolute" top={2} left={2} spacing={2}>
                    {product.category_name && (
                        <Badge
                            colorScheme="purple"
                            variant="solid"
                            fontSize="0.65rem"
                            borderRadius="full"
                            px={2}
                            py={1}
                        >
                            {product.category_name}
                        </Badge>
                    )}
                    {discount > 0 && (
                        <Badge
                            colorScheme="red"
                            variant="solid"
                            fontSize="0.65rem"
                            borderRadius="full"
                            px={2}
                            py={1}
                        >
                            {discount}% OFF
                        </Badge>
                    )}
                </HStack>

                {/* Remove button */}
                <Tooltip label="Remove from wishlist" hasArrow>
                    <IconButton
                        aria-label="Remove from wishlist"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        variant="solid"
                        pos="absolute"
                        top={2}
                        right={2}
                        borderRadius="full"
                        onClick={() => onRemove(product.id)}
                    />
                </Tooltip>
            </Box>

            {/* Content section */}
            <VStack align="start" spacing={3} p={4} flex={1}>
                {/* Name */}
                <Heading size="sm" noOfLines={2}>
                    {product.name}
                </Heading>

                {/* Rating */}
                <HStack spacing={1}>
                    {[...Array(5)].map((_, i) => (
                        <Icon
                            key={i}
                            as={StarIcon}
                            boxSize={3}
                            color={i < 4 ? 'yellow.400' : 'gray.300'}
                        />
                    ))}
                    <Text fontSize="xs" color={textMuted}>
                        (0 reviews)
                    </Text>
                </HStack>

                {/* Price + stock */}
                <VStack align="start" spacing={1} w="100%">
                    <HStack spacing={2} align="baseline">
                        <Heading size="md" color="green.500">
                            ${product.sell_price}
                        </Heading>
                    </HStack>
                    <Badge
                        colorScheme={stockColor}
                        variant="subtle"
                        fontSize="xs"
                        borderRadius="full"
                    >
                        {stockStatus}
                    </Badge>
                    <Text fontSize="xs" color={textMuted}>
                        {product.stock_available} item
                        {product.stock_available !== 1 && 's'} available
                    </Text>
                </VStack>

                <Divider />

                {/* Action buttons */}
                <HStack spacing={2} w="100%" pt={1}>
                    <Button
                        flex={1}
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => onViewDetail(product.id)}
                    >
                        View
                    </Button>
                    <Button
                        flex={1}
                        size="sm"
                        colorScheme="green"
                        leftIcon={<FaShoppingCart />}
                        isDisabled={product.stock_available === 0}
                        onClick={() => onMoveToCart(product)}
                    >
                        Move to Cart
                    </Button>
                </HStack>
            </VStack>
        </Box>
    )
}

export default function WishlistPage() {
    const navigate = useNavigate()
    const toast = useToast()
    const { wishlist, removeFromWishlist, clearWishlist } = useWishlist()
    const { addToCart } = useCart()

    // theme values (hooks at top)
    const pageBgGradient = useColorModeValue(
        'linear(to-b, gray.50, white)',
        'linear(to-b, gray.900, gray.800)'
    )
    const bgCard = useColorModeValue('white', 'gray.800')
    const textMuted = useColorModeValue('gray.600', 'gray.400')
    // const headerAccent = useColorModeValue('blue.500', 'blue.300')
    const emptyBorderColor = useColorModeValue('gray.100', 'whiteAlpha.200')

    const handleMoveToCart = (product) => {
        addToCart(product, 1)
        removeFromWishlist(product.id)
        toast({
            title: 'Added to cart',
            description: `${product.name} moved to cart`,
            status: 'success',
            duration: 2000,
        })
    }

    const handleClear = () => {
        if (window.confirm('Clear entire wishlist?')) {
            clearWishlist()
            toast({ title: 'Wishlist cleared', status: 'info', duration: 2000 })
        }
    }

    return (
        <Box
            minH="100vh"
            display="flex"
            flexDirection="column"
            bgGradient={pageBgGradient}
            w='100vw'
        >
            <Navbar />

            <Box flex={1} py={{ base: 6, md: 10 }}>
                <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }}>
                    {/* Header / Summary */}
                    <HStack
                        justify="space-between"
                        align="flex-start"
                        mb={8}
                        flexWrap="wrap"
                        gap={4}
                    >
                        <VStack align="start" spacing={1}>
                            <Heading size="lg">My Wishlist</Heading>
                            <HStack spacing={2}>
                                <Text color={textMuted} fontSize="sm">
                                    {wishlist.length} item
                                    {wishlist.length !== 1 && 's'} saved
                                </Text>
                                {wishlist.length > 0 && (
                                    <Badge
                                        colorScheme="blue"
                                        variant="subtle"
                                        fontSize="xs"
                                        borderRadius="full"
                                    >
                                        Favourites
                                    </Badge>
                                )}
                            </HStack>
                        </VStack>

                        <HStack spacing={3}>
                            <Button
                                leftIcon={<ArrowBackIcon />}
                                variant="ghost"
                                onClick={() => navigate('/customer/products')}
                            >
                                Continue Shopping
                            </Button>
                            {wishlist.length > 0 && (
                                <Button
                                    variant="outline"
                                    colorScheme="red"
                                    onClick={handleClear}
                                >
                                    Clear Wishlist
                                </Button>
                            )}
                        </HStack>
                    </HStack>

                    {/* Content */}
                    {wishlist.length === 0 ? (
                        <Box
                            bg={bgCard}
                            p={{ base: 8, md: 12 }}
                            borderRadius="2xl"
                            textAlign="center"
                            boxShadow="2xl"
                            border="1px solid"
                            borderColor={emptyBorderColor}
                        >
                            <Heading size="md" mb={3}>
                                Your wishlist is empty
                            </Heading>
                            <Text color={textMuted} mb={6} fontSize="sm">
                                Save items you like and quickly move them to the cart when
                                you&apos;re ready.
                            </Text>
                            <Button
                                colorScheme="blue"
                                size="md"
                                onClick={() => navigate('/customer/products')}
                            >
                                Start Exploring
                            </Button>
                        </Box>
                    ) : (
                        <>
                            {/* Grid of cards */}
                            <SimpleGrid
                                columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}
                                spacing={6}
                                mb={8}
                            >
                                {wishlist.map((product) => (
                                    <WishlistCard
                                        key={product.id}
                                        product={product}
                                        onRemove={removeFromWishlist}
                                        onMoveToCart={handleMoveToCart}
                                        onViewDetail={(id) =>
                                            navigate(`/customer/products/${id}`)
                                        }
                                    />
                                ))}
                            </SimpleGrid>

                            {/* Bottom actions */}
                            <HStack spacing={4} justify="center">
                                <Button
                                    colorScheme="blue"
                                    onClick={() => navigate('/customer/products')}
                                    px={8}
                                >
                                    Continue Shopping
                                </Button>
                                <Button
                                    variant="outline"
                                    colorScheme="red"
                                    onClick={handleClear}
                                    px={8}
                                >
                                    Clear Wishlist
                                </Button>
                            </HStack>
                        </>
                    )}
                </Box>
            </Box>

            <Footer />
        </Box>
    )
}
