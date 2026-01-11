import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Image as ChakraImage,
  Badge,
  Icon,
  Spinner,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Divider,
  useColorModeValue,
  NumberDecrementStepper,
  NumberIncrementStepper,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  AspectRatio,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
} from '@chakra-ui/react'
import { StarIcon, ArrowBackIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { getProductById } from '../../api/products'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useAuth } from '../../context/AuthContext'
import { FaHeart, FaShoppingCart } from 'react-icons/fa'
import * as bidsApi from '../../api/bids'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { user } = useAuth()
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)

  // supplier modal state
  const [supplyModalOpen, setSupplyModalOpen] = useState(false)
  const [stores, setStores] = useState([])
  const [supplyQty, setSupplyQty] = useState(1)
  const [supplyCost, setSupplyCost] = useState(0)
  const [supplyStoreId, setSupplyStoreId] = useState(null)
  const [placingSupply, setPlacingSupply] = useState(false)

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
    }
  }

  useEffect(() => {
    if (user?.role === 'supplier') fetchStores()
  }, [user])

  function openSupplyModal() {
    setSupplyQty(1)
    setSupplyCost(product?.cost_price || product?.sell_price || 0)
    setSupplyModalOpen(true)
  }

  function closeSupplyModal() {
    setSupplyModalOpen(false)
  }

  async function handlePlaceSupplyOrder() {
    if (!product) return
    if (!supplyQty || supplyQty <= 0) return toast({ title: 'Quantity must be at least 1', status: 'warning' })
    if (!supplyCost || supplyCost <= 0) return toast({ title: 'Cost must be greater than 0', status: 'warning' })
    if (!stores.length) return toast({ title: 'No stores available', status: 'error' })
    if (!supplyStoreId) return toast({ title: 'Please select a store', status: 'warning' })

    try {
      setPlacingSupply(true)
      const store_id = supplyStoreId
      const payload = { store_id, items: [{ product_id: product.id, qty: supplyQty, cost: supplyCost }] }
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

  // ✅ All hooks at top level, not inside conditionals
  const bgCard = useColorModeValue('white', 'gray.800')
  const textMuted = useColorModeValue('gray.600', 'gray.400')
  const pageBg = useColorModeValue('gray.50', 'gray.900')
  const accent = useColorModeValue('blue.500', 'blue.300')
  const pageBgGradient = useColorModeValue(
    'linear(to-b, gray.50, white)',
    'linear(to-b, gray.900, gray.800)'
  )
  const mainCardBorderColor = useColorModeValue('gray.100', 'whiteAlpha.200')
  const infoBoxBg = useColorModeValue('blue.50', 'whiteAlpha.100')
  const infoBoxBorderColor = useColorModeValue('blue.100', 'whiteAlpha.200')
  const secondaryCardBorderColor = useColorModeValue('gray.100', 'whiteAlpha.200')

  const productListPath = user?.role === 'supplier' ? '/supplier/products' : '/customer/products'

  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await getProductById(id)
        setProduct(data.product || data)
      } catch (err) {
        console.error('Failed to fetch product:', err)
        toast({ title: 'Product not found', status: 'error', duration: 2000 })
        setTimeout(() => navigate(productListPath), 2000)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchProduct()
  }, [id, toast, navigate, productListPath])

  if (loading) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" w="100vw" bg={pageBg}>
        <Navbar />
        <Box flex={1} display="flex" justifyContent="center" alignItems="center">
          <VStack spacing={4}>
            <Spinner size="xl" thickness="4px" />
            <Text fontSize="sm" color={textMuted}>
              Loading product details...
            </Text>
          </VStack>
        </Box>
        <Footer />
      </Box>
    )
  }

  if (!product) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" w="100vw" bg={pageBg}>
        <Navbar />
        <Box flex={1} display="flex" justifyContent="center" alignItems="center">
          <Box
            bg={bgCard}
            px={8}
            py={6}
            borderRadius="xl"
            boxShadow="lg"
            textAlign="center"
          >
            <Heading size="md" mb={2}>
              Product not found
            </Heading>
            <Text color={textMuted} mb={4}>
              The product you’re looking for doesn’t seem to exist.
            </Text>
            <Button
              leftIcon={<ArrowBackIcon />}
              colorScheme="blue"
              onClick={() => navigate(productListPath)}
            >
              Back to Products
            </Button>
          </Box>
        </Box>
        <Footer />
      </Box>
    )
  }

  const images = product.images || []
  const mainImage =
    images[selectedImageIdx] || 'https://via.placeholder.com/500x500?text=No+Image'
  // const isBase64 = typeof mainImage === 'string' && mainImage.startsWith('data:')
  const stockStatus =
    product.stock_available > 10
      ? 'In Stock'
      : product.stock_available > 0
        ? 'Low Stock'
        : 'Out of Stock'
  const stockColor =
    product.stock_available > 10
      ? 'green'
      : product.stock_available > 0
        ? 'orange'
        : 'red'

  const handleAddToCart = () => {
    // ✅ FIX 2: Validate quantity doesn't exceed stock
    if (quantity <= 0) {
      toast({
        title: 'Invalid quantity',
        description: 'Please select at least 1 item',
        status: 'error',
        duration: 2000,
      })
      return
    }

    if (quantity > product.stock_available) {
      toast({
        title: 'Insufficient stock',
        description: `Only ${product.stock_available} item(s) available in stock.`,
        status: 'error',
        duration: 2000,
      })
      return
    }

    addToCart(product, quantity)
    toast({
      title: 'Added to cart',
      description: `${quantity} × ${product.name}`,
      status: 'success',
      duration: 2000,
    })
    setQuantity(1)
  }

  const handleToggleWishlist = () => {
    toggleWishlist(product)
    const inWishlist = isInWishlist(product.id)
    toast({
      title: inWishlist ? 'Removed from wishlist' : 'Added to wishlist',
      status: 'success',
      duration: 2000,
    })
  }

  const discount =
    product.cost_price && product.cost_price > product.sell_price
      ? Math.round(((product.cost_price - product.sell_price) / product.cost_price) * 100)
      : 0

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      w='100vw'
      bgGradient={pageBgGradient}  // ✅ uses precomputed value
    >
      <Navbar />

      <Box flex={1} py={{ base: 6, md: 10 }}>
        <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }}>
          {/* Breadcrumb + Back */}
          <HStack justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
            <Breadcrumb
              spacing="8px"
              separator={<ChevronRightIcon color="gray.500" />}
              fontSize="sm"
            >
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate(productListPath)}>
                  Products
                </BreadcrumbLink>
              </BreadcrumbItem>
              {product.category_name && (
                <BreadcrumbItem>
                  <BreadcrumbLink>{product.category_name}</BreadcrumbLink>
                </BreadcrumbItem>
              )}
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink>{product.name}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            <Button
              leftIcon={<ArrowBackIcon />}
              variant="ghost"
              size="sm"
              onClick={() => navigate(productListPath)}
            >
              Back
            </Button>
          </HStack>

          {/* Main Content Card */}
          <Box
            bg={bgCard}
            borderRadius="2xl"
            boxShadow="2xl"
            p={{ base: 4, md: 8 }}
            borderWidth="1px"
            borderColor={mainCardBorderColor} // ✅ precomputed
            backdropFilter="blur(6px)"
          >
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 8, md: 10 }}>
              {/* Image Section */}
              <VStack spacing={4} align="stretch">
                <AspectRatio ratio={1}>
                  <Box
                    borderRadius="xl"
                    overflow="hidden"
                    bg="gray.100"
                    _hover={{ transform: 'scale(1.01)', boxShadow: 'xl' }}
                    transition="all 0.25s ease-out"
                  >
                    <ChakraImage
                      src={`${BACKEND_URL}/` + mainImage}
                      alt={product.name}
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  </Box>
                </AspectRatio>

                {images.length > 1 && (
                  <HStack spacing={3} w="100%" overflowX="auto" pb={1}>
                    {images.map((img, idx) => (
                      <Box
                        key={idx}
                        flex="0 0 auto"
                        w="80px"
                        h="80px"
                        borderRadius="md"
                        overflow="hidden"
                        cursor="pointer"
                        borderWidth="2px"
                        borderColor={
                          selectedImageIdx === idx ? accent : 'gray.200'
                        }
                        transition="all 0.2s"
                        _hover={{ borderColor: accent, transform: 'translateY(-2px)' }}
                        onClick={() => setSelectedImageIdx(idx)}
                      >
                        {/* {console.log('Image src:', img)} */}
                        {/* {console.log(`${BACKEND_URL}/` + img)} */}
                        <ChakraImage
                          src={`${BACKEND_URL}/` + img}
                          alt={`${product.name} ${idx + 1}`}
                          w="100%"
                          h="100%"
                          objectFit="cover"
                        />
                      </Box>
                    ))}
                  </HStack>
                )}
              </VStack>

              {/* Details Section */}
              <VStack align="stretch" spacing={5}>
                {/* Category & SKU badge row */}
                <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={2}>
                  <HStack spacing={2}>
                    {product.category_name && (
                      <Badge
                        colorScheme="purple"
                        fontSize="xs"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {product.category_name}
                      </Badge>
                    )}
                    <Badge
                      variant="subtle"
                      fontSize="xs"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      SKU: PROD-{product.id}
                    </Badge>
                    {discount > 0 && (
                      <Badge
                        colorScheme="red"
                        fontSize="xs"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {discount}% OFF
                      </Badge>
                    )}
                  </HStack>
                  <Badge
                    colorScheme={stockColor}
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                  >
                    {stockStatus}
                  </Badge>
                </HStack>

                {/* Title & description */}
                <VStack align="start" spacing={2}>
                  <Heading size="lg" lineHeight="1.2">
                    {product.name}
                  </Heading>
                  {product.description && (
                    <Text color={textMuted} fontSize="sm">
                      {product.description}
                    </Text>
                  )}
                </VStack>

                {/* Rating */}
                <HStack spacing={2} fontSize="sm">
                  {[...Array(5)].map((_, i) => (
                    <Icon
                      key={i}
                      as={StarIcon}
                      boxSize={4}
                      color={i < 4 ? 'yellow.400' : 'gray.300'}
                    />
                  ))}
                  <Text color={textMuted}>(0 reviews)</Text>
                </HStack>

                <Divider />

                {/* Price & stock info */}
                <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
                  <VStack align="start" spacing={1}>
                    <HStack spacing={3} align="baseline">
                      <Heading size="lg" color="green.500">
                        ${product.sell_price}
                      </Heading>
                      {/* {product.cost_price > 0 && (
                        <Text
                          fontSize="sm"
                          color={textMuted}
                          textDecoration="line-through"
                        >
                          ${product.cost_price}
                        </Text>
                      )} */}
                    </HStack>
                    <Text fontSize="xs" color={textMuted}>
                      Inclusive of all taxes
                    </Text>
                  </VStack>
                  <Text color={textMuted} fontSize="sm">
                    {product.stock_available} item
                    {product.stock_available !== 1 && 's'} left
                  </Text>
                </HStack>

                {/* Quantity */}
                <Box>
                  <Text fontWeight="600" mb={1} fontSize="sm">
                    Quantity
                  </Text>
                  <NumberInput
                    max={product.stock_available}
                    min={1}
                    value={quantity}
                    onChange={(_, valueNumber) =>
                      setQuantity(Number.isNaN(valueNumber) ? 1 : valueNumber)
                    }
                    w="140px"
                    size="sm"
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </Box>

                {/* Action Buttons */}
                <HStack spacing={3} w="100%" pt={2} flexWrap="wrap">
                  {user?.role === 'supplier' ? (
                    <Button
                      flex="1 1 180px"
                      colorScheme="purple"
                      size="md"
                      onClick={openSupplyModal}
                      isDisabled={user.role ==="user" && product.stock_available === 0}
                      boxShadow="md"
                      _hover={{ boxShadow: 'xl', transform: 'translateY(-1px)' }}
                      transition="all 0.15s ease-out"
                    >
                      Ask to place supply order
                    </Button>
                  ) : (
                    <Button
                      flex="1 1 180px"
                      colorScheme="green"
                      size="md"
                      leftIcon={<FaShoppingCart />}
                      isDisabled={product.stock_available === 0}
                      onClick={handleAddToCart}
                      boxShadow="md"
                      _hover={{ boxShadow: 'xl', transform: 'translateY(-1px)' }}
                      transition="all 0.15s ease-out"
                    >
                      Add to Cart
                    </Button>
                  )}

                  {user?.role !== 'supplier' && (
                    <Button
                      flex="0 0 auto"
                      colorScheme={isInWishlist(product.id) ? 'red' : 'gray'}
                      size="md"
                      leftIcon={<FaHeart />}
                      variant={isInWishlist(product.id) ? 'solid' : 'outline'}
                      onClick={handleToggleWishlist}
                      _hover={{ transform: 'translateY(-1px)' }}
                      transition="all 0.15s ease-out"
                    >
                      {isInWishlist(product.id) ? 'In Wishlist' : 'Wishlist'}
                    </Button>
                  )}
                </HStack>

                {/* Info strip */}
                <Box
                  w="100%"
                  bg={infoBoxBg}
                  p={4}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={infoBoxBorderColor}
                  fontSize="sm"
                >
                  <VStack align="start" spacing={1}>
                    <Text>✓ Free shipping on orders over $50</Text>
                    <Text>✓ 30-day return policy</Text>
                    <Text>✓ Secure payment & checkout</Text>
                  </VStack>
                </Box>

                {/* Supply modal */}
                {user?.role === 'supplier' && (
                  <Modal isOpen={supplyModalOpen} onClose={closeSupplyModal} isCentered>
                    <ModalOverlay />
                    <ModalContent>
                      <ModalHeader>Request Supply Order</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <Text fontWeight="600">Product: {product?.name}</Text>
                        <FormControl mt={3}>
                          <FormLabel>Store</FormLabel>
                          <Select value={supplyStoreId || ''} onChange={(e) => setSupplyStoreId(e.target.value)}>
                            {stores.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl mt={3}>
                          <FormLabel>Quantity</FormLabel>
                          <NumberInput min={1} value={supplyQty} onChange={(_, v) => setSupplyQty(v)}>
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>

                        <FormControl mt={3}>
                          <FormLabel>Unit cost</FormLabel>
                          <Input type="number" value={supplyCost} onChange={(e) => setSupplyCost(Number(e.target.value))} />
                        </FormControl>
                      </ModalBody>

                      <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={closeSupplyModal}>Cancel</Button>
                        <Button colorScheme="purple" onClick={handlePlaceSupplyOrder} isLoading={placingSupply}>Request</Button>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>
                )}

              </VStack>
            </SimpleGrid>
          </Box>

          {/* Tabs Section */}
          <Box
            mt={8}
            bg={bgCard}
            p={{ base: 4, md: 6 }}
            borderRadius="2xl"
            boxShadow="xl"
            borderWidth="1px"
            borderColor={secondaryCardBorderColor}
          >
            <Tabs variant="soft-rounded" colorScheme="blue">
              <TabList overflowX="auto">
                <Tab fontSize="sm">Description</Tab>
                <Tab fontSize="sm">Specifications</Tab>
                <Tab fontSize="sm">Reviews</Tab>
              </TabList>
              <TabPanels mt={4}>
                <TabPanel>
                  <Text color={textMuted} fontSize="sm" lineHeight="1.7">
                    {product.description || 'No description available for this product.'}
                  </Text>
                </TabPanel>
                <TabPanel>
                  <VStack align="start" spacing={3} fontSize="sm">
                    <HStack>
                      <Text fontWeight="600" w="140px">
                        Category:
                      </Text>
                      <Text color={textMuted}>{product.category_name || 'N/A'}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="600" w="140px">
                        Price:
                      </Text>
                      <Text color={textMuted}>${product.sell_price}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="600" w="140px">
                        Stock:
                      </Text>
                      <Text color={textMuted}>{product.stock_available} units</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="600" w="140px">
                        SKU:
                      </Text>
                      <Text color={textMuted}>PROD-{product.id}</Text>
                    </HStack>
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <Text color={textMuted} fontSize="sm">
                    No reviews yet. Be the first to review this product!
                  </Text>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}
