import React, { useEffect, useState, useRef } from 'react'
import {
    Box,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    IconButton,
    VStack,
    HStack,
    Heading,
    Text,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    useDisclosure,
    useToast,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Spinner,
    Badge,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    TableContainer,
    Select,
    SimpleGrid,
    Image as ChakraImage,
    CloseButton,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    AlertDialogContent,
    useColorModeValue,
    Tooltip,
    Flex,
    Divider,
    Avatar,
} from '@chakra-ui/react'
import { DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons'
import gsap from 'gsap'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import AdminSidebar from '../../components/AdminSidebar'
import * as productsApi from '../../api/products'
import * as categoriesApi from '../../api/categories'

const MAX_IMAGES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

function _parseImageData(imageStr) {
    if (!imageStr) return []
    try {
        return typeof imageStr === 'string' ? JSON.parse(imageStr) : imageStr
    } catch {
        return []
    }
}

function isBase64(str) {
    try {
        return btoa(atob(str)) === str
    } catch {
        return false
    }
}

export default function ProductsPage() {
    const toast = useToast()
    // const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:888'
    const BACKEND_URL = 'http://localhost:8888'

    // -------------------------
    // Top-level theme tokens (ALL hooks here)
    // -------------------------
    const pageBg = useColorModeValue('gray.50', 'gray.900')
    const canvasBg = useColorModeValue('white', 'gray.800')
    const subtleCard = useColorModeValue('white', 'gray.800')
    const mutedText = useColorModeValue('gray.600', 'gray.300')
    const borderColor = useColorModeValue('gray.100', 'gray.700')
    const headerBg = useColorModeValue(
        'linear-gradient(90deg, rgba(59,130,246,0.06), rgba(99,102,241,0.03))',
        'transparent'
    )
    const accent = useColorModeValue('blue.600', 'blue.300')
    // const subtleAccentBg = useColorModeValue('blue.50', 'blue.900')
    const tableStripe = useColorModeValue('white', 'gray.800')
    const hoverBg = useColorModeValue('gray.50', 'gray.700')
    const tableHeadBg = useColorModeValue('white', 'gray.800')
    const modalBodyBg = useColorModeValue('gray.50', 'gray.800')
    const avatarBg = useColorModeValue('gray.100', 'gray.700')

    // -------------------------
    // State & refs (unchanged)
    // -------------------------
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({
        name: '',
        description: '',
        category_id: '',
        supplier_id: '',
        cost_price: 0,
        sell_price: 0,
        stock_available: 0,
        images: [],
    })
    const [editingId, setEditingId] = useState(null)
    const [errors, setErrors] = useState({})
    const [imagePreviewError, setImagePreviewError] = useState('')

    const { isOpen, onOpen, onClose } = useDisclosure()
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
    const [deleteId, setDeleteId] = useState(null)
    const cancelRef = useRef()
    const tableRef = useRef(null)
    const fileInputRef = useRef(null)

    // -------------------------
    // Data fetch (unchanged)
    // -------------------------
    useEffect(() => {
        fetchCategories()
        fetchProducts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (tableRef.current && products.length > 0) {
            gsap.fromTo(
                tableRef.current.querySelectorAll('tbody tr'),
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, stagger: 0.05, duration: 0.28 }
            )
        }
    }, [products])

    async function fetchCategories() {
        try {
            const res = await categoriesApi.listCategories(100, 0)
            setCategories(res.data.categories || [])
        } catch (err) {
            console.error('Failed to fetch categories:', err)
        }
    }

    async function fetchProducts() {
        setLoading(true)
        try {
            const res = await productsApi.listProducts(100, 0)
            setProducts(res.data.products || [])
        } catch (err) {
            console.error('Failed to fetch products:', err)
            toast({ title: 'Failed to load products', status: 'error', duration: 3000 })
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    // -------------------------
    // Validation & handlers (unchanged)
    // -------------------------
    function validate() {
        const e = {}
        if (!form.name || !form.name.trim()) e.name = 'Product name is required'
        if (form.name && form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
        if (!form.sell_price || form.sell_price <= 0) e.sell_price = 'Selling price must be greater than 0'
        if (form.cost_price && form.cost_price < 0) e.cost_price = 'Cost price cannot be negative'
        if (form.stock_available && form.stock_available < 0) e.stock_available = 'Stock cannot be negative'
        return e
    }

    function handleImageChange(e) {
        const files = Array.from(e.target.files || [])
        setImagePreviewError('')

        if (form.images.length + files.length > MAX_IMAGES) {
            setImagePreviewError(`Maximum ${MAX_IMAGES} images allowed. You have ${form.images.length} already.`)
            return
        }

        files.forEach((file) => {
            if (file.size > MAX_FILE_SIZE) {
                setImagePreviewError(`File ${file.name} is too large (max 5MB)`)
                return
            }

            const reader = new FileReader()
            reader.onload = (event) => {
                setForm((prev) => ({
                    ...prev,
                    images: [...prev.images, event.target.result],
                }))
            }
            reader.readAsDataURL(file)
        })

        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    function removeImage(index) {
        setForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }))
    }

    async function onSubmit(e) {
        e.preventDefault()
        setErrors({})
        const val = validate()
        if (Object.keys(val).length) return setErrors(val)

        try {
            setSubmitting(true)
            const payload = {
                name: form.name,
                description: form.description,
                category_id: form.category_id ? parseInt(form.category_id) : null,
                supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
                cost_price: parseFloat(form.cost_price) || 0,
                sell_price: parseFloat(form.sell_price),
                stock_available: parseInt(form.stock_available) || 0,
                images: form.images.length > 0 ? form.images : null,
            }

            if (editingId) {
                await productsApi.updateProduct(editingId, payload)
                toast({ title: 'Product updated successfully', status: 'success', duration: 2000 })
            } else {
                await productsApi.createProduct(payload)
                toast({ title: 'Product created successfully', status: 'success', duration: 2000 })
            }
            fetchProducts()
            resetForm()
            onClose()
        } catch (err) {
            console.error('Failed to save product:', err)
            const payload = err?.response?.data
            if (payload?.errors && Array.isArray(payload.errors)) {
                const map = {}
                payload.errors.forEach((it) => (map[it.field || 'form'] = it.msg))
                setErrors(map)
            } else if (payload?.message) {
                setErrors({ form: payload.message })
            }
            toast({ title: 'Failed to save product', status: 'error', duration: 3000 })
        } finally {
            setSubmitting(false)
        }
    }

    function resetForm() {
        setForm({
            name: '',
            description: '',
            category_id: '',
            supplier_id: '',
            cost_price: 0,
            sell_price: 0,
            stock_available: 0,
            images: [],
        })
        setErrors({})
        setImagePreviewError('')
        setEditingId(null)
    }

    function openAddModal() {
        resetForm()
        onOpen()
    }

    function openEditModal(product) {
        setForm({
            name: product.name,
            description: product.description || '',
            category_id: product.category_id || '',
            supplier_id: product.supplier_id || '',
            cost_price: product.cost_price || 0,
            sell_price: product.sell_price || 0,
            stock_available: product.stock_available || 0,
            images: product.images || [],
        })
        setEditingId(product.id)
        onOpen()
    }

    function openDeleteDialog(id) {
        setDeleteId(id)
        onDeleteOpen()
    }

    async function confirmDelete() {
        if (!deleteId) return
        try {
            setSubmitting(true)
            await productsApi.deleteProduct(deleteId)
            toast({ title: 'Product deleted successfully', status: 'success', duration: 2000 })
            fetchProducts()
            onDeleteClose()
        } catch (err) {
            console.error('Failed to delete product:', err)
            toast({ title: 'Failed to delete product', status: 'error', duration: 3000 })
        } finally {
            setSubmitting(false)
        }
    }

    // -------------------------
    // Render
    // -------------------------
    return (
        <Box minH="100vh" bg={pageBg} display="flex" flexDirection="column" w="100vw">
            <Navbar />

            <Box flex={1} py={{ base: 6, md: 10 }}>
                <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }}>
                    <SimpleGrid columns={{ base: 1, lg: 5 }} spacing={6} alignItems="flex-start">
                        {/* Sidebar */}
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

                        {/* Main */}
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
                                        <Heading size="lg">Products</Heading>
                                        <Badge colorScheme="blue" borderRadius="full" px={3} py={0.5} fontSize="xs">
                                            Inventory
                                        </Badge>
                                    </HStack>
                                    <Text color={mutedText} fontSize="sm">
                                        Manage catalogue, pricing, and stock — visually enhanced for faster scanning.
                                    </Text>
                                </VStack>

                                <HStack spacing={3}>
                                    <Button
                                        leftIcon={<AddIcon />}
                                        colorScheme="blue"
                                        onClick={openAddModal}
                                        size="md"
                                        fontWeight="600"
                                        borderRadius="full"
                                        px={5}
                                        boxShadow="sm"
                                    >
                                        Add Product
                                    </Button>
                                </HStack>
                            </Flex>

                            <Divider mb={5} />

                            {/* Table / states */}
                            {loading ? (
                                <Box textAlign="center" py={12} display="flex" flexDirection="column" alignItems="center">
                                    <Spinner size="xl" thickness="4px" color={accent} />
                                    <Text mt={4} color={mutedText} fontSize="sm">
                                        Loading products...
                                    </Text>
                                </Box>
                            ) : products.length === 0 ? (
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
                                        No products yet
                                    </Heading>
                                    <Text color={mutedText} mb={5} fontSize="sm">
                                        Create your first product to get started with your inventory.
                                    </Text>
                                    <Button colorScheme="blue" onClick={openAddModal} leftIcon={<AddIcon />} borderRadius="full">
                                        Create Product
                                    </Button>
                                </Box>
                            ) : (
                                <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor={borderColor} bg={tableStripe} ref={tableRef}>
                                    <TableContainer maxH="62vh" overflowY="auto">
                                        <Table variant="simple" size="sm">
                                            <Thead position="sticky" top={0} zIndex={1} bg={tableHeadBg}>
                                                <Tr>
                                                    <Th fontWeight="700" color="white.700">Name</Th>
                                                    <Th fontWeight="700" color="white.700">Category</Th>
                                                    <Th fontWeight="700" color="white.700" isNumeric>Cost</Th>
                                                    <Th fontWeight="700" color="white.700" isNumeric>Price</Th>
                                                    <Th fontWeight="700" color="white.700" isNumeric>Stock</Th>
                                                    <Th fontWeight="700" color="white.700">Images</Th>
                                                    <Th fontWeight="700" color="orange.700" textAlign="center" w="140px">Actions</Th>
                                                </Tr>
                                            </Thead>

                                            <Tbody>
                                                {products.map((product, idx) => (
                                                    <Tr
                                                        key={product.id}
                                                        borderBottom="1px"
                                                        borderColor={borderColor}
                                                        bg={idx % 2 === 0 ? 'transparent' : tableStripe}
                                                        _hover={{ bg: hoverBg, transform: 'translateY(-1px)', boxShadow: 'sm' }}
                                                        transition="all 0.15s ease-out"
                                                    >
                                                        <Td fontWeight="600" color="white.800" maxW="260px">
                                                            <HStack spacing={3} align="center">
                                                                {console.log(`${BACKEND_URL}/` + product.images[0])}
                                                                <Avatar
                                                                    size="sm"
                                                                    name={product.name}
                                                                    src={`${BACKEND_URL}/` + product.images[0]}
                                                                    bg={avatarBg}
                                                                />
                                                                <Box minW={0}>
                                                                    <Text isTruncated title={product.name} fontWeight="600">{product.name}</Text>
                                                                    {product.description && (
                                                                        <Text fontSize="xs" color={mutedText} noOfLines={1}>{product.description}</Text>
                                                                    )}
                                                                </Box>
                                                            </HStack>
                                                        </Td>

                                                        <Td fontSize="sm">
                                                            {product.category_name ? (
                                                                <Badge px={2} py={0.5} borderRadius="full" colorScheme="purple" variant="subtle">{product.category_name}</Badge>
                                                            ) : (
                                                                <Text color="gray.400" fontSize="xs">No category</Text>
                                                            )}
                                                        </Td>

                                                        <Td isNumeric color="gray.600" fontSize="sm">{product.cost_price != null ? `$${product.cost_price.toFixed(2)}` : <Text as="span" color="gray.400">-</Text>}</Td>

                                                        <Td isNumeric fontWeight="700" color="green.600" fontSize="sm">${product.sell_price}</Td>

                                                        <Td isNumeric fontSize="sm" color={product.stock_available === 0 ? 'red.500' : product.stock_available < 10 ? 'orange.500' : 'gray.700'}>
                                                            {product.stock_available}
                                                        </Td>

                                                        <Td>
                                                            <Badge colorScheme={(product.images?.length || 0) > 0 ? 'blue' : 'gray'} variant="subtle" borderRadius="full" px={3} py={0.5} fontSize="xs">
                                                                {product.images?.length || 0}/{MAX_IMAGES}
                                                            </Badge>
                                                        </Td>

                                                        <Td>
                                                            <HStack justify="center" spacing={1} whiteSpace="nowrap">
                                                                <Tooltip label="Edit product">
                                                                    <IconButton
                                                                        icon={<EditIcon />}
                                                                        size="sm"
                                                                        colorScheme="blue"
                                                                        variant="ghost"
                                                                        onClick={() => openEditModal(product)}
                                                                        aria-label="Edit"
                                                                        borderRadius="full"
                                                                    />
                                                                </Tooltip>

                                                                <Tooltip label="Delete product">
                                                                    <IconButton
                                                                        icon={<DeleteIcon />}
                                                                        size="sm"
                                                                        colorScheme="red"
                                                                        variant="ghost"
                                                                        onClick={() => openDeleteDialog(product.id)}
                                                                        aria-label="Delete"
                                                                        borderRadius="full"
                                                                    />
                                                                </Tooltip>
                                                            </HStack>
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}
                        </Box>
                    </SimpleGrid>
                </Box>
            </Box>

            {/* Add/Edit Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside" isCentered>
                <ModalOverlay backdropFilter="blur(6px)" bg="blackAlpha.400" />
                <ModalContent borderRadius="2xl" boxShadow="2xl" overflow="hidden">
                    <ModalHeader
                        fontSize="lg"
                        fontWeight="700"
                        borderBottom="1px solid"
                        borderColor={borderColor}
                        bg={headerBg}
                    >
                        {editingId ? 'Edit Product' : 'Add New Product'}
                    </ModalHeader>

                    <ModalCloseButton isDisabled={submitting} borderRadius="full" mt={2} mr={2} />

                    <ModalBody pb={4} as="form" onSubmit={onSubmit} bg={modalBodyBg} maxH="70vh" overflowY="auto">
                        <VStack spacing={6} align="stretch">
                            {/* Basic Info */}
                            <Box w="full" bg={canvasBg} p={4} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor={borderColor}>
                                <Heading size="sm" mb={3} color="gray.700">Basic Information</Heading>
                                <VStack spacing={4}>
                                    <FormControl isInvalid={!!errors.name} isRequired>
                                        <FormLabel fontWeight="600">Product Name</FormLabel>
                                        <Input
                                            placeholder="e.g., Wireless Headphones"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            isDisabled={submitting}
                                            borderRadius="lg"
                                        />
                                        {errors.name && <Text color="red.500" fontSize="sm" mt={1}>{errors.name}</Text>}
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontWeight="600">Description (Optional)</FormLabel>
                                        <Textarea
                                            placeholder="Brief product description"
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            isDisabled={submitting}
                                            rows={3}
                                            borderRadius="lg"
                                            resize="vertical"
                                        />
                                    </FormControl>
                                </VStack>
                            </Box>

                            {/* Category & Pricing */}
                            <Box w="full" bg={canvasBg} p={4} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor={borderColor}>
                                <Heading size="sm" mb={3} color="gray.700">Category & Pricing</Heading>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    <FormControl>
                                        <FormLabel fontWeight="600">Category (Optional)</FormLabel>
                                        <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} isDisabled={submitting} borderRadius="lg">
                                            <option value="">Select category</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl isInvalid={!!errors.sell_price} isRequired>
                                        <FormLabel fontWeight="600">Selling Price</FormLabel>
                                        <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} isDisabled={submitting} borderRadius="lg" />
                                        {errors.sell_price && <Text color="red.500" fontSize="sm" mt={1}>{errors.sell_price}</Text>}
                                    </FormControl>

                                    <FormControl isInvalid={!!errors.cost_price}>
                                        <FormLabel fontWeight="600">Cost Price (Optional)</FormLabel>
                                        <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} isDisabled={submitting} borderRadius="lg" />
                                        {errors.cost_price && <Text color="red.500" fontSize="sm" mt={1}>{errors.cost_price}</Text>}
                                    </FormControl>

                                    <FormControl isInvalid={!!errors.stock_available}>
                                        <FormLabel fontWeight="600">Stock (Optional)</FormLabel>
                                        <NumberInput value={form.stock_available} onChange={(val) => setForm({ ...form, stock_available: val })} min={0} isDisabled={submitting}>
                                            <NumberInputField borderRadius="lg" />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                        {errors.stock_available && <Text color="red.500" fontSize="sm" mt={1}>{errors.stock_available}</Text>}
                                    </FormControl>
                                </SimpleGrid>
                            </Box>

                            {/* Image Upload */}
                            <Box w="full" bg={canvasBg} p={4} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor={borderColor}>
                                <Heading size="sm" mb={3} color="gray.700">Product Images</Heading>
                                <VStack spacing={3} align="stretch">
                                    <FormControl>
                                        <FormLabel fontWeight="600">Upload Images ({form.images.length}/{MAX_IMAGES})</FormLabel>
                                        <Input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageChange} isDisabled={submitting || form.images.length >= MAX_IMAGES} borderRadius="lg" py={1} />
                                        <Text fontSize="xs" color="gray.500" mt={1}>Max {MAX_IMAGES} images, 5MB each</Text>
                                    </FormControl>

                                    {imagePreviewError && (
                                        <Box bg="red.50" p={2} borderRadius="md" border="1px" borderColor="red.200">
                                            <Text color="red.600" fontSize="sm">{imagePreviewError}</Text>
                                        </Box>
                                    )}

                                    {form.images.length > 0 && (
                                        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3} mt={2}>
                                            {form.images.map((img, idx) => (
                                                <Box key={idx} pos="relative" borderRadius="lg" overflow="hidden" bg="gray.100" boxShadow="sm">
                                                    {isBase64(img) ? (
                                                        <ChakraImage src={img} alt={`Preview ${idx + 1}`} w="100%" h="140px" objectFit="cover" transition="transform 220ms" _hover={{ transform: 'scale(1.03)' }} />
                                                    ) : (
                                                        <Box w="100%" h="140px" display="flex" alignItems="center" justifyContent="center" bg="gray.200">
                                                            <Text fontSize="xs" color="gray.500" textAlign="center">Image stored</Text>
                                                        </Box>
                                                    )}
                                                    <CloseButton pos="absolute" top={2} right={2} size="sm" bg="white" borderRadius="full" onClick={() => removeImage(idx)} isDisabled={submitting} boxShadow="sm" />
                                                </Box>
                                            ))}
                                        </SimpleGrid>
                                    )}
                                </VStack>
                            </Box>

                            {errors.form && (
                                <Box bg="red.50" p={3} borderRadius="md" border="1px" borderColor="red.200" w="full">
                                    <Text color="red.600" fontSize="sm">{errors.form}</Text>
                                </Box>
                            )}
                        </VStack>
                    </ModalBody>

                    <ModalFooter gap={3} borderTop="1px solid" borderColor={borderColor} bg={canvasBg}>
                        <Button variant="ghost" onClick={onClose} isDisabled={submitting}>Cancel</Button>
                        <Button colorScheme="blue" onClick={onSubmit} isLoading={submitting} loadingText="Saving..." fontWeight="600" borderRadius="full" px={8}>
                            {editingId ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose} isCentered>
                <AlertDialogOverlay backdropFilter="blur(5px)" bg="blackAlpha.400" />
                <AlertDialogContent borderRadius="2xl" boxShadow="2xl">
                    <AlertDialogHeader fontSize="lg" fontWeight="700">Delete Product?</AlertDialogHeader>
                    <AlertDialogBody>Are you sure you want to delete this product? This action cannot be undone.</AlertDialogBody>
                    <AlertDialogFooter gap={3}>
                        <Button ref={cancelRef} onClick={onDeleteClose} isDisabled={submitting}>Cancel</Button>
                        <Button colorScheme="red" onClick={confirmDelete} isLoading={submitting} loadingText="Deleting..." fontWeight="600" borderRadius="full" px={6}>Delete</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Footer />
        </Box>
    )
}
