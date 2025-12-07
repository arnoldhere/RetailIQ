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
    VStack,
    HStack,
    Heading,
    Text,
    useToast,
    Input,
    Spinner,
    TableContainer,
    Select,
    SimpleGrid,
    useColorModeValue,
    Tooltip,
    Flex,
    Divider,
    InputGroup,
    InputLeftElement,
} from '@chakra-ui/react'
import { DeleteIcon, EditIcon, AddIcon, SearchIcon } from '@chakra-ui/icons'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import AdminSidebar from '../../components/AdminSidebar'
import * as adminApi from '../../api/admin'
import { FiMail } from 'react-icons/fi'

export default function FeedbacksPage() {
    const toast = useToast()
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    // -------------------------
    // Top-level theme tokens (ALL hooks here)
    // -------------------------
    const pageBg = useColorModeValue('gray.50', 'gray.900')
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

    // -------------------------
    // State & refs (unchanged)
    // -------------------------
    const [feedbacks, setFeedbacks] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // const { isOpen, onOpen, onClose } = useDisclosure()
    // const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
    // const [deleteId, setDeleteId] = useState(null)
    const tableRef = useRef(null)

    // Filter feedbacks based on search query
    const filteredFeedbacks = feedbacks.filter((f) => {
        const fullName = `${f.firstname} ${f.lastname}`.toLowerCase()
        const message = (f.message || '').toLowerCase()
        const query = searchQuery.toLowerCase()
        return fullName.includes(query) || message.includes(query)
    })

    async function fetchFeedbacks() {
        setLoading(true)
        try {
            const res = await adminApi.getFeedbacks()
            setFeedbacks(res.data.feedbacks || [])
            // console.log(feedbacks)
        } catch (err) {
            console.error('Failed to fetch feedbacks:', err)
            toast({ title: 'Failed to load feedbacks', status: 'error', duration: 3000 })
            setFeedbacks([])
        }
        finally {
            setLoading(false)
        }
    }

    useEffect(() => {

        fetchFeedbacks();
    }, [])


    const msgToolBg = useColorModeValue("gray.800", "gray.700");
    const tableBg = useColorModeValue("white", "gray.900");
    const msgBg = useColorModeValue("gray.700", "gray.100");
    // const 
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
                                        <Heading size="lg">Feedbacks</Heading>
                                    </HStack>
                                    <Text color={mutedText} fontSize="sm">
                                        Manage feedbacks and reviews and assure the customers.
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
                                        placeholder="Search by name or message..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        bg={useColorModeValue('white', 'gray.700')}
                                        borderColor={borderColor}
                                        _focus={{
                                            borderColor: accent,
                                            boxShadow: `0 0 0 1px ${accent}`,
                                        }}
                                        borderRadius="lg"
                                    />
                                </InputGroup>
                                {searchQuery && (
                                    <Text mt={2} fontSize="sm" color={mutedText}>
                                        Showing {filteredFeedbacks.length} of {feedbacks.length} feedbacks
                                    </Text>
                                )}
                            </Box>

                            {/* Table / states */}
                            {loading ? (
                                <Box textAlign="center" py={12} display="flex" flexDirection="column" alignItems="center">
                                    <Spinner size="xl" thickness="4px" color={accent} />
                                    <Text mt={4} color={mutedText} fontSize="sm">
                                        Loading products...
                                    </Text>
                                </Box>
                            ) : feedbacks.length === 0 ? (
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
                                        No feedbacks yet
                                    </Heading>
                                </Box>
                            ) : (
                                <Box borderRadius="xl" overflow="hidden" border="1px solid" borderColor={borderColor} bg={tableStripe} ref={tableRef}>
                                    <TableContainer
                                        maxH="62vh"
                                        overflowY="auto"
                                        borderWidth="1px"
                                        borderRadius="xl"
                                        boxShadow="lg"
                                        bg={tableBg}
                                        sx={{
                                            // subtle custom scrollbar
                                            "&::-webkit-scrollbar": {
                                                width: "8px",
                                            },
                                            "&::-webkit-scrollbar-thumb": {
                                                borderRadius: "full",
                                            },
                                        }}
                                    >
                                        <Table variant="outline" size="sm" >
                                            <Thead
                                                position="sticky"
                                                top={0}
                                                zIndex={1}
                                                bg={tableHeadBg}
                                                bgGradient="linear(to-r, teal.500, purple.600)"
                                                color="white"
                                                boxShadow="sm"
                                            >
                                                <Tr>
                                                    <Th
                                                        fontWeight="700"
                                                        fontSize="xs"
                                                        textTransform="uppercase"
                                                        letterSpacing="wider"
                                                        borderColor="transparent"
                                                    >
                                                        User
                                                    </Th>
                                                    <Th
                                                        fontWeight="700"
                                                        fontSize="xs"
                                                        textTransform="uppercase"
                                                        letterSpacing="wider"
                                                        borderColor="transparent"
                                                    >
                                                        Message
                                                    </Th>
                                                    <Th
                                                        fontWeight="700"
                                                        fontSize="xs"
                                                        textTransform="uppercase"
                                                        letterSpacing="wider"
                                                        textAlign="center"
                                                        w="140px"
                                                        color="orange.100"
                                                        borderColor="transparent"
                                                    >
                                                        Actions
                                                    </Th>
                                                </Tr>
                                            </Thead>

                                            <Tbody>
                                                {feedbacks.map((f, idx) => (
                                                    <Tr
                                                        key={f.id}
                                                        borderBottom="1px"
                                                        borderColor={borderColor}
                                                        bg={idx % 2 === 0 ? "transparent" : tableStripe}
                                                        _hover={{
                                                            bg: hoverBg,
                                                            transform: "translateY(-2px)",
                                                            boxShadow: "md",
                                                        }}
                                                        transition="all 0.15s ease-out"
                                                    >
                                                        {/* Name cell */}
                                                        <Td
                                                            fontWeight="600"
                                                            color="green.500"
                                                            fontSize="sm"
                                                            maxW="220px"
                                                            whiteSpace="nowrap"
                                                            textOverflow="ellipsis"
                                                            overflow="hidden"
                                                        >
                                                            {`${f.firstname} ${f.lastname}`}
                                                        </Td>

                                                        {/* Message cell */}
                                                        <Td
                                                            fontWeight="500"
                                                            color={msgBg}
                                                            fontSize="sm"
                                                            maxW="480px"
                                                        >
                                                            <Tooltip
                                                                label={f.message}
                                                                hasArrow
                                                                placement="top-start"
                                                                bg={msgToolBg}
                                                                color="white"
                                                            >
                                                                <Box
                                                                    noOfLines={2}
                                                                    wordBreak="break-word"
                                                                >
                                                                    {f.message}
                                                                </Box>
                                                            </Tooltip>
                                                        </Td>

                                                        {/* Actions */}
                                                        <Td>
                                                            <HStack justify="center" spacing={1} whiteSpace="nowrap">
                                                                <Tooltip label="Send assurance email" hasArrow>
                                                                    <Button
                                                                        size="sm"
                                                                        w="100%"
                                                                        borderRadius="full"
                                                                        leftIcon={<FiMail />}
                                                                        bgGradient="linear(to-r, red.500, orange.500)"
                                                                        color="white"
                                                                        fontWeight="600"
                                                                        _hover={{
                                                                            bgGradient: "linear(to-r, cyan.500, purple.600)",
                                                                            transform: "translateY(-2px)",
                                                                            boxShadow: "lg",
                                                                        }}
                                                                        _active={{
                                                                            transform: "translateY(0)",
                                                                            boxShadow: "sm",
                                                                        }}
                                                                    >
                                                                        Assure
                                                                    </Button>
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

            <Footer />
        </Box>
    )
}
