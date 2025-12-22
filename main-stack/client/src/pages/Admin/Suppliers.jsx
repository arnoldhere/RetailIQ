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
    Tooltip,
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
    IconButton,
} from '@chakra-ui/react'
import { SearchIcon, AddIcon } from '@chakra-ui/icons'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import AdminSidebar from '../../components/AdminSidebar'
import * as adminApi from '../../api/admin'
import { DeleteIcon, EditIcon } from '@chakra-ui/icons'
export default function SuppliersPage() {
    const toast = useToast()
    const { isOpen, onOpen, onClose } = useDisclosure()
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()

    const handleAddSupplierOpen = () => { setEditingSupplierId(null); setFormData({ firstname: '', lastname: '', email: '', phone: '', password: '' }); onOpen() }

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

    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [filters, setFilters] = useState({
        search: '',
    })
    const [limit] = useState(12)
    const [offset, setOffset] = useState(0)

    // Form state for adding supplier
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        password: '',
    })
    const [formErrors, setFormErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingSupplierId, setEditingSupplierId] = useState(null)
    const [deleteSupplierId, setDeleteSupplierId] = useState(null)

    useEffect(() => {
        fetchSuppliers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, offset, limit])

    async function fetchSuppliers() {
        setLoading(true)
        try {
            const res = await adminApi.getSuppliers(limit, offset, filters)
            setSuppliers(res.data.suppliers || [])
            setTotal(res.data.total || 0)
        } catch (err) {
            console.error('Failed to fetch suppliers:', err)
            toast({ title: 'Failed to load suppliers', status: 'error', duration: 3000 })
            setSuppliers([])
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

    const validateForm = () => {
        const errors = {}
        if (!formData.firstname.trim()) errors.firstname = 'First name is required'
        if (!formData.lastname.trim()) errors.lastname = 'Last name is required'
        if (!formData.email.trim()) errors.email = 'Email is required'
        if (formData.email && !formData.email.includes('@')) errors.email = 'Invalid email'
        if (!formData.phone.trim()) errors.phone = 'Phone is required'
        if (formData.phone.trim().length < 7) errors.phone = 'Invalid phone number'
        if (!formData.password || formData.password.length < 8) errors.password = 'Password must be at least 8 characters'

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmitSupplier = async () => {
        if (!validateForm()) return

        try {
            setIsSubmitting(true)
            if (editingSupplierId) {
                await adminApi.updateSupplier(editingSupplierId, formData)
                toast({ title: 'Success', description: 'Supplier updated successfully!', status: 'success', duration: 3000, isClosable: true })
            } else {
                await adminApi.createSupplier(formData)
                toast({ title: 'Success', description: 'Supplier added successfully!', status: 'success', duration: 3000, isClosable: true })
            }

            // Reset form and close modal
            setFormData({ firstname: '', lastname: '', email: '', phone: '', password: '' })
            setFormErrors({})
            setEditingSupplierId(null)
            onClose()

            // Refresh suppliers list
            fetchSuppliers()
        } catch (err) {
            console.error('Failed to save supplier:', err)
            const errorMsg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || err?.message || 'Failed to save supplier'
            toast({ title: 'Error', description: errorMsg, status: 'error', duration: 3000, isClosable: true })
        } finally {
            setIsSubmitting(false)
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
                                    <HStack spacing={3}>
                                        <Heading size="lg">Suppliers</Heading>
                                    </HStack>
                                    <Text color={mutedText} fontSize="sm">
                                        Manage supplier information and relationships.
                                    </Text>
                                </VStack>
                                <Button
                                    leftIcon={<AddIcon />}
                                    colorScheme="blue"
                                    size="sm"
                                    onClick={handleAddSupplierOpen}
                                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                    transition="all 0.2s"
                                >
                                    Add Supplier
                                </Button>
                            </Flex>

                            <Divider mb={5} />

                            {/* Search Bar */}
                            <Box mb={6}>
                                <InputGroup size="md" maxW="400px">
                                    <InputLeftElement pointerEvents="none">
                                        <SearchIcon color={mutedText} />
                                    </InputLeftElement>
                                    <Input
                                        placeholder="Search suppliers..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        bg={useColorModeValue('white', 'gray.700')}
                                        borderColor={borderColor}
                                        _focus={{
                                            borderColor: accent,
                                            boxShadow: `0 0 0 1px ${accent}`,
                                        }}
                                        borderRadius="lg"
                                    />
                                </InputGroup>
                            </Box>

                            {/* Table */}
                            {loading ? (
                                <Box textAlign="center" py={12} display="flex" flexDirection="column" alignItems="center">
                                    <Spinner size="xl" thickness="4px" color={accent} />
                                    <Text mt={4} color={mutedText} fontSize="sm">
                                        Loading suppliers...
                                    </Text>
                                </Box>
                            ) : suppliers.length === 0 ? (
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
                                        No suppliers found
                                    </Heading>
                                </Box>
                            ) : (
                                <>
                                    <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor={borderColor} bg={tableStripe}>
                                        <TableContainer maxH="62vh" overflowY="auto">
                                            <Table variant="simple" size="sm">
                                                <Thead position="sticky" top={0} zIndex={1} bg={tableHeadBg}>
                                                    <Tr>
                                                        <Th fontWeight="700" color="white.700">Name</Th>
                                                        <Th fontWeight="700" color="white.700">Email</Th>
                                                        <Th fontWeight="700" color="white.700">Phone</Th>
                                                        <Th fontWeight="700" color="white.700">Address</Th>
                                                        <Th fontWeight="700" color="white.700" textAlign="center">Status</Th>
                                                        <Th fontWeight="700" color="white.700" isNumeric>Rating</Th>
                                                        <Th fontWeight="700" color="white.700" textAlign="center">Actions</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {suppliers.map((supplier, idx) => (
                                                        <Tr
                                                            key={supplier.id}
                                                            borderBottom="1px"
                                                            borderColor={borderColor}
                                                            bg={idx % 2 === 0 ? 'transparent' : tableStripe}
                                                            _hover={{ bg: hoverBg, transform: 'translateY(-1px)', boxShadow: 'sm' }}
                                                            transition="all 0.15s ease-out"
                                                        >
                                                            <Td fontWeight="600" color="white.800">{supplier.name}</Td>
                                                            <Td fontSize="sm" color={mutedText}>{supplier.email || '-'}</Td>
                                                            <Td fontSize="sm" color={mutedText}>{supplier.phone || '-'}</Td>
                                                            <Td fontSize="sm" color={mutedText} maxW="300px" isTruncated>{supplier.address || '-'}</Td>
                                                            <Td textAlign="center">
                                                                <Badge colorScheme={supplier.is_active ? 'green' : 'red'} borderRadius="full" px={3} py={0.5}>
                                                                    {supplier.is_active ? 'Active' : 'Inactive'}
                                                                </Badge>
                                                            </Td>
                                                            <Td isNumeric fontSize="sm" color={mutedText}>
                                                                {supplier.rating ? `${supplier.rating}/5` : '-'}
                                                            </Td>
                                                            <Td textAlign="center">
                                                                <HStack justify="center">
                                                                    <Tooltip label="Edit">
                                                                        <IconButton aria-label="Edit supplier"
                                                                            icon={<EditIcon />} size="sm"
                                                                            variant="ghost"
                                                                            colorScheme="info"
                                                                            onClick={() => { setEditingSupplierId(supplier.id); setFormData({ firstname: supplier.name.split(' ')[0] || '', lastname: supplier.name.split(' ').slice(1).join(' ') || '', email: supplier.email || '', phone: supplier.phone || '', password: '' }); onOpen() }} />
                                                                    </Tooltip>
                                                                    <Tooltip label="Delete">
                                                                        <IconButton
                                                                            variant="ghost"
                                                                            colorScheme="red"
                                                                            aria-label="Delete supplier" icon={<DeleteIcon />} size="sm" onClick={() => { setDeleteSupplierId(supplier.id); onDeleteOpen() }} />
                                                                    </Tooltip>
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

                                    {/* Delete confirmation */}
                                    <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
                                        <ModalOverlay />
                                        <ModalContent>
                                            <ModalHeader>Delete Supplier</ModalHeader>
                                            <ModalCloseButton />
                                            <ModalBody>Are you sure you want to delete this supplier? This action cannot be undone.</ModalBody>
                                            <ModalFooter>
                                                <Button variant="ghost" onClick={onDeleteClose}>Cancel</Button>
                                                <Button colorScheme="red" onClick={async () => {
                                                    try {
                                                        await adminApi.deleteSupplier(deleteSupplierId)
                                                        toast({ title: 'Deleted', status: 'success' })
                                                        onDeleteClose()
                                                        setDeleteSupplierId(null)
                                                        fetchSuppliers()
                                                    } catch (err) {
                                                        console.error('Failed to delete supplier', err)
                                                        toast({ title: 'Error', description: err?.response?.data?.message || err?.message || 'Failed to delete', status: 'error' })
                                                        onDeleteClose()
                                                    }
                                                }}>Delete</Button>
                                            </ModalFooter>
                                        </ModalContent>
                                    </Modal>

                                </>
                            )}
                        </Box>
                    </SimpleGrid>
                </Box>
            </Box>

            {/* Add Supplier Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
                <ModalOverlay backdropFilter="blur(10px)" />
                <ModalContent bg={subtleCard} border="1px solid" borderColor={borderColor}>
                    <ModalHeader>
                        <Heading size="md">{editingSupplierId ? 'Edit Supplier' : 'Add New Supplier'}</Heading>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <HStack spacing={4} w="100%">
                                <FormControl isInvalid={!!formErrors.firstname}>
                                    <FormLabel fontSize="sm">First Name</FormLabel>
                                    <Input
                                        name="firstname"
                                        value={formData.firstname}
                                        onChange={handleFormChange}
                                        placeholder="First name"
                                        borderColor={borderColor}
                                        _focus={{ borderColor: accent }}
                                    />
                                    {formErrors.firstname && (
                                        <Text color="red.400" fontSize="xs" mt={1}>
                                            {formErrors.firstname}
                                        </Text>
                                    )}
                                </FormControl>
                                <FormControl isInvalid={!!formErrors.lastname}>
                                    <FormLabel fontSize="sm">Last Name</FormLabel>
                                    <Input
                                        name="lastname"
                                        value={formData.lastname}
                                        onChange={handleFormChange}
                                        placeholder="Last name"
                                        borderColor={borderColor}
                                        _focus={{ borderColor: accent }}
                                    />
                                    {formErrors.lastname && (
                                        <Text color="red.400" fontSize="xs" mt={1}>
                                            {formErrors.lastname}
                                        </Text>
                                    )}
                                </FormControl>
                            </HStack>

                            <FormControl isInvalid={!!formErrors.email} w="100%">
                                <FormLabel fontSize="sm">Email Address</FormLabel>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleFormChange}
                                    placeholder="supplier@example.com"
                                    borderColor={borderColor}
                                    _focus={{ borderColor: accent }}
                                />
                                {formErrors.email && (
                                    <Text color="red.400" fontSize="xs" mt={1}>
                                        {formErrors.email}
                                    </Text>
                                )}
                            </FormControl>

                            <FormControl isInvalid={!!formErrors.phone} w="100%">
                                <FormLabel fontSize="sm">Phone Number</FormLabel>
                                <Input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleFormChange}
                                    placeholder="Phone number"
                                    borderColor={borderColor}
                                    _focus={{ borderColor: accent }}
                                />
                                {formErrors.phone && (
                                    <Text color="red.400" fontSize="xs" mt={1}>
                                        {formErrors.phone}
                                    </Text>
                                )}
                            </FormControl>

                            <FormControl isInvalid={!!formErrors.password} w="100%">
                                <FormLabel fontSize="sm">Password</FormLabel>
                                <Input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleFormChange}
                                    placeholder="Minimum 8 characters"
                                    borderColor={borderColor}
                                    _focus={{ borderColor: accent }}
                                />
                                {formErrors.password && (
                                    <Text color="red.400" fontSize="xs" mt={1}>
                                        {formErrors.password}
                                    </Text>
                                )}
                            </FormControl>
                        </VStack>
                    </ModalBody>

                    <ModalFooter gap={3}>
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleSubmitSupplier}
                            isLoading={isSubmitting}
                            loadingText={editingSupplierId ? 'Updating...' : 'Adding...'}
                        >
                            {editingSupplierId ? 'Update Supplier' : 'Add Supplier'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Footer />
        </Box>
    )
}

