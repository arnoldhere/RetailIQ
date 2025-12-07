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
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import AdminSidebar from '../../components/AdminSidebar'
import * as adminApi from '../../api/admin'

export default function SuppliersPage() {
    const toast = useToast()
    
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
                                </>
                            )}
                        </Box>
                    </SimpleGrid>
                </Box>
            </Box>

            <Footer />
        </Box>
    )
}

