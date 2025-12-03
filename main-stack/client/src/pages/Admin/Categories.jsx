import React, { useEffect, useState, useRef, useMemo } from 'react'
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
    AlertDialogContent,
    TableContainer,
    InputGroup,
    InputLeftElement,
    Select,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Icon,
    useColorModeValue,
    Skeleton,
    Flex,
    Stack,
    Tooltip,
} from '@chakra-ui/react'
import { DeleteIcon, EditIcon, AddIcon, SearchIcon } from '@chakra-ui/icons'
import { FiMoreVertical, FiChevronDown, FiFilter } from 'react-icons/fi'
import gsap from 'gsap'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import AdminSidebar from '../../components/AdminSidebar'
import * as categoriesApi from '../../api/categories'

/**
 * Utility: format date consistently
 */
function formatDate(dateStr) {
    try {
        const d = new Date(dateStr)
        return d.toLocaleDateString()
    } catch {
        return '-'
    }
}

export default function CategoriesPage() {
    const toast = useToast()
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({ name: '', description: '' })
    const [editingId, setEditingId] = useState(null)
    const [errors, setErrors] = useState({})

    const { isOpen, onOpen, onClose } = useDisclosure()
    const {
        isOpen: isDeleteOpen,
        onOpen: onDeleteOpen,
        onClose: onDeleteClose,
    } = useDisclosure()
    const [deleteId, setDeleteId] = useState(null)
    const cancelRef = useRef()
    const tableRef = useRef(null)

    // UI & theme tokens (top-level hooks)
    const pageBg = useColorModeValue('gray.50', 'gray.900')
    const cardBg = useColorModeValue('white', 'gray.800')
    const borderColor = useColorModeValue('gray.200', 'gray.700')
    const mutedText = useColorModeValue('gray.600', 'gray.300')
    const hoverBg = useColorModeValue('gray.50', 'gray.700')
    const tableHeadBg = useColorModeValue('gray.50', 'gray.800')
    // const searchBg = useColorModeValue('white', 'gray.700')

    // Controls: search, sort, page
    const [query, setQuery] = useState('')
    const [sortBy, setSortBy] = useState('created_desc') // created_desc, created_asc, name_asc, name_desc
    const [pageSize, setPageSize] = useState(10)
    const [page, setPage] = useState(1)

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Animate table rows when categories change
    useEffect(() => {
        if (tableRef.current && categories.length > 0) {
            const rows = tableRef.current.querySelectorAll('tbody tr')
            gsap.fromTo(rows, { opacity: 0, y: 8 }, { opacity: 1, y: 0, stagger: 0.03, duration: 0.28 })
        }
    }, [categories])

    async function fetchCategories() {
        setLoading(true)
        try {
            const res = await categoriesApi.listCategories(1000, 0) // fetch many then paginate client-side for snappy UI
            setCategories(res.data.categories || [])
        } catch (err) {
            console.error('Failed to fetch categories:', err)
            toast({ title: 'Failed to load categories', status: 'error', duration: 3000 })
            setCategories([])
        } finally {
            setLoading(false)
        }
    }

    function validate() {
        const e = {}
        if (!form.name || !form.name.trim()) e.name = 'Category name is required'
        if (form.name && form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
        return e
    }

    async function onSubmit(e) {
        e?.preventDefault?.()
        setErrors({})
        const val = validate()
        if (Object.keys(val).length) return setErrors(val)

        try {
            setSubmitting(true)
            if (editingId) {
                await categoriesApi.updateCategory(editingId, form)
                toast({ title: 'Category updated', status: 'success', duration: 2000 })
            } else {
                await categoriesApi.createCategory(form)
                toast({ title: 'Category created', status: 'success', duration: 2000 })
            }
            await fetchCategories()
            resetForm()
            onClose()
        } catch (err) {
            console.error('Failed to save category:', err)
            const payload = err?.response?.data
            if (payload?.errors && Array.isArray(payload.errors)) {
                const map = {}
                payload.errors.forEach((it) => (map[it.field || 'form'] = it.msg))
                setErrors(map)
            } else if (payload?.message) {
                setErrors({ form: payload.message })
            }
            toast({ title: 'Failed to save category', status: 'error', duration: 3000 })
        } finally {
            setSubmitting(false)
        }
    }

    function resetForm() {
        setForm({ name: '', description: '' })
        setErrors({})
        setEditingId(null)
    }

    function openAddModal() {
        resetForm()
        onOpen()
    }

    function openEditModal(cat) {
        setForm({ name: cat.name || '', description: cat.description || '' })
        setEditingId(cat.id)
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
            await categoriesApi.deleteCategory(deleteId)
            toast({ title: 'Category deleted', status: 'success', duration: 2000 })
            await fetchCategories()
            onDeleteClose()
        } catch (err) {
            console.error('Failed to delete category:', err)
            toast({ title: 'Failed to delete', status: 'error', duration: 3000 })
        } finally {
            setSubmitting(false)
        }
    }

    // Derived: filtered, sorted, paginated categories (useMemo for performance)
    const processed = useMemo(() => {
        const q = (query || '').trim().toLowerCase()
        let list = Array.isArray(categories) ? [...categories] : []

        // search
        if (q) {
            list = list.filter(
                (c) =>
                    (c.name || '').toLowerCase().includes(q) ||
                    (c.description || '').toLowerCase().includes(q)
            )
        }

        // sort
        switch (sortBy) {
            case 'created_asc':
                list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                break
            case 'created_desc':
                list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                break
            case 'name_asc':
                list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                break
            case 'name_desc':
                list.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
                break
            default:
                break
        }

        // pagination (client-side)
        const total = list.length
        const size = Number(pageSize) || 10
        const pages = Math.max(1, Math.ceil(total / size))
        const current = Math.min(Math.max(1, page), pages)
        const start = (current - 1) * size
        const pageItems = list.slice(start, start + size)

        return {
            total,
            pages,
            current,
            items: pageItems,
        }
    }, [categories, query, sortBy, pageSize, page])

    // keep page in range when total or pageSize changes
    useEffect(() => {
        if (page > processed.pages) setPage(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processed.pages])

    return (
        <Box minH="100vh" bg={pageBg} display="flex" flexDirection="column" w='100vw'>
            <Navbar />
            <Flex
                as="main"
                gap={6}
                align="flex-start"
                w="full"
                maxW="container.xl"
                mx="auto"
                py={8}
                px={{ base: 4, md: 6 }}
            >
                {/* Sidebar (collapses visually on small screens) */}
                <Box display={{ base: 'none', md: 'block' }} minW="220px">
                    <AdminSidebar />
                </Box>

                {/* Content */}
                <Box flex="1">
                    <HStack justify="space-between" align="start" mb={6} spacing={4} wrap="wrap">
                        <VStack align="start" spacing={1}>
                            <Heading size="lg">Product Categories</Heading>
                            <Text color={mutedText}>Create and manage product categories used across the store.</Text>
                        </VStack>

                        <HStack spacing={2}>
                            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={openAddModal} fontWeight="600">
                                Add Category
                            </Button>
                        </HStack>
                    </HStack>

                    {/* Toolbar: Search / Sort / Page size */}
                    <Box mb={4} bg={cardBg} p={4} borderRadius="md" border="1px" borderColor={borderColor} boxShadow="sm">
                        <Flex direction={{ base: 'column', md: 'row' }} gap={3} align="center" justify="space-between">
                            <HStack spacing={3} flex="1" minW={0}>
                                <InputGroup>
                                    <InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.400" />} />
                                    <Input
                                        placeholder="Search categories by name or description..."
                                        value={query}
                                        onChange={(e) => {
                                            setQuery(e.target.value)
                                            setPage(1)
                                        }}
                                        bg={useColorModeValue('white', 'gray.700')}
                                        _placeholder={{ color: 'gray.400' }}
                                    />
                                </InputGroup>

                                <Select
                                    w="220px"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    icon={<FiFilter />}
                                >
                                    <option value="created_desc">Newest first</option>
                                    <option value="created_asc">Oldest first</option>
                                    <option value="name_asc">Name A → Z</option>
                                    <option value="name_desc">Name Z → A</option>
                                </Select>

                                <Select
                                    w="120px"
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value))
                                        setPage(1)
                                    }}
                                >
                                    <option value={5}>5 / page</option>
                                    <option value={10}>10 / page</option>
                                    <option value={20}>20 / page</option>
                                </Select>
                            </HStack>

                            <HStack spacing={3}>
                                <Text color="gray.500" fontSize="sm">
                                    {processed.total} categories
                                </Text>

                                <Menu>
                                    <MenuButton as={IconButton} icon={<FiChevronDown />} aria-label="view options" />
                                    <MenuList>
                                        <MenuItem onClick={() => { setQuery(''); setSortBy('created_desc'); setPageSize(10); }}>Reset filters</MenuItem>
                                    </MenuList>
                                </Menu>
                            </HStack>
                        </Flex>
                    </Box>

                    {/* Table / Empty / Skeleton */}
                    <Box bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor} boxShadow="sm" overflow="hidden" ref={tableRef}>
                        {loading ? (
                            <Box p={6}>
                                <Stack spacing={3}>
                                    <Skeleton height="20px" />
                                    <Skeleton height="20px" />
                                    <Skeleton height="20px" />
                                </Stack>
                            </Box>
                        ) : processed.total === 0 ? (
                            <Box p={8} textAlign="center">
                                <Heading size="sm" mb={2} color="gray.600">No categories found</Heading>
                                <Text mb={4} color="gray.500">Create your first category to organize products.</Text>
                                <Button colorScheme="blue" onClick={openAddModal}>Create Category</Button>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table variant="simple">
                                    <Thead bg={tableHeadBg} position="sticky" top={0} zIndex={2}>
                                        <Tr>
                                            <Th fontWeight="700" color="white.700">Name</Th>
                                            <Th fontWeight="700" color="white.700">Description</Th>
                                            <Th fontWeight="700" color="white.700">Created</Th>
                                            <Th fontWeight="700" color="white.700" textAlign="center">Actions</Th>
                                        </Tr>
                                    </Thead>

                                    <Tbody>
                                        {processed.items.map((cat) => (
                                            <Tr key={cat.id} _hover={{ bg: hoverBg }} transition="background 0.18s">
                                                <Td>
                                                    <VStack align="start" spacing={0}>
                                                        <Text fontWeight="600" color="red.500">{cat.name}</Text>
                                                        <HStack spacing={2}>
                                                            <Badge colorScheme="gray" variant="subtle" fontSize="xs">
                                                                {cat.product_count ?? '—'} products
                                                            </Badge>
                                                            {cat.is_active === false && (
                                                                <Badge colorScheme="red" variant="subtle" fontSize="xs">
                                                                    Disabled
                                                                </Badge>
                                                            )}
                                                        </HStack>
                                                    </VStack>
                                                </Td>

                                                <Td>
                                                    <Text color="gray.600" fontSize="sm" noOfLines={2}>
                                                        {cat.description || '-'}
                                                    </Text>
                                                </Td>

                                                <Td>
                                                    <Text color="gray.500" fontSize="sm">{formatDate(cat.created_at)}</Text>
                                                </Td>

                                                <Td>
                                                    <HStack justify="center" spacing={1}>
                                                        <Tooltip label="Edit">
                                                            <IconButton
                                                                aria-label="Edit"
                                                                icon={<EditIcon />}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="blue"
                                                                onClick={() => openEditModal(cat)}
                                                            />
                                                        </Tooltip>

                                                        <Tooltip label="Delete">
                                                            <IconButton
                                                                aria-label="Delete"
                                                                icon={<DeleteIcon />}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="red"
                                                                onClick={() => openDeleteDialog(cat.id)}
                                                            />
                                                        </Tooltip>

                                                        <Menu>
                                                            <MenuButton
                                                                as={IconButton}
                                                                size="sm"
                                                                variant="ghost"
                                                                aria-label="more"
                                                                icon={<FiMoreVertical />}
                                                            />
                                                            <MenuList>
                                                                <MenuItem onClick={() => toast({ title: 'Details coming soon', status: 'info' })}>
                                                                    View details
                                                                </MenuItem>
                                                                <MenuItem onClick={() => toast({ title: 'Toggled state', status: 'success' })}>
                                                                    Toggle active
                                                                </MenuItem>
                                                            </MenuList>
                                                        </Menu>
                                                    </HStack>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </TableContainer>

                        )}
                    </Box>

                    {/* Pagination footer */}
                    {processed.total > 0 && (
                        <Flex justify="space-between" align="center" mt={4} px={2}>
                            <Text color="gray.500" fontSize="sm">
                                Showing {(processed.current - 1) * pageSize + 1} - {Math.min(processed.current * pageSize, processed.total)} of {processed.total}
                            </Text>

                            <HStack spacing={2}>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    isDisabled={processed.current === 1}
                                >
                                    Prev
                                </Button>
                                <Text fontSize="sm">Page {processed.current} / {processed.pages}</Text>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setPage((p) => Math.min(processed.pages, p + 1))}
                                    isDisabled={processed.current === processed.pages}
                                >
                                    Next
                                </Button>
                            </HStack>
                        </Flex>
                    )}
                </Box>
            </Flex>

            {/* Add / Edit Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
                <ModalOverlay backdropFilter="blur(4px)" />
                <ModalContent borderRadius="xl" bg={cardBg}>
                    <ModalHeader fontSize="lg" fontWeight="700">{editingId ? 'Edit Category' : 'Add Category'}</ModalHeader>
                    <ModalCloseButton isDisabled={submitting} />
                    <ModalBody as="form" pb={4} onSubmit={onSubmit}>
                        <VStack spacing={4}>
                            <FormControl isInvalid={!!errors.name} isRequired>
                                <FormLabel fontWeight="600">Name</FormLabel>
                                <Input
                                    placeholder="e.g., Electronics"
                                    value={form.name}
                                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                                    isDisabled={submitting}
                                    borderRadius="md"
                                />
                                {errors.name && <Text color="red.500" fontSize="sm">{errors.name}</Text>}
                            </FormControl>

                            <FormControl>
                                <FormLabel fontWeight="600">Description (optional)</FormLabel>
                                <Textarea
                                    placeholder="Short description"
                                    value={form.description}
                                    onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                                    rows={3}
                                    isDisabled={submitting}
                                    borderRadius="md"
                                    resize="vertical"
                                />
                            </FormControl>

                            {errors.form && <Text color="red.500">{errors.form}</Text>}
                        </VStack>
                    </ModalBody>

                    <ModalFooter gap={3}>
                        <Button variant="ghost" onClick={onClose} isDisabled={submitting}>Cancel</Button>
                        <Button colorScheme="blue" onClick={onSubmit} isLoading={submitting} loadingText="Saving..." fontWeight="600">
                            {editingId ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete confirmation */}
            <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose} isCentered>
                <AlertDialogOverlay backdropFilter="blur(4px)" />
                <AlertDialogContent borderRadius="xl" bg={cardBg}>
                    <AlertDialogHeader fontSize="lg" fontWeight="700">Delete Category</AlertDialogHeader>
                    <AlertDialogBody>Are you sure you want to delete this category? This action cannot be undone.</AlertDialogBody>
                    <AlertDialogFooter gap={3}>
                        <Button ref={cancelRef} onClick={onDeleteClose} isDisabled={submitting}>Cancel</Button>
                        <Button colorScheme="red" onClick={confirmDelete} isLoading={submitting} loadingText="Deleting...">Delete</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Footer />
        </Box>
    )
}
