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

    // const { isOpen, onOpen, onClose } = useDisclosure()
    // const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
    // const [deleteId, setDeleteId] = useState(null)
    const tableRef = useRef(null)

    async function fetchFeedbacks() {
        setLoading(true)
        try {
            const res = await adminApi.getFeedbacks()
            setFeedbacks(res.data.feedbacks || [])
            console.log(feedbacks)
        } catch (err) {
            console.error('Failed to fetch categories:', err)
            toast({ title: 'Failed to load categories', status: 'error', duration: 3000 })
            setFeedbacks([])
        }
        finally {
            setLoading(false)
        }
    }

    useEffect(() => {

        fetchFeedbacks();
    }, [])



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
                                    <TableContainer maxH="62vh" overflowY="auto">
                                        <Table variant="simple" size="sm">
                                            <Thead position="sticky" top={0} zIndex={1} bg={tableHeadBg}>
                                                <Tr>
                                                    <Th fontWeight="700" color="white.700">User</Th>
                                                    <Th fontWeight="700" color="white.700">Message</Th>
                                                    <Th fontWeight="700" color="orange.700" textAlign="center" w="140px">Actions</Th>
                                                </Tr>
                                            </Thead>

                                            <Tbody>
                                                {feedbacks.map((f, idx) => (
                                                    <Tr
                                                        key={f.cust_id}
                                                        borderBottom="1px"
                                                        borderColor={borderColor}
                                                        bg={idx % 2 === 0 ? 'transparent' : tableStripe}
                                                        _hover={{ bg: hoverBg, transform: 'translateY(-1px)', boxShadow: 'sm' }}
                                                        transition="all 0.15s ease-out"
                                                    >

                                                        <Td isNumeric fontWeight="700" color="green.600" fontSize="sm">${f.message}</Td>


                                                        <Td>
                                                            <HStack justify="center" spacing={1} whiteSpace="nowrap">
                                                                <Tooltip label="Assure">
                                                                    <Button
                                                                        icon={<FiMail />}
                                                                        size="sm"
                                                                        colorScheme="red"
                                                                        variant="ghost"
                                                                        aria-label="assure"
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

            <Footer />
        </Box>
    )
}
