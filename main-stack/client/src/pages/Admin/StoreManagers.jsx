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
    Select,
    IconButton,
} from '@chakra-ui/react'
import { SearchIcon, AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import AdminSidebar from '../../components/AdminSidebar'
import * as adminApi from '../../api/admin'

export default function StoreManagersPage() {
    const toast = useToast()
    const { isOpen, onOpen, onClose } = useDisclosure()
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()

    const pageBg = useColorModeValue('gray.50', 'gray.900')
    const subtleCard = useColorModeValue('white', 'gray.800')
    const mutedText = useColorModeValue('gray.600', 'gray.300')
    const borderColor = useColorModeValue('gray.100', 'gray.700')
    const accent = useColorModeValue('blue.600', 'blue.300')
    const tableStripe = useColorModeValue('white', 'gray.800')
    const hoverBg = useColorModeValue('gray.50', 'gray.700')
    const tableHeadBg = useColorModeValue('white', 'gray.800')

    const [managers, setManagers] = useState([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [filters, setFilters] = useState({ search: '', sort: 'created_at', order: 'desc' })
    const [limit] = useState(12)
    const [offset, setOffset] = useState(0)

    const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', phone: '', password: '' })
    const [formErrors, setFormErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [deleteId, setDeleteId] = useState(null)

    useEffect(() => { fetchManagers() }, [filters, offset, limit])

    async function fetchManagers() {
        setLoading(true)
        try {
            const res = await adminApi.getStoreManagers(limit, offset, filters)
            setManagers(res.data.managers || [])
            setTotal(res.data.total || 0)
        } catch (err) {
            console.error('Failed to fetch store managers:', err)
            toast({ title: 'Failed to load store managers', status: 'error', duration: 3000 })
            setManagers([])
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
        if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }

    const validateForm = () => {
        const errors = {}
        if (!formData.firstname.trim()) errors.firstname = 'First name is required'
        if (!formData.lastname.trim()) errors.lastname = 'Last name is required'
        if (!formData.email.trim()) errors.email = 'Email is required'
        if (formData.email && !formData.email.includes('@')) errors.email = 'Invalid email'
        if (!formData.phone.trim()) errors.phone = 'Phone is required'
        if (formData.phone.trim().length < 7) errors.phone = 'Invalid phone number'
        if (formData.password && formData.password.length > 0 && formData.password.length < 8) errors.password = 'Password must be at least 8 characters'
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleOpenModal = (m = null) => {
        if (m) {
            setFormData({ firstname: m.firstname || '', lastname: m.lastname || '', email: m.email || '', phone: m.phone || '', password: '' })
            setEditingId(m.id)
        } else {
            setFormData({ firstname: '', lastname: '', email: '', phone: '', password: '' })
            setEditingId(null)
        }
        onOpen()
    }

    const handleCloseModal = () => { setFormErrors({}); setEditingId(null); onClose() }

    const handleSubmit = async () => {
        if (!validateForm()) return
        try {
            setIsSubmitting(true)
            if (editingId) {
                await adminApi.updateStoreManager(editingId, formData)
                toast({ title: 'Updated', description: 'Store manager updated', status: 'success' })
            } else {
                await adminApi.createStoreManager(formData)
                toast({ title: 'Created', description: 'Store manager added', status: 'success' })
            }
            handleCloseModal()
            fetchManagers()
        } catch (err) {
            console.error('Failed to save manager', err)
            const errMsg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || err?.message || 'Failed'
            toast({ title: 'Error', description: errMsg, status: 'error' })
        } finally { setIsSubmitting(false) }
    }

    const handleDeleteClick = (id) => { setDeleteId(id); onDeleteOpen() }
    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await adminApi.deleteStoreManager(deleteId)
            toast({ title: 'Deleted', status: 'success' })
            onDeleteClose()
            setDeleteId(null)
            fetchManagers()
        } catch (err) {
            console.error('Failed to delete manager', err)
            const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete manager'
            toast({ title: 'Error', description: errMsg, status: 'error' })
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
                        <Box as="aside" display={{ base: 'none', lg: 'block' }} rounded="2xl" overflow="hidden" boxShadow="sm" bg={subtleCard} border="1px solid" borderColor={borderColor}>
                            <AdminSidebar />
                        </Box>

                        <Box gridColumn={{ base: '1 / -1', lg: 'span 4' }} bg={subtleCard} borderRadius="2xl" boxShadow="lg" border="1px solid" borderColor={borderColor} p={{ base: 4, md: 6 }}>
                            <Flex justify="space-between" align="flex-start" mb={6} wrap="wrap" gap={4}>
                                <VStack align="flex-start" spacing={1}>
                                    <Heading size="lg">Store Managers</Heading>
                                    <Text color={mutedText} fontSize="sm">Add, edit and manage store owners/managers.</Text>
                                </VStack>
                                <Button leftIcon={<AddIcon />} colorScheme="blue" size="sm" onClick={() => handleOpenModal()}>
                                    Add Manager
                                </Button>
                            </Flex>

                            <Divider mb={5} />

                            <HStack spacing={4} mb={6} wrap="wrap">
                                <InputGroup size="md" maxW="400px">
                                    <InputLeftElement pointerEvents="none"><SearchIcon color={mutedText} /></InputLeftElement>
                                    <Input placeholder="Search managers..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} bg={useColorModeValue('white', 'gray.700')} borderColor={borderColor} />
                                </InputGroup>

                                <Select value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)} maxW="150px" bg={useColorModeValue('white', 'gray.700')} borderColor={borderColor}>
                                    <option value="created_at">Date</option>
                                    <option value="firstname">First name</option>
                                    <option value="email">Email</option>
                                </Select>

                                <Select value={filters.order} onChange={(e) => handleFilterChange('order', e.target.value)} maxW="120px" bg={useColorModeValue('white', 'gray.700')} borderColor={borderColor}>
                                    <option value="desc">Desc</option>
                                    <option value="asc">Asc</option>
                                </Select>
                            </HStack>

                            {loading ? (
                                <Box textAlign="center" py={12}>
                                    <Spinner size="xl" thickness="4px" color={accent} />
                                    <Text mt={4} color={mutedText} fontSize="sm">Loading managers...</Text>
                                </Box>
                            ) : managers.length === 0 ? (
                                <Box borderRadius="2xl" textAlign="center" border="1px dashed" borderColor={borderColor} py={10} px={6}>
                                    <Heading size="sm" color="gray.700" mb={2}>No managers found</Heading>
                                </Box>
                            ) : (
                                <>
                                    <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor={borderColor} bg={tableStripe}>
                                        <TableContainer maxH="62vh" overflowY="auto">
                                            <Table variant="simple" size="sm">
                                                <Thead position="sticky" top={0} zIndex={1} bg={tableHeadBg}>
                                                    <Tr>
                                                        <Th fontWeight="700">Name</Th>
                                                        <Th fontWeight="700">Email</Th>
                                                        <Th fontWeight="700">Phone</Th>
                                                        <Th fontWeight="700" textAlign="center">Status</Th>
                                                        <Th fontWeight="700" textAlign="center">Actions</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {managers.map((m, idx) => (
                                                        <Tr key={m.id} borderBottom="1px" borderColor={borderColor} bg={idx % 2 === 0 ? 'transparent' : tableStripe} _hover={{ bg: hoverBg }} transition="all 0.15s ease-out">
                                                            <Td fontWeight="600">{`${m.firstname} ${m.lastname}`}</Td>
                                                            <Td fontSize="sm" color={mutedText}>{m.email || '-'}</Td>
                                                            <Td fontSize="sm" color={mutedText}>{m.phone || '-'}</Td>
                                                            <Td textAlign="center"><Badge colorScheme={m.is_active ? 'green' : 'red'}>{m.is_active ? 'Active' : 'Inactive'}</Badge></Td>
                                                            <Td textAlign="center">
                                                                <HStack justify="center">
                                                                    <IconButton aria-label="Edit" icon={<EditIcon />} size="sm" onClick={() => handleOpenModal(m)} />
                                                                    <IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" onClick={() => handleDeleteClick(m.id)} />
                                                                </HStack>
                                                            </Td>
                                                        </Tr>
                                                    ))}
                                                </Tbody>
                                            </Table>
                                        </TableContainer>
                                    </Box>

                                    {totalPages > 1 && (
                                        <Flex justify="center" gap={4} align="center" mt={6}>
                                            <Button variant="ghost" onClick={() => setOffset(Math.max(0, offset - limit))} isDisabled={offset === 0}>Previous</Button>
                                            <Text fontWeight="600" color={mutedText}>Page {currentPage} of {totalPages} ({total} total)</Text>
                                            <Button variant="ghost" onClick={() => setOffset(offset + limit)} isDisabled={currentPage === totalPages}>Next</Button>
                                        </Flex>
                                    )}
                                </>
                            )}
                        </Box>
                    </SimpleGrid>
                </Box>
            </Box>

            <Modal isOpen={isOpen} onClose={handleCloseModal} size="lg" isCentered>
                <ModalOverlay backdropFilter="blur(10px)" />
                <ModalContent bg={subtleCard} border="1px solid" borderColor={borderColor}>
                    <ModalHeader><Heading size="md">{editingId ? 'Edit Manager' : 'Add New Manager'}</Heading></ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <HStack spacing={4} w="100%">
                                <FormControl isInvalid={!!formErrors.firstname}><FormLabel fontSize="sm">First Name</FormLabel><Input name="firstname" value={formData.firstname} onChange={handleFormChange} placeholder="First name" borderColor={borderColor} _focus={{ borderColor: accent }} /></FormControl>
                                <FormControl isInvalid={!!formErrors.lastname}><FormLabel fontSize="sm">Last Name</FormLabel><Input name="lastname" value={formData.lastname} onChange={handleFormChange} placeholder="Last name" borderColor={borderColor} _focus={{ borderColor: accent }} /></FormControl>
                            </HStack>

                            <FormControl isInvalid={!!formErrors.email} w="100%"><FormLabel fontSize="sm">Email Address</FormLabel><Input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="manager@example.com" borderColor={borderColor} _focus={{ borderColor: accent }} /></FormControl>

                            <FormControl isInvalid={!!formErrors.phone}><FormLabel fontSize="sm">Phone Number</FormLabel><Input name="phone" value={formData.phone} onChange={handleFormChange} placeholder="Phone number" borderColor={borderColor} _focus={{ borderColor: accent }} /></FormControl>

                            <FormControl isInvalid={!!formErrors.password}><FormLabel fontSize="sm">Password (optional)</FormLabel><Input name="password" type="password" value={formData.password} onChange={handleFormChange} placeholder="Leave blank to use default 12345678" borderColor={borderColor} _focus={{ borderColor: accent }} /></FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter gap={3}><Button variant="ghost" onClick={handleCloseModal}>Cancel</Button><Button colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting}>{editingId ? 'Update' : 'Add Manager'}</Button></ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="md">
                <ModalOverlay backdropFilter="blur(6px)" />
                <ModalContent>
                    <ModalHeader>Delete Manager</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>Are you sure you want to delete this manager? This action cannot be undone.</ModalBody>
                    <ModalFooter><Button variant="ghost" onClick={onDeleteClose}>Cancel</Button><Button colorScheme="red" onClick={handleDelete}>Delete</Button></ModalFooter>
                </ModalContent>
            </Modal>

            <Footer />
        </Box>
    )
}
