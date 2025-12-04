import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Heading,
    Text,
    VStack,
    HStack,
    Stat,
    StatLabel,
    StatNumber,
    useToast,
    useColorModeValue,
    Flex,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    Spinner,
    Center,
    IconButton,
} from "@chakra-ui/react";

import {
    FiBarChart2,
    FiFileText,
    FiSearch,
    FiChevronLeft,
    FiChevronRight,
    FiUsers,
} from "react-icons/fi";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/AdminSidebar";
import * as adminApi from "../../api/admin";

export default function UsersList() {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState({ totalUsers: 0 });
    const [users, setUsers] = useState([]);

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            try {
                const res = await adminApi.getUsers();
                if (!mounted) return;
                setMetrics(res?.data?.metrics || {});
                setUsers(res?.data?.users || []);
            } catch (err) {
                console.error("failed to load users", err);
                toast({
                    title: "Failed to load users",
                    status: "error",
                    duration: 4000,
                });
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, [toast]);

    const bgPage = useColorModeValue("gray.50", "gray.900");
    const textMuted = useColorModeValue("gray.600", "gray.300");
    const tableHeaderBg = useColorModeValue("gray.100", "gray.800");
    const tableBorder = useColorModeValue("gray.200", "gray.700");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const subtleCard = useColorModeValue("white", "gray.800");

    // ---- Derived data: filtering + pagination ----
    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;

        return users.filter((u) => {
            const name = `${u.firstname || ""} ${u.lastname || ""}`.toLowerCase();
            const email = (u.email || "").toLowerCase();
            const phone = (u.phone || "").toLowerCase();
            return name.includes(q) || email.includes(q) || phone.includes(q);
        });
    }, [users, search]);

    const totalPages = Math.max(
        1,
        Math.ceil((filteredUsers.length || 1) / pageSize)
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, pageSize]);

    const paginatedUsers = useMemo(() => {
        const startIdx = (currentPage - 1) * pageSize;
        return filteredUsers.slice(startIdx, startIdx + pageSize);
    }, [filteredUsers, currentPage, pageSize]);

    const noDbRecords = !loading && users.length === 0;
    const noSearchResults =
        !loading && users.length > 0 && filteredUsers.length === 0;

    return (
        <Box
            minH="100vh"
            bg={bgPage}
            display="flex"
            flexDirection="column"
            w="100vw"
        >
            <Navbar />

            {/* main area, full width */}
            <Box w="100%" px={{ base: 2, md: 4 }} py={4} flex={1}>
                <Flex gap={6} align="flex-start" w="100%">
                    {/* sidebar */}
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

                    {/* main content */}
                    <Box flex="1" minW={0}>
                        <VStack spacing={6} align="stretch" w="100%">
                            {/* Header */}
                            <Flex
                                justify="space-between"
                                align={{ base: "flex-start", md: "center" }}
                                wrap="wrap"
                                gap={4}
                                w="100%"
                            >
                                <Box>
                                    <HStack spacing={2} mb={1}>
                                        <FiUsers />
                                        <Heading size="lg">Users of RetailIq</Heading>
                                    </HStack>
                                    <Text fontSize="sm" color={textMuted}>
                                        Manage all your users, search, filter and paginate.
                                    </Text>
                                </Box>

                                <Flex
                                    align="center"
                                    gap={8}
                                    wrap="wrap"
                                    justify={{ base: "flex-start", md: "flex-end" }}
                                >
                                    <Stat minW="120px">
                                        <StatLabel color={textMuted}>Total Users</StatLabel>
                                        <StatNumber>
                                            {metrics.totalUsers ?? users.length ?? 0}
                                        </StatNumber>
                                    </Stat>

                                    <HStack>
                                        <Button
                                            variant="ghost"
                                            leftIcon={<FiFileText />}
                                            size="sm"
                                        >
                                            Export
                                        </Button>
                                        <Button
                                            colorScheme="blue"
                                            leftIcon={<FiBarChart2 />}
                                            size="sm"
                                        >
                                            Analytics
                                        </Button>
                                    </HStack>
                                </Flex>
                            </Flex>

                            {/* Filters row */}
                            <Flex
                                justify="space-between"
                                align={{ base: "stretch", md: "center" }}
                                wrap="wrap"
                                gap={4}
                                w="100%"
                            >
                                <Box flex="1" minW={{ base: "100%", md: "260px" }}>
                                    <InputGroup size="sm">
                                        <InputLeftElement pointerEvents="none">
                                            <FiSearch />
                                        </InputLeftElement>
                                        <Input
                                            placeholder="Search by name, email, or phone..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            bg={useColorModeValue("white", "gray.800")}
                                        />
                                    </InputGroup>
                                </Box>

                                <HStack spacing={3}>
                                    <Text fontSize="sm" color={textMuted}>
                                        Rows per page:
                                    </Text>
                                    <Select
                                        size="sm"
                                        width="80px"
                                        value={pageSize}
                                        onChange={(e) => setPageSize(Number(e.target.value))}
                                        bg={useColorModeValue("white", "gray.800")}
                                    >
                                        {[5, 10, 20, 50].map((size) => (
                                            <option key={size} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </Select>
                                </HStack>
                            </Flex>

                            {/* Table wrapper */}
                            <Box
                                borderWidth="1px"
                                borderRadius="md"
                                borderColor={tableBorder}
                                bg={useColorModeValue("white", "gray.800")}
                                boxShadow="sm"
                                overflow="hidden"
                                w="100%"
                            >
                                <TableContainer
                                    w="100%"
                                    overflowX="auto"
                                    maxH={{ base: "none", md: "70vh" }}
                                >
                                    <Table size="md" variant="simple">
                                        <Thead
                                            bg={tableHeaderBg}
                                            position="sticky"
                                            top={0}
                                            zIndex={1}
                                        >
                                            <Tr>
                                                <Th>Sr.</Th>
                                                <Th>Name</Th>
                                                <Th>Email</Th>
                                                <Th display={{ base: "none", md: "table-cell" }}>
                                                    Phone
                                                </Th>
                                                <Th display={{ base: "none", md: "table-cell" }}>
                                                    Joined
                                                </Th>
                                                <Th textAlign="end">Action</Th>
                                            </Tr>
                                        </Thead>

                                        <Tbody>
                                            {loading && (
                                                <Tr>
                                                    <Td colSpan={6}>
                                                        <Center py={10}>
                                                            <Spinner mr={2} />
                                                            <Text color={textMuted}>
                                                                Loading users...
                                                            </Text>
                                                        </Center>
                                                    </Td>
                                                </Tr>
                                            )}

                                            {!loading && noDbRecords && (
                                                <Tr>
                                                    <Td colSpan={6}>
                                                        <Center py={10} flexDir="column">
                                                            <Text fontWeight="semibold">
                                                                No users found
                                                            </Text>
                                                            <Text fontSize="sm" color={textMuted}>
                                                                There are no records in the database
                                                                yet.
                                                            </Text>
                                                        </Center>
                                                    </Td>
                                                </Tr>
                                            )}

                                            {!loading && noSearchResults && (
                                                <Tr>
                                                    <Td colSpan={6}>
                                                        <Center py={10} flexDir="column">
                                                            <Text fontWeight="semibold">
                                                                No results for “{search}”
                                                            </Text>
                                                            <Text fontSize="sm" color={textMuted}>
                                                                Try adjusting your search keywords.
                                                            </Text>
                                                        </Center>
                                                    </Td>
                                                </Tr>
                                            )}

                                            {!loading &&
                                                !noDbRecords &&
                                                !noSearchResults &&
                                                paginatedUsers.map((item, index) => {
                                                    const sr =
                                                        (currentPage - 1) * pageSize + index + 1;
                                                    const joined = item.created_at
                                                        ? new Date(
                                                            item.created_at
                                                        ).toLocaleDateString()
                                                        : "-";
                                                    return (
                                                        <Tr
                                                            key={
                                                                item.id ||
                                                                `${item.email}-${sr}`
                                                            }
                                                        >
                                                            <Td>{sr}</Td>
                                                            <Td>{`${item.firstname} ${item.lastname}`}</Td>
                                                            <Td>{item.email}</Td>
                                                            <Td
                                                                display={{
                                                                    base: "none",
                                                                    md: "table-cell",
                                                                }}
                                                            >
                                                                {item.phone || "-"}
                                                            </Td>
                                                            <Td
                                                                display={{
                                                                    base: "none",
                                                                    md: "table-cell",
                                                                }}
                                                            >
                                                                {new Date(joined).toLocaleDateString("en-GB")}
                                                            </Td>
                                                            <Td textAlign="end">
                                                                <Button
                                                                    variant="outline"
                                                                    size="xs"
                                                                    colorScheme="red"
                                                                >
                                                                    Deactivate
                                                                </Button>
                                                            </Td>
                                                        </Tr>
                                                    );
                                                })}
                                        </Tbody>
                                    </Table>
                                </TableContainer>

                                {/* Pagination footer */}
                                {!loading && !noDbRecords && filteredUsers.length > 0 && (
                                    <Flex
                                        justify={{ base: "space-between", md: "flex-end" }}
                                        align="center"
                                        px={4}
                                        py={3}
                                        borderTopWidth="1px"
                                        borderColor={tableBorder}
                                        flexWrap="wrap"
                                        gap={3}
                                    >
                                        <Text
                                            fontSize="sm"
                                            color={textMuted}
                                            mr={{ md: "auto" }}
                                        >
                                            Showing{" "}
                                            <strong>
                                                {filteredUsers.length === 0
                                                    ? 0
                                                    : (currentPage - 1) * pageSize + 1}
                                            </strong>{" "}
                                            –{" "}
                                            <strong>
                                                {Math.min(
                                                    currentPage * pageSize,
                                                    filteredUsers.length
                                                )}
                                            </strong>{" "}
                                            of{" "}
                                            <strong>{filteredUsers.length}</strong> users
                                        </Text>

                                        <HStack spacing={1}>
                                            <IconButton
                                                aria-label="Previous page"
                                                icon={<FiChevronLeft />}
                                                size="sm"
                                                variant="outline"
                                                isDisabled={currentPage === 1}
                                                onClick={() =>
                                                    setCurrentPage((p) =>
                                                        Math.max(1, p - 1)
                                                    )
                                                }
                                            />
                                            <Text fontSize="sm">
                                                Page {currentPage} of {totalPages}
                                            </Text>
                                            <IconButton
                                                aria-label="Next page"
                                                icon={<FiChevronRight />}
                                                size="sm"
                                                variant="outline"
                                                isDisabled={currentPage === totalPages}
                                                onClick={() =>
                                                    setCurrentPage((p) =>
                                                        Math.min(totalPages, p + 1)
                                                    )
                                                }
                                            />
                                        </HStack>
                                    </Flex>
                                )}
                            </Box>
                        </VStack>
                    </Box>
                </Flex>
            </Box>

            <Footer />
        </Box>
    );
}
