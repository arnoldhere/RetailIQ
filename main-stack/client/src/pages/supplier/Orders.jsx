import React, { useEffect, useState } from "react";
import {
	Badge,
	Box,
	Button,
	Container,
	Flex,
	Heading,
	HStack,
	Spinner,
	Table,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
	VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SupplierSidebar from "../../components/SupplierSidebar";
import * as bidsApi from "../../api/bids";
import { useToast } from "@chakra-ui/react";

export default function SupplierOrdersPage() {
	const toast = useToast();
	const navigate = useNavigate();
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		fetchOrders();
	}, []);

	async function fetchOrders() {
		setLoading(true);
		try {
			const res = await bidsApi.getSupplierOrders(12, 0);
			setOrders(res.data.orders || []);
		} catch (err) {
			console.error("Failed to fetch supplier orders", err);
			toast({ title: "Failed to load orders", status: "error" });
			setOrders([]);
		} finally {
			setLoading(false);
		}
	}

	const getStatusColor = (status) => {
		const colors = { pending: "yellow", sent: "blue", received: "green", cancelled: "red" };
		return colors[status] || "gray";
	};

	return (
		<Box minH="100vh" bg="var(--background)" display="flex" flexDirection="column">
			<Navbar />

			<Container maxW="container.xl" py={6} flex={1}>
				<Flex gap={6} align="flex-start" direction={{ base: "column", lg: "row" }}>
					<Box display={{ base: "block", lg: "none" }}>
						<SupplierSidebar />
					</Box>

					<Box
						as="aside"
						display={{ base: "none", lg: "block" }}
						rounded="2xl"
						overflow="hidden"
						boxShadow="sm"
						bg="var(--surface)"
						border="1px solid"
						borderColor="var(--border-light)"
					>
						<SupplierSidebar />
					</Box>

					<VStack flex="1" spacing={6} align="stretch">
						<Box
							bg="linear-gradient(135deg, #0f3d91 0%, #0066cc 60%, #0aa2dd 100%)"
							borderRadius="3xl"
							p={{ base: 6, md: 8 }}
							color="white"
							boxShadow="0 24px 60px rgba(0, 102, 204, 0.18)"
						>
							<HStack justify="space-between" align="start" flexWrap="wrap" spacing={4}>
								<Box>
									<Text fontSize="xs" textTransform="uppercase" letterSpacing="0.18em" fontWeight="700" color="whiteAlpha.900">
										Supplier Orders
									</Text>
									<Heading size="lg" color="white" mt={2}>
										Review every supply order from a cleaner, admin-aligned layout.
									</Heading>
									<Text color="whiteAlpha.900" maxW="2xl" mt={2}>
										Your supply order list and details.
									</Text>
								</Box>
								<Button bg="white" color="var(--primary-dark)" _hover={{ bg: "whiteAlpha.900" }} onClick={fetchOrders}>
									Refresh Orders
								</Button>
							</HStack>
						</Box>

						<Box
							bg="white"
							border="1px solid"
							borderColor="var(--border-light)"
							borderRadius="3xl"
							p={{ base: 5, md: 6 }}
							boxShadow="var(--shadow-sm)"
						>
							<VStack align="stretch" spacing={4}>
								<Box>
									<Heading size="md">My Supply Orders</Heading>
									<Text color="var(--text-secondary)" mt={1}>
										Click any row to open the order detail page.
									</Text>
								</Box>

								{loading ? (
									<Flex justify="center" py={12}>
										<Spinner color="var(--primary-color)" />
									</Flex>
								) : orders.length === 0 ? (
									<Box
										border="1px dashed"
										borderColor="var(--border-color)"
										borderRadius="2xl"
										p={8}
										textAlign="center"
									>
										<Text color="var(--text-secondary)">No supply orders found.</Text>
									</Box>
								) : (
									<Box border="1px solid" borderColor="var(--border-light)" borderRadius="2xl" overflowX="auto">
										<Table variant="simple" size="sm">
											<Thead bg="var(--surface-secondary)">
												<Tr>
													<Th>Order No</Th>
													<Th>Store</Th>
													<Th isNumeric>Amount</Th>
													<Th>Status</Th>
													<Th>Delivery</Th>
													<Th>Date</Th>
												</Tr>
											</Thead>
											<Tbody>
												{orders.map((order) => (
													<Tr
														key={order.id}
														_hover={{ bg: "var(--surface-secondary)", cursor: "pointer" }}
														onClick={() => navigate(`/supplier/orders/${order.id}`)}
													>
														<Td fontWeight="700">{order.order_no}</Td>
														<Td>{order.store_name || "-"}</Td>
														<Td isNumeric fontWeight="700">₹{Number(order.total_amount || 0).toFixed(2)}</Td>
														<Td>
															<Badge colorScheme={getStatusColor(order.status)} borderRadius="full" px={3} py={1}>
																{order.status}
															</Badge>
														</Td>
														<Td>{order.deliver_at ? new Date(order.deliver_at).toLocaleDateString() : "-"}</Td>
														<Td>{new Date(order.created_at).toLocaleString()}</Td>
													</Tr>
												))}
											</Tbody>
										</Table>
									</Box>
								)}
							</VStack>
						</Box>
					</VStack>
				</Flex>
			</Container>

			<Footer />
		</Box>
	);
}
