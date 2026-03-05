import React, { useEffect, useState } from "react";
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
	StatHelpText,
	Grid,
	GridItem,
	Flex,
	Badge,
	SimpleGrid,
	Spinner,
	useToast,
	useColorModeValue,
	Alert,
	AlertIcon,
} from "@chakra-ui/react";
import SupplierSidebar from "../../components/SupplierSidebar";
import { ArrowUpIcon, ArrowDownIcon } from "@chakra-ui/icons";
import { FiTrendingUp } from "react-icons/fi";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
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

	const pageBg = useColorModeValue("gray.50", "#020617");
	const cardBg = useColorModeValue("white", "whiteAlpha.50");
	const textMuted = useColorModeValue("gray.600", "gray.400");
	const borderColor = useColorModeValue("gray.100", "whiteAlpha.200");
	const textPrimary = useColorModeValue("gray.900", "gray.100");
	const orderBg = useColorModeValue("gray.50", "whiteAlpha.100");
	const orderHoverBg = useColorModeValue("gray.100", "whiteAlpha.200");

	useEffect(() => {
		const fetchSupplierKPIs = async () => {
			try {
				setLoading(true);
				setError(null);

				// Verify user is authenticated as supplier
				if (!user || user.role !== 'supplier') {
					setError('Access denied: Supplier role required');
					return;
				}

				// Fetch supplier-specific dashboard metrics from backend
				const res = await bidsApi.getSupplierDashboardMetrics();
				const metrics = res?.data?.metrics || {};
				const supplier = res?.data?.supplier || {};

				// Validate that we got data for the current user's supplier
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
			value: `$${kpis.totalRevenue.toFixed(2)}`,
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
			value: `$${kpis.avgOrderValue.toFixed(2)}`,
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
		<Box minH="100vh" bg={pageBg} display="flex" flexDirection="column">
			<Navbar />

			<Box flex={1} py={{ base: 6, md: 10 }}>
				<Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }}>
					{/* Error state */}
					{error && (
						<Alert status="error" mb={6} borderRadius="md">
							<AlertIcon />
							<Box>
								<Text fontWeight="bold">Error loading dashboard</Text>
								<Text fontSize="sm">{error}</Text>
							</Box>
						</Alert>
					)}

					{loading ? (
						<Flex justify="center" py={20}>
							<Spinner size="lg" color="blue.500" />
						</Flex>
					) : (
						<SimpleGrid columns={{ base: 1, lg: 5 }} spacing={6} alignItems="flex-start">
							<Box
								as="aside"
								display={{ base: "none", lg: "block" }}
								rounded="2xl"
								overflow="hidden"
								boxShadow="sm"
								bg={cardBg}
								border="1px solid"
								borderColor={borderColor}
								h="fit-content"
							>
								<SupplierSidebar />
							</Box>

							<Box gridColumn={{ base: "1 / -1", lg: "span 4" }}>
								<VStack spacing={8} align="stretch">
									<Box>
										<Heading size="lg" mb={2} color={textPrimary}>
											Supplier Dashboard
										</Heading>
										<Text color={textMuted}>
											Your account-level KPI metrics, revenue tracking, and order performance
										</Text>
									</Box>

									<Grid
										templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
										gap={6}
									>
										{stats.map((stat, idx) => (
											<GridItem key={idx}>
												<Box
													bg={cardBg}
													p={6}
													borderRadius="xl"
													boxShadow="md"
													border="1px"
													borderColor={borderColor}
													_hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
													transition="all 0.2s"
												>
													<Stat>
														<StatLabel color={textMuted} fontSize="sm" fontWeight="500">
															{stat.label}
														</StatLabel>
														<StatNumber fontSize="3xl" fontWeight="bold" color={textPrimary} mt={2}>
															{stat.value}
														</StatNumber>
														<StatHelpText
															color={stat.isPositive ? "green.500" : "orange.500"}
															fontWeight="600"
															mt={2}
														>
															<Flex align="center" gap={1}>
																<stat.icon />
																<Text>{stat.change}</Text>
															</Flex>
														</StatHelpText>
													</Stat>
												</Box>
											</GridItem>
										))}
									</Grid>

									<Grid templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} gap={6}>
										<GridItem colSpan={{ base: 1, lg: 2 }}>
											<Box
												bg={cardBg}
												p={6}
												borderRadius="xl"
												boxShadow="md"
												border="1px"
												borderColor={borderColor}
											>
												<Heading size="md" mb={4} color={textPrimary}>
													Recent Supply Orders
												</Heading>
												<VStack spacing={3} align="stretch">
													{recentOrders.length > 0 ? (
														recentOrders.map((order) => (
															<Box
																key={order.id}
																p={4}
																borderRadius="lg"
																bg={orderBg}
																border="1px"
																borderColor={borderColor}
																_hover={{ bg: orderHoverBg }}
															>
																<Flex justify="space-between" align="center" mb={2}>
																	<HStack spacing={3}>
																		<Text fontWeight="600" fontSize="sm" color={textPrimary}>
																			{order.order_no}
																		</Text>
																		<Text color={textMuted} fontSize="sm">
																			{order.store_name || "-"}
																		</Text>
																	</HStack>
																	<Badge
																		colorScheme={getStatusColor(order.status)}
																		fontSize="xs"
																		borderRadius="full"
																		px={2}
																		py={0.5}
																	>
																		{order.status?.toUpperCase()}
																	</Badge>
																</Flex>
																<Flex justify="space-between" align="center">
																	<Text fontSize="sm" color={textMuted}>
																		{formatDate(order.created_at)}
																	</Text>
																	<Text fontWeight="bold" color="green.500">
																		${Number(order.total_amount || 0).toFixed(2)}
																	</Text>
																</Flex>
															</Box>
														))
													) : (
														<Text color={textMuted} textAlign="center" py={4}>
															No supply orders found for your account.
														</Text>
													)}
												</VStack>
											</Box>
										</GridItem>

										<GridItem>
											<Box
												bg={cardBg}
												p={6}
												borderRadius="xl"
												boxShadow="md"
												border="1px"
												borderColor={borderColor}
												h="100%"
											>
												<Heading size="md" mb={4} color={textPrimary}>
													Quick Links
												</Heading>
												<VStack spacing={3} align="stretch">
													<Button colorScheme="blue" variant="outline" size="sm" fontWeight="500" justifyContent="flex-start">
														View All Orders
													</Button>
													<Button colorScheme="purple" variant="outline" size="sm" fontWeight="500" justifyContent="flex-start">
														Browse Products
													</Button>
													<Button colorScheme="green" variant="outline" size="sm" fontWeight="500" justifyContent="flex-start">
														View Bids
													</Button>
													<Button colorScheme="orange" variant="outline" size="sm" fontWeight="500" justifyContent="flex-start">
														Update Profile
													</Button>
												</VStack>
											</Box>
										</GridItem>
									</Grid>

									<Box bgGradient="linear(to-r, blue.600, blue.400)" p={6} borderRadius="xl" border="1px" borderColor="blue.300">
										<Flex
											direction={{ base: "column", md: "row" }}
											align={{ base: "flex-start", md: "center" }}
											justify="space-between"
											gap={4}
										>
											<Box>
												<Heading size="sm" color="white" mb={2}>
													Performance Summary
												</Heading>
												<Text color="whiteAlpha.900" fontSize="sm">
													{kpis.completionRate}% orders delivered. Revenue growth vs last month: {kpis.revenueGrowthPct}%.
												</Text>
											</Box>
											<Button
												colorScheme="whiteAlpha"
												variant="outline"
												flexShrink={0}
												fontWeight="600"
												_hover={{ bg: "whiteAlpha.200" }}
											>
												View Analytics
											</Button>
										</Flex>
									</Box>
								</VStack>
							</Box>
						</SimpleGrid>
					)}
				</Box>
			</Box>

			<Footer />
		</Box>
	);
}
