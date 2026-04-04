import React, { useEffect, useMemo, useState } from "react";
import {
    Badge,
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
} from "@chakra-ui/react";

import {
    FiBarChart2,
    FiFileText,
    FiSearch,
    FiUsers,
} from "react-icons/fi";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/AdminSidebar";
import * as adminApi from "../../api/admin";
import {
    AdminTablePagination,
    AdminTableShell,
    SortableTh,
} from "../../components/AdminTable";

export default function UsersList() {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState({ totalUsers: 0 });
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const hoverBg = "var(--surface-light)"

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

    const bgPage = "var(--surface-light)";
    const textMuted = "var(--text-secondary)";
    const tableBorder = "var(--border-light)";
    const borderColor = "var(--border-light)";
    const subtleCard = "var(--surface-card)";
    const tableHeadBg = "rgba(248, 250, 252, 0.96)";

    // ---- Derived data: filtering + pagination ----
    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        let list = [...users];

        if (q) {
            list = list.filter((u) => {
                const name = `${u.firstname || ""} ${u.lastname || ""}`.toLowerCase();
                const email = (u.email || "").toLowerCase();
                const phone = (u.phone || "").toLowerCase();
                return name.includes(q) || email.includes(q) || phone.includes(q);
            });
        }

        if (statusFilter !== "all") {
            const shouldBeActive = statusFilter === "active";
            list = list.filter((u) => Boolean(u.is_active) === shouldBeActive);
        }

        list.sort((a, b) => {
            const direction = sortOrder === "asc" ? 1 : -1;

            if (sortBy === "name") {
                const left = `${a.firstname || ""} ${a.lastname || ""}`.trim();
                const right = `${b.firstname || ""} ${b.lastname || ""}`.trim();
                return left.localeCompare(right) * direction;
            }

            if (sortBy === "email") {
                return (a.email || "").localeCompare(b.email || "") * direction;
            }

            if (sortBy === "phone") {
                return (a.phone || "").localeCompare(b.phone || "") * direction;
            }

            return (new Date(a.created_at) - new Date(b.created_at)) * direction;
        });

        return list;
    }, [users, search, statusFilter, sortBy, sortOrder]);

    const totalPages = Math.max(
        1,
        Math.ceil((filteredUsers.length || 1) / pageSize)
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, sortBy, sortOrder, pageSize]);

    const paginatedUsers = useMemo(() => {
        const startIdx = (currentPage - 1) * pageSize;
        return filteredUsers.slice(startIdx, startIdx + pageSize);
    }, [filteredUsers, currentPage, pageSize]);

    const noDbRecords = !loading && users.length === 0;
    const noSearchResults =
        !loading && users.length > 0 && filteredUsers.length === 0;

    function handleSort(column) {
        if (sortBy === column) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortBy(column);
        setSortOrder(column === "created_at" ? "desc" : "asc");
    }

    async function toggleUserStatus(user) {
        const isActive = user.is_active === 1
        const confirmText = isActive
            ? 'Deactivate this user? This will prevent them from logging in.'
            : 'Reactivate this user?'

        const ok = window.confirm(confirmText)
        if (!ok) return

        try {
            setLoading(true)

            if (isActive) {
                await adminApi.deactivateUser(user.id)
                toast({ title: 'User deactivated', status: 'success', duration: 3000 })
            } else {
                await adminApi.reactivateUser(user.id)
                toast({ title: 'User activated', status: 'success', duration: 3000 })
            }

            const res = await adminApi.getUsers()
            setUsers(res?.data?.users || [])
        } catch (err) {
            console.error('Failed to toggle user status', err)
            toast({
                title: 'Action failed',
                status: 'error',
                duration: 3000,
            })
        } finally {
            setLoading(false)
        }
    }


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
                                bg="rgba(255,255,255,0.72)"
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius="2xl"
                                p={{ base: 4, md: 5 }}
                                boxShadow="sm"
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
                                            bg={subtleCard}
                                            borderRadius="full"
                                        />
                                    </InputGroup>
                                </Box>

                                <HStack spacing={3}>
                                    <Select
                                        size="sm"
                                        width="150px"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        bg={subtleCard}
                                        borderRadius="full"
                                    >
                                        <option value="all">All users</option>
                                        <option value="active">Active only</option>
                                        <option value="inactive">Inactive only</option>
                                    </Select>
                                    <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={3} py={1}>
                                        {filteredUsers.length} shown
                                    </Badge>
                                </HStack>
                            </Flex>

                            {/* Table wrapper */}
                            <Box w="100%">
                                <AdminTableShell bg={subtleCard} borderColor={tableBorder} maxH={{ base: "none", md: "70vh" }}>
                                    <Table size="md" variant="outline">
                                        <Thead
                                            position="sticky"
                                            top={0}
                                            zIndex={1}
                                            bg={tableHeadBg}
                                            backdropFilter="blur(10px)"
                                        >
                                            <Tr>
                                                <Th color={textMuted}>Sr.</Th>
                                                <SortableTh
                                                    label="Name"
                                                    sortKey="name"
                                                    sortBy={sortBy}
                                                    sortOrder={sortOrder}
                                                    onSort={handleSort}
                                                />
                                                <SortableTh
                                                    label="Email"
                                                    sortKey="email"
                                                    sortBy={sortBy}
                                                    sortOrder={sortOrder}
                                                    onSort={handleSort}
                                                />
                                                <SortableTh
                                                    label="Phone"
                                                    sortKey="phone"
                                                    sortBy={sortBy}
                                                    sortOrder={sortOrder}
                                                    onSort={handleSort}
                                                    display={{ base: "none", md: "table-cell" }}
                                                />
                                                <SortableTh
                                                    label="Joined"
                                                    sortKey="created_at"
                                                    sortBy={sortBy}
                                                    sortOrder={sortOrder}
                                                    onSort={handleSort}
                                                    display={{ base: "none", md: "table-cell" }}
                                                />
                                                <Th textAlign="end" color={textMuted}>Action</Th>
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
                                                <Tr
                                                    _hover={{
                                                        bg: hoverBg,
                                                        transform: "translateY(-2px)",
                                                        boxShadow: "md",
                                                    }}
                                                    transition="all 0.15s ease-out"
                                                >
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
                                                            _hover={{ bg: hoverBg }}
                                                            transition="background 0.18s ease"
                                                        >
                                                            <Td>{sr}</Td>
                                                            <Td>
                                                                <HStack spacing={2}>
                                                                    <Text fontWeight="600">{`${item.firstname} ${item.lastname}`}</Text>
                                                                    <Box
                                                                        w="8px"
                                                                        h="8px"
                                                                        borderRadius="full"
                                                                        bg={item.is_active === 1 ? 'green.400' : 'red.400'}
                                                                    />
                                                                </HStack>
                                                            </Td>

                                                            <Td>{item.email}</Td>
                                                            <Td
                                                                display={{
                                                                    base: "none",
                                                                    md: "table-cell",
                                                                }}
                                                                color={textMuted}
                                                            >
                                                                {item.phone || "-"}
                                                            </Td>
                                                            <Td
                                                                display={{
                                                                    base: "none",
                                                                    md: "table-cell",
                                                                }}
                                                                color={textMuted}
                                                            >
                                                                {joined === "-" ? "-" : new Date(item.created_at).toLocaleDateString("en-GB")}
                                                            </Td>
                                                            <Td textAlign="end">
                                                                <Button
                                                                    isLoading={loading}
                                                                    isDisabled={loading}
                                                                    size="xs"
                                                                    colorScheme={item.is_active === 1 ? 'red' : 'green'}
                                                                    variant={item.is_active === 1 ? 'outline' : 'solid'}
                                                                    onClick={() => toggleUserStatus(item)}
                                                                >
                                                                    {/* {console.log(item)} */}
                                                                    {item.is_active === 1 ? 'Deactivate' : 'Activate'}
                                                                </Button>
                                                            </Td>


                                                        </Tr>
                                                    );
                                                })}
                                        </Tbody>
                                    </Table>
                                </AdminTableShell>

                                {/* Pagination footer */}
                                {!loading && !noDbRecords && filteredUsers.length > 0 && (
                                    <AdminTablePagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={filteredUsers.length}
                                        pageSize={pageSize}
                                        onPageSizeChange={(size) => setPageSize(size)}
                                        onPrevious={() =>
                                            setCurrentPage((p) => Math.max(1, p - 1))
                                        }
                                        onNext={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1)
                                            )
                                        }
                                        itemLabel="users"
                                    />
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
