import React, { useEffect, useState } from "react";
import {
	Badge,
	Box,
	Container,
	Flex,
	Grid,
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
	useToast,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SupplierSidebar from "../../components/SupplierSidebar";
import * as bidsApi from "../../api/bids";

export default function SupplierOrderDetail() {
	const { id } = useParams();
	const toast = useToast();
	const [order, setOrder] = useState(null);
	const [items, setItems] = useState([]);
	const [payments, setPayments] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			setLoading(true);
			try {
				const res = await bidsApi.getSupplierOrder(id);
				setOrder(res.data.order);
				setItems(res.data.items || []);
				setPayments(res.data.payments || []);
			} catch (err) {
				console.error("Failed to load order", err);
				toast({ title: "Failed to load order", status: "error" });
			} finally {
				setLoading(false);
			}
		}
		if (id) load();
	}, [id, toast]);

	const getStatusColor = (status) => ({ pending: "yellow", sent: "blue", received: "green", cancelled: "red" }[status] || "gray");

	if (loading) {
		return (
			<Box minH="80vh" display="flex" alignItems="center" justifyContent="center">
				<Spinner color="var(--primary-color)" />
			</Box>
		);
	}

	if (!order) {
		return (
			<Box minH="80vh" display="flex" alignItems="center" justifyContent="center">
				<Text>No order found</Text>
			</Box>
		);
	}

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
							<Text fontSize="xs" textTransform="uppercase" letterSpacing="0.18em" fontWeight="700" color="whiteAlpha.900">
								Order Detail
							</Text>
							<Heading size="lg" color="white" mt={2}>
								{order.order_no}
							</Heading>
							<Text color="whiteAlpha.900" mt={2}>
								Supplier order detail view with the same cleaner structure used across the updated admin-style pages.
							</Text>
						</Box>

						<Grid templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap={6}>
							<Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" boxShadow="var(--shadow-sm)">
								<Heading size="md" mb={4}>Order Summary</Heading>
								<VStack align="stretch" spacing={3}>
									<HStack justify="space-between">
										<Text color="var(--text-secondary)">Store</Text>
										<Text fontWeight="600">{order.store_name || "-"}</Text>
									</HStack>
									<HStack justify="space-between">
										<Text color="var(--text-secondary)">Status</Text>
										<Badge colorScheme={getStatusColor(order.status)} borderRadius="full" px={3} py={1}>
											{order.status}
										</Badge>
									</HStack>
									<HStack justify="space-between">
										<Text color="var(--text-secondary)">Total</Text>
										<Text fontWeight="700" color="var(--primary-color)">₹{Number(order.total_amount || 0).toFixed(2)}</Text>
									</HStack>
								</VStack>
							</Box>

							<Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" boxShadow="var(--shadow-sm)">
								<Heading size="md" mb={4}>Payment Overview</Heading>
								<Text color="var(--text-secondary)">
									{payments.length === 0
										? "No payments recorded for this order yet."
										: `${payments.length} payment record(s) found for this order.`}
								</Text>
							</Box>
						</Grid>

						<Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" boxShadow="var(--shadow-sm)">
							<Heading size="md" mb={4}>Items</Heading>
							<Box border="1px solid" borderColor="var(--border-light)" borderRadius="2xl" overflowX="auto">
								<Table size="sm">
									<Thead bg="var(--surface-secondary)">
										<Tr>
											<Th>Product</Th>
											<Th isNumeric>Qty</Th>
											<Th isNumeric>Unit Cost</Th>
											<Th isNumeric>Total</Th>
										</Tr>
									</Thead>
									<Tbody>
										{items.map((item) => (
											<Tr key={item.id}>
												<Td>{item.product_name}</Td>
												<Td isNumeric>{item.qty}</Td>
												<Td isNumeric>₹{Number(item.cost).toFixed(2)}</Td>
												<Td isNumeric>₹{Number(item.total_amount).toFixed(2)}</Td>
											</Tr>
										))}
									</Tbody>
								</Table>
							</Box>
						</Box>

						<Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" boxShadow="var(--shadow-sm)">
							<Heading size="md" mb={4}>Payments</Heading>
							{payments.length === 0 ? (
								<Text color="var(--text-secondary)">No payments recorded</Text>
							) : (
								<Box border="1px solid" borderColor="var(--border-light)" borderRadius="2xl" overflowX="auto">
									<Table size="sm">
										<Thead bg="var(--surface-secondary)">
											<Tr>
												<Th>Date</Th>
												<Th isNumeric>Amount</Th>
												<Th>Method</Th>
												<Th>Ref</Th>
											</Tr>
										</Thead>
										<Tbody>
											{payments.map((payment) => (
												<Tr key={payment.id}>
													<Td>{payment.payment_date || new Date(payment.created_at).toLocaleDateString()}</Td>
													<Td isNumeric>₹{Number(payment.amount).toFixed(2)}</Td>
													<Td>{payment.method}</Td>
													<Td>{payment.payment_ref || "-"}</Td>
												</Tr>
											))}
										</Tbody>
									</Table>
								</Box>
							)}
						</Box>
					</VStack>
				</Flex>
			</Container>

			<Footer />
		</Box>
	);
}
