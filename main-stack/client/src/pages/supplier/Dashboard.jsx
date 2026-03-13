import React, { useEffect, useState } from "react";
import {
	Alert,
	AlertIcon,
	Badge,
	Box,
	Button,
	Container,
	Flex,
	Grid,
	Heading,
	HStack,
	Icon,
	SimpleGrid,
	Spinner,
	Stat,
	StatHelpText,
	StatLabel,
	StatNumber,
	Text,
	VStack,
	useToast,
} from "@chakra-ui/react";
import { ArrowDownIcon, ArrowUpIcon } from "@chakra-ui/icons";
import { FiTrendingUp } from "react-icons/fi";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SupplierSidebar from "../../components/SupplierSidebar";
import * as bidsApi from "../../api/bids";
import { useAuth } from "../../context/AuthContext";

export default function SupplierDashboard() {
	const toast = useToast();
	const { user } = useAuth();
	const [kpis, setKpis] = useState({
		totalRevenue: 0,
		pendingOrders: 0,
		sentOrders: 0,
		receivedOrders: 0,
		totalOrders: 0,
		completionRate: 0,
		avgOrderValue: 0,
		revenueGrowthPct: 0,
	});
	const [recentOrders, setRecentOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchSupplierKPIs = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!user || user.role !== "supplier") {
					setError("Access denied: Supplier role required");
					return;
				}

				const res = await bidsApi.getSupplierDashboardMetrics();
				const metrics = res?.data?.metrics || {};
				const supplier = res?.data?.supplier || {};

				if (res?.data?.supplier?.id) {
					console.log(`✓ Dashboard loaded for Supplier ID: ${supplier.id} (${supplier.name})`);
				}

				setKpis({
					totalRevenue: Number(metrics.totalRevenue || 0),
					pendingOrders: Number(metrics.pendingOrders || 0),
					sentOrders: Number(metrics.sentOrders || 0),
					receivedOrders: Number(metrics.receivedOrders || 0),
					totalOrders: Number(metrics.totalOrders || 0),
					completionRate: Number(metrics.completionRate || 0),
					avgOrderValue: Number(metrics.avgOrderValue || 0),
					revenueGrowthPct: Number(metrics.revenueGrowthPct || 0),
				});
				setRecentOrders(res?.data?.recentOrders || []);
			} catch (err) {
				console.error("Failed to fetch supplier KPI data:", err);
				setError(err?.response?.data?.message || "Could not fetch supplier metrics");
				toast({
					title: "Failed to load dashboard",
					description: err?.response?.data?.message || "Could not fetch supplier metrics",
					status: "error",
					duration: 3000,
				});
			} finally {
				setLoading(false);
			}
		};

		fetchSupplierKPIs();
	}, [user, toast]);

	const stats = [
		{
			label: "Total Revenue",
			value: `₹${kpis.totalRevenue.toFixed(2)}`,
			change: "From your supply orders",
			isPositive: true,
			icon: ArrowUpIcon,
		},
		{
			label: "Orders Pending",
			value: `${kpis.pendingOrders}`,
			change: `Out of ${kpis.totalOrders} total`,
			isPositive: kpis.pendingOrders === 0,
			icon: FiTrendingUp,
		},
		{
			label: "Delivered Orders",
			value: `${kpis.receivedOrders}`,
			change: `${kpis.completionRate}% completion rate`,
			isPositive: true,
			icon: ArrowUpIcon,
		},
		{
			label: "Average Order Value",
			value: `₹${kpis.avgOrderValue.toFixed(2)}`,
			change: "For your account only",
			isPositive: true,
			icon: ArrowDownIcon,
		},
	];

	const getStatusColor = (status) => {
		const colors = {
			received: "green",
			sent: "blue",
			processing: "orange",
			pending: "yellow",
			cancelled: "red",
		};
		return colors[status] || "gray";
	};

	const formatDate = (dateStr) => {
		if (!dateStr) return "-";
		try {
			return new Date(dateStr).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
		} catch {
			return dateStr;
		}
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

					<Box flex="1">
						<VStack spacing={6} align="stretch">
							<Box
								bg="linear-gradient(135deg, #0f3d91 0%, #0066cc 60%, #0aa2dd 100%)"
								borderRadius="3xl"
								p={{ base: 6, md: 8 }}
								color="white"
								boxShadow="0 24px 60px rgba(0, 102, 204, 0.18)"
							>
								<Grid templateColumns={{ base: "1fr", xl: "1.1fr 0.9fr" }} gap={8} alignItems="center">
									<VStack align="start" spacing={3}>
										<Text fontSize="xs" textTransform="uppercase" letterSpacing="0.18em" fontWeight="700" color="whiteAlpha.900">
											Supplier Overview
										</Text>
										<Heading size="lg" color="white">
											Track your supply performance  across the admin workspace.
										</Heading>
										<Text color="whiteAlpha.900" maxW="2xl">
											View revenue, monitor order progress, and review recent supply activities.
										</Text>
									</VStack>
									<SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
										<Box bg="whiteAlpha.170" border="1px solid" borderColor="whiteAlpha.260" borderRadius="2xl" p={4}>
											<Text fontSize="sm" color="whiteAlpha.800">Total Orders</Text>
											<Heading size="lg" color="white" mt={1}>{kpis.totalOrders}</Heading>
										</Box>
										<Box bg="whiteAlpha.170" border="1px solid" borderColor="whiteAlpha.260" borderRadius="2xl" p={4}>
											<Text fontSize="sm" color="whiteAlpha.800">Sent Orders</Text>
											<Heading size="lg" color="white" mt={1}>{kpis.sentOrders}</Heading>
										</Box>
										<Box bg="whiteAlpha.170" border="1px solid" borderColor="whiteAlpha.260" borderRadius="2xl" p={4}>
											<Text fontSize="sm" color="whiteAlpha.800">Growth</Text>
											<Heading size="lg" color="white" mt={1}>{kpis.revenueGrowthPct}%</Heading>
										</Box>
									</SimpleGrid>
								</Grid>
							</Box>

							{error && (
								<Alert status="error" borderRadius="xl">
									<AlertIcon />
									<Box>
										<Text fontWeight="bold">Error loading dashboard</Text>
										<Text fontSize="sm">{error}</Text>
									</Box>
								</Alert>
							)}

							{loading ? (
								<Flex justify="center" py={20}>
									<Spinner size="lg" color="var(--primary-color)" />
								</Flex>
							) : (
								<VStack spacing={6} align="stretch">
									<SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
										{stats.map((stat) => (
											<Box
												key={stat.label}
												bg="white"
												p={6}
												borderRadius="2xl"
												border="1px solid"
												borderColor="var(--border-light)"
												boxShadow="var(--shadow-sm)"
												transition="all var(--transition-normal)"
												_hover={{ transform: "translateY(-4px)", boxShadow: "var(--shadow-md)" }}
											>
												<Stat>
													<StatLabel color="var(--text-secondary)" fontSize="sm" fontWeight="500">
														{stat.label}
													</StatLabel>
													<StatNumber fontSize="3xl" fontWeight="bold" color="var(--text-primary)" mt={2}>
														{stat.value}
													</StatNumber>
													<StatHelpText color={stat.isPositive ? "green.500" : "orange.500"} fontWeight="600" mt={2}>
														<Flex align="center" gap={1}>
															<Icon as={stat.icon} />
															<Text>{stat.change}</Text>
														</Flex>
													</StatHelpText>
												</Stat>
											</Box>
										))}
									</SimpleGrid>

									<Grid templateColumns={{ base: "1fr", xl: "1.5fr 0.9fr" }} gap={6}>
										<Box
											bg="white"
											p={6}
											borderRadius="2xl"
											border="1px solid"
											borderColor="var(--border-light)"
											boxShadow="var(--shadow-sm)"
										>
											<HStack justify="space-between" mb={4}>
												<Box>
													<Heading size="md">Recent Supply Orders</Heading>
													<Text color="var(--text-secondary)" fontSize="sm" mt={1}>
														Your latest order activity and delivery progress.
													</Text>
												</Box>
												<Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
													{recentOrders.length} recent
												</Badge>
											</HStack>
											<VStack spacing={3} align="stretch">
												{recentOrders.length > 0 ? (
													recentOrders.map((order) => (
														<Box
															key={order.id}
															p={4}
															borderRadius="xl"
															bg="var(--surface-secondary)"
															border="1px solid"
															borderColor="var(--border-light)"
														>
															<Flex justify="space-between" align="center" mb={2}>
																<HStack spacing={3} flexWrap="wrap">
																	<Text fontWeight="700" fontSize="sm" color="var(--text-primary)">
																		{order.order_no}
																	</Text>
																	<Text color="var(--text-secondary)" fontSize="sm">
																		{order.store_name || "-"}
																	</Text>
																</HStack>
																<Badge colorScheme={getStatusColor(order.status)} borderRadius="full" px={3} py={1}>
																	{order.status}
																</Badge>
															</Flex>
															<Flex justify="space-between" align="center">
																<Text fontSize="sm" color="var(--text-secondary)">
																	{formatDate(order.created_at)}
																</Text>
																<Text fontWeight="700" color="var(--primary-color)">
																	₹{Number(order.total_amount || 0).toFixed(2)}
																</Text>
															</Flex>
														</Box>
													))
												) : (
													<Box
														border="1px dashed"
														borderColor="var(--border-color)"
														borderRadius="xl"
														p={8}
														textAlign="center"
													>
														<Text color="var(--text-secondary)">
															No supply orders found for your account.
														</Text>
													</Box>
												)}
											</VStack>
										</Box>

										<VStack spacing={6} align="stretch">
											<Box
												bg="white"
												p={6}
												borderRadius="2xl"
												border="1px solid"
												borderColor="var(--border-light)"
												boxShadow="var(--shadow-sm)"
											>
												<Heading size="md" mb={3}>
													Performance Summary
												</Heading>
												<Text color="var(--text-secondary)" mb={4}>
													{kpis.completionRate}% orders delivered. Revenue growth versus last month: {kpis.revenueGrowthPct}%.
												</Text>
												<Box
													bg="var(--primary-lighter)"
													borderRadius="xl"
													p={4}
													border="1px solid"
													borderColor="rgba(0, 102, 204, 0.10)"
												>
													<Text fontSize="sm" color="var(--primary-dark)" fontWeight="600">
														Account status
													</Text>
													<Text fontSize="sm" color="var(--text-secondary)" mt={1}>
														Your supplier dashboard reflects only your own orders, revenue, and payment activity.
													</Text>
												</Box>
											</Box>

											<Box
												bg="white"
												p={6}
												borderRadius="2xl"
												border="1px solid"
												borderColor="var(--border-light)"
												boxShadow="var(--shadow-sm)"
											>
												<Heading size="md" mb={4}>
													Quick Links
												</Heading>
												<VStack spacing={3} align="stretch">
													<Button variant="outline" justifyContent="flex-start">View All Orders</Button>
													<Button variant="outline" justifyContent="flex-start">Browse Products</Button>
													<Button variant="outline" justifyContent="flex-start">View Bids</Button>
													<Button variant="outline" justifyContent="flex-start">Update Profile</Button>
												</VStack>
											</Box>
										</VStack>
									</Grid>
								</VStack>
							)}
						</VStack>
					</Box>
				</Flex>
			</Container>

			<Footer />
		</Box>
	);
}
