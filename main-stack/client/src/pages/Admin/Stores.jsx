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
    useToast,
    Input,
    Spinner,
    TableContainer,
    SimpleGrid,
    useColorModeValue,
    Flex,
    Divider,
    Badge,
    InputGroup,
    InputLeftElement,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    FormControl,
    FormLabel,
    Textarea,
    Select,
    NumberInput,
    NumberInputField,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertDialogContent,
} from '@chakra-ui/react'
import { SearchIcon, AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import AdminSidebar from '../../components/AdminSidebar'
import * as adminApi from '../../api/admin'

export default function StoresPage() {
    const toast = useToast()
    const { isOpen, onOpen, onClose } = useDisclosure()
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
    const cancelDeleteRef = useRef()

    const pageBg = useColorModeValue('gray.50', 'gray.900')
    const subtleCard = useColorModeValue('white', 'gray.800')
    const mutedText = useColorModeValue('gray.600', 'gray.300')
    const borderColor = useColorModeValue('gray.100', 'gray.700')
    const accent = useColorModeValue('blue.600', 'blue.300')
    const tableStripe = useColorModeValue('white', 'gray.800')
    const hoverBg = useColorModeValue('gray.50', 'gray.700')
    const tableHeadBg = useColorModeValue('white', 'gray.800')

    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [filters, setFilters] = useState({
        search: '',
        is_active: '',
        sort: 'created_at',
        order: 'desc',
    })

    // Owners (store managers) for owner select
    const [managers, setManagers] = useState([])

    async function fetchManagers() {
        try {
            const res = await adminApi.getStoreManagersSimple(true)
            setManagers(res?.data?.managers || [])
        } catch (err) {
            console.error('Failed to fetch store managers for owner select', err)
            setManagers([])
        }
    }
    const [limit] = useState(12)
    const [offset, setOffset] = useState(0)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        owner_id: '',
        rating: '',
        is_active: true,
    })
    const [formErrors, setFormErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [deleteId, setDeleteId] = useState(null)

    useEffect(() => {
        fetchStores()
        fetchManagers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, offset, limit])

    async function fetchStores() {
        setLoading(true)
        try {
            const res = await adminApi.getStores(limit, offset, filters)
            setStores(res.data.stores || [])
            setTotal(res.data.total || 0)
        } catch (err) {
            console.error('Failed to fetch stores:', err)
            toast({ title: 'Failed to load stores', status: 'error', duration: 3000 })
            setStores([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (key, value) => {
        setOffset(0)
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const handleFormChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const handleRatingChange = (value) => {
        setFormData((prev) => ({ ...prev, rating: value }))
        if (formErrors.rating) {
            setFormErrors((prev) => ({ ...prev, rating: '' }))
        }
    }

    const validateForm = () => {
        const errors = {}
        if (!formData.name.trim()) errors.name = 'Store name is required'
        if (!formData.address.trim()) errors.address = 'Store address is required'
        if (formData.rating && (parseFloat(formData.rating) < 1 || parseFloat(formData.rating) > 5)) {
            errors.rating = 'Rating must be between 1 and 5'
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            phone: '',
            owner_id: '',
            rating: '',
            is_active: true,
        })
        setFormErrors({})
        setEditingId(null)
    }

    const handleOpenModal = (store = null) => {
        if (store) {
            setFormData({
                name: store.name || '',
                address: store.address || '',
                phone: store.phone || '',
                owner_id: store.owner_id || '',
                rating: store.rating || '',
                is_active: store.is_active !== undefined ? store.is_active : true,
            })
            setEditingId(store.id)
        } else {
            resetForm()
        }
        onOpen()
    }

    const handleCloseModal = () => {
        resetForm()
        onClose()
    }

    const handleSubmitStore = async () => {
        if (!validateForm()) return

        try {
            setIsSubmitting(true)

            const payload = {
                ...formData,
                rating: formData.rating ? parseFloat(formData.rating) : null,
                owner_id: formData.owner_id || null,
                phone: formData.phone || null,
            }

            if (editingId) {
                await adminApi.updateStore(editingId, payload)
                toast({
                    title: 'Success',
                    description: 'Store updated successfully!',
                    status: 'success',
                    duration: 3000,
                })
            } else {
                await adminApi.createStore(payload)
                toast({
                    title: 'Success',
                    description: 'Store created successfully!',
                    status: 'success',
                    duration: 3000,
                })
            }

            handleCloseModal()
            fetchStores()
        } catch (err) {
            console.error('Failed to save store:', err)
            const errorMsg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || err?.message || 'Failed to save store'
            toast({
                title: 'Error',
                description: errorMsg,
                status: 'error',
                duration: 3000,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteClick = (storeId) => {
        setDeleteId(storeId)
        onDeleteOpen()
    }

    const handleDeleteStore = async () => {
        if (!deleteId) return

        try {
            await adminApi.deleteStore(deleteId)
            toast({
                title: 'Success',
                description: 'Store deleted successfully!',
                status: 'success',
                duration: 3000,
            })
            onDeleteClose()
            setDeleteId(null)
            fetchStores()
        } catch (err) {
            console.error('Failed to delete store:', err)
            const errorMsg = err?.response?.data?.message || err?.message || 'Failed to delete store'
            toast({
                title: 'Error',
                description: errorMsg,
                status: 'error',
                duration: 3000,
            })
            onDeleteClose()
            setDeleteId(null)
        }
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
                                    <Heading size="lg">Manage Stores</Heading>
                                    <Text color={mutedText} fontSize="sm">
                                        Add, edit, and manage store information.
                                    </Text>
                                </VStack>
                                <Button
                                    leftIcon={<AddIcon />}
                                    colorScheme="blue"
                                    size="sm"
                                    onClick={() => handleOpenModal()}
                                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                    transition="all 0.2s"
                                >
                                    Add Store
                                </Button>
                            </Flex>

                            <Divider mb={5} />

                            {/* Filters */}
                            <HStack spacing={4} mb={6} wrap="wrap">
                                <InputGroup size="md" maxW="300px">
                                    <InputLeftElement pointerEvents="none">
                                        <SearchIcon color={mutedText} />
                                    </InputLeftElement>
                                    <Input
                                        placeholder="Search stores..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        bg={useColorModeValue('white', 'gray.700')}
                                        borderColor={borderColor}
                                    />
                                </InputGroup>

                                <Select
                                    placeholder="All Status"
                                    value={filters.is_active}
                                    onChange={(e) => handleFilterChange('is_active', e.target.value)}
                                    maxW="150px"
                                    bg={useColorModeValue('white', 'gray.700')}
                                    borderColor={borderColor}
                                >
                                    <option selected>--select status--</option>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </Select>

                                <Select
                                    value={filters.sort}
                                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                                    maxW="150px"
                                    bg={useColorModeValue('white', 'gray.700')}
                                    borderColor={borderColor}
                                >
                                    <option value="created_at">Date</option>
                                    <option value="name">Name</option>
                                    <option value="rating">Rating</option>
                                </Select>

                                <Select
                                    value={filters.order}
                                    onChange={(e) => handleFilterChange('order', e.target.value)}
                                    maxW="120px"
                                    bg={useColorModeValue('white', 'gray.700')}
                                    borderColor={borderColor}
                                >
                                    <option value="desc">Desc</option>
                                    <option value="asc">Asc</option>
                                </Select>
                            </HStack>

                            {/* Table */}
                            {loading ? (
                                <Box textAlign="center" py={12}>
                                    <Spinner size="xl" thickness="4px" color={accent} />
                                    <Text mt={4} color={mutedText} fontSize="sm">
                                        Loading stores...
                                    </Text>
                                </Box>
                            ) : stores.length === 0 ? (
                                <Box
                                    borderRadius="2xl"
                                    textAlign="center"
                                    border="1px dashed"
                                    borderColor={borderColor}
                                    py={10}
                                    px={6}
                                >
                                    <Heading size="sm" color="gray.700" mb={2}>
                                        No stores found
                                    </Heading>
                                </Box>
                            ) : (
                                <>
                                    <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor={borderColor} bg={tableStripe}>
                                        <TableContainer maxH="62vh" overflowY="auto">
                                            <Table variant="simple" size="sm">
                                                <Thead position="sticky" top={0} zIndex={1} bg={tableHeadBg}>
                                                    <Tr>
                                                        <Th fontWeight="700">Name</Th>
                                                        <Th fontWeight="700">Address</Th>
                                                        <Th fontWeight="700">Phone</Th>
                                                        <Th fontWeight="700" textAlign="center">Status</Th>
                                                        <Th fontWeight="700" isNumeric>Rating</Th>
                                                        <Th fontWeight="700" textAlign="center">Actions</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {stores.map((store, idx) => (
                                                        <Tr
                                                            key={store.id}
                                                            borderBottom="1px"
                                                            borderColor={borderColor}
                                                            bg={idx % 2 === 0 ? 'transparent' : tableStripe}
                                                            _hover={{ bg: hoverBg }}
                                                        >
                                                            <Td fontWeight="600">{store.name}</Td>
                                                            <Td fontSize="sm" color={mutedText} maxW="300px" isTruncated>
                                                                {store.address || '-'}
                                                            </Td>
                                                            <Td fontSize="sm" color={mutedText}>{store.phone || '-'}</Td>
                                                            <Td textAlign="center">
                                                                <Badge colorScheme={store.is_active ? 'green' : 'red'} borderRadius="full" px={3} py={0.5}>
                                                                    {store.is_active ? 'Active' : 'Inactive'}
                                                                </Badge>
                                                            </Td>
                                                            <Td isNumeric fontSize="sm" color={mutedText}>
                                                                {store.rating ? `${store.rating}/5` : '-'}
                                                            </Td>
                                                            <Td textAlign="center">
                                                                <HStack spacing={2} justify="center">
                                                                    <IconButton
                                                                        icon={<EditIcon />}
                                                                        size="sm"
                                                                        colorScheme="blue"
                                                                        variant="ghost"
                                                                        onClick={() => handleOpenModal(store)}
                                                                        aria-label="Edit store"
                                                                    />
                                                                    <IconButton
                                                                        icon={<DeleteIcon />}
                                                                        size="sm"
                                                                        colorScheme="red"
                                                                        variant="ghost"
                                                                        onClick={() => handleDeleteClick(store.id)}
                                                                        aria-label="Delete store"
                                                                    />
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

            {/* Add/Edit Store Modal */}
            <Modal isOpen={isOpen} onClose={handleCloseModal} size="lg" isCentered>
                <ModalOverlay backdropFilter="blur(10px)" />
                <ModalContent bg={subtleCard} border="1px solid" borderColor={borderColor}>
                    <ModalHeader>
                        <Heading size="md">{editingId ? 'Edit Store' : 'Add New Store'}</Heading>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isInvalid={!!formErrors.name} isRequired>
                                <FormLabel fontSize="sm">Store Name</FormLabel>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    placeholder="Store name"
                                    borderColor={borderColor}
                                    _focus={{ borderColor: accent }}
                                />
                                {formErrors.name && (
                                    <Text color="red.400" fontSize="xs" mt={1}>
                                        {formErrors.name}
                                    </Text>
                                )}
                            </FormControl>

                            <FormControl isInvalid={!!formErrors.address} isRequired>
                                <FormLabel fontSize="sm">Address</FormLabel>
                                <Textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleFormChange}
                                    placeholder="Store address"
                                    borderColor={borderColor}
                                    _focus={{ borderColor: accent }}
                                    rows={3}
                                />
                                {formErrors.address && (
                                    <Text color="red.400" fontSize="xs" mt={1}>
                                        {formErrors.address}
                                    </Text>
                                )}
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm">Phone Number</FormLabel>
                                <Input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleFormChange}
                                    placeholder="Phone number (optional)"
                                    borderColor={borderColor}
                                    _focus={{ borderColor: accent }}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm">Owner</FormLabel>
                                <Select
                                    name="owner_id"
                                    value={formData.owner_id}
                                    onChange={handleFormChange}
                                    placeholder="Select owner (optional)"
                                    borderColor={borderColor}
                                    _focus={{ borderColor: accent }}
                                >
                                    {/* options populated dynamically */}
                                    {managers.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </Select>
                            </FormControl>

                            <HStack spacing={4} w="100%">
                                <FormControl isInvalid={!!formErrors.rating}>
                                    <FormLabel fontSize="sm">Rating (1-5)</FormLabel>
                                    <NumberInput
                                        value={formData.rating}
                                        onChange={handleRatingChange}
                                        min={1}
                                        max={5}
                                        precision={1}
                                        step={0.1}
                                    >
                                        <NumberInputField
                                            borderColor={borderColor}
                                            _focus={{ borderColor: accent }}
                                            placeholder="Rating (optional)"
                                        />
                                    </NumberInput>
                                    {formErrors.rating && (
                                        <Text color="red.400" fontSize="xs" mt={1}>
                                            {formErrors.rating}
                                        </Text>
                                    )}
                                </FormControl>

                                <FormControl>
                                    <FormLabel fontSize="sm">Status</FormLabel>
                                    <Select
                                        name="is_active"
                                        value={formData.is_active}
                                        onChange={handleFormChange}
                                        borderColor={borderColor}
                                        _focus={{ borderColor: accent }}
                                    >
                                        <option selected>--select status--</option>
                                        <option value={true}>Active</option>
                                        <option value={false}>Inactive</option>
                                    </Select>
                                </FormControl>
                            </HStack>
                        </VStack>
                    </ModalBody>

                    <ModalFooter gap={3}>
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleSubmitStore}
                            isLoading={isSubmitting}
                            loadingText={editingId ? 'Updating...' : 'Adding...'}
                        >
                            {editingId ? 'Update Store' : 'Add Store'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                isOpen={isDeleteOpen}
                leastDestructiveRef={cancelDeleteRef}
                onClose={onDeleteClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete Store
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to delete this store? This action cannot be undone.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelDeleteRef} onClick={onDeleteClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={handleDeleteStore} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            <Footer />
        </Box>
    )
}

