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
} from "@chakra-ui/react";
import SupplierSidebar from "../../components/SupplierSidebar";
import { ArrowUpIcon, ArrowDownIcon } from "@chakra-ui/icons";
import { FiTrendingUp } from "react-icons/fi";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import * as bidsApi from "../../api/bids";

/**
 * SupplierDashboard Component
 * Displays real-time KPI metrics including total revenue, pending orders,
 * delivered orders, and recent supply order history.
 * Data is fetched from the supplier's supply orders API endpoint.
 */
export default function SupplierDashboard() {
	const toast = useToast();
	const [kpis, setKpis] = useState(null);
	const [recentOrders, setRecentOrders] = useState([]);
	const [loading, setLoading] = useState(true);

	// Color mode values for light/dark theme
	const pageBg = useColorModeValue('gray.50', '#020617');
	const cardBg = useColorModeValue('white', 'whiteAlpha.50');
	const textMuted = useColorModeValue('gray.600', 'gray.400');
	const borderColor = useColorModeValue('gray.100', 'whiteAlpha.200');
	const textPrimary = useColorModeValue('gray.900', 'gray.100');
	const orderBg = useColorModeValue('gray.50', 'whiteAlpha.100');
	const orderHoverBg = useColorModeValue('gray.100', 'whiteAlpha.200');

	/**
	 * Fetch supplier KPI metrics on component mount
	 * Calculates real metrics from the supplier's supply orders
	 */
	useEffect(() => {
		const fetchKPIs = async () => {
			try {
				setLoading(true);
				// Fetch all supplier orders to calculate real KPI metrics
				const res = await bidsApi.getSupplierOrders(100, 0);
				const orders = res?.data?.orders || [];

				// Calculate KPI metrics from orders
				const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
				const pendingCount = orders.filter(o => o.status === 'pending').length;
				const sentCount = orders.filter(o => o.status === 'sent').length;
				const receivedCount = orders.filter(o => o.status === 'received').length;
				const totalOrders = orders.length;
				// Calculate completion rate (received / total * 100)
				const completionRate = totalOrders > 0 ? ((receivedCount / totalOrders) * 100).toFixed(1) : 0;

				// Store KPI metrics
				setKpis({
					totalRevenue: totalRevenue.toFixed(2),
					pendingOrders: pendingCount,
					sentOrders: sentCount,
					receivedOrders: receivedCount,
					totalOrders: totalOrders,
					completionRate: completionRate,
				});

				// Set recent orders (last 5 most recent)
				setRecentOrders(orders.slice(0, 5));
			} catch (err) {
				console.error('Failed to fetch KPIs:', err);
				toast({
					title: 'Failed to load dashboard',
					description: 'Could not fetch supplier metrics',
					status: 'error',
					duration: 3000,
				});
			} finally {
				setLoading(false);
			}
		};
		fetchKPIs();
	}, [toast]);

	/**
	 * Dynamic stats array populated from real KPI data
	 * Updates whenever kpis state changes
	 */
	const stats = [
		{
			label: "Total Revenue",
			value: kpis ? `$${kpis.totalRevenue}` : "$0.00",
			change: "From all supply orders",
			isPositive: true,
			icon: ArrowUpIcon,
		},
		{
			label: "Orders Pending",
			value: kpis ? kpis.pendingOrders : "0",
			change: `Out of ${kpis?.totalOrders || 0} total`,
			isPositive: kpis?.pendingOrders === 0,
			icon: FiTrendingUp,
		},
		{
			label: "Delivered Orders",
			value: kpis ? kpis.receivedOrders : "0",
			change: `${kpis?.completionRate || 0}% completion rate`,
			isPositive: true,
			icon: ArrowUpIcon,
		},
		{
			label: "In Transit",
			value: kpis ? kpis.sentOrders : "0",
			change: "Orders being delivered",
			isPositive: true,
			icon: ArrowDownIcon,
		},
	];

	/**
	 * Map order status to Chakra UI color scheme
	 * Used in Badge components to visually represent order status
	 */
	const getStatusColor = (status) => {
		const colors = {
			received: "green",
			sent: "blue",
			processing: "orange",
			pending: "yellow",
		};
		return colors[status] || "gray";
	};

	/**
	 * Format ISO date string to readable format
	 * Example: 2025-01-15T10:30:00Z → Jan 15, 2025
	 */
	const formatDate = (dateStr) => {
		if (!dateStr) return '-';
		try {
			return new Date(dateStr).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return dateStr;
		}
	};

	return (
		<Box minH="100vh" bg={pageBg} display="flex" flexDirection="column">
			<Navbar />

			{/* Main dashboard content section */}
			<Box flex={1} py={{ base: 6, md: 10 }}>
				<Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }}>
					{loading ? (
						// Loading spinner while fetching KPI data
						<Flex justify="center" py={20}>
							<Spinner size="lg" color="blue.500" />
						</Flex>
					) : (
						<SimpleGrid columns={{ base: 1, lg: 5 }} spacing={6} alignItems="flex-start">
							{/* Left sidebar navigation */}
							<Box
								as="aside"
								display={{ base: 'none', lg: 'block' }}
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

							{/* Main content area */}
							<Box gridColumn={{ base: '1 / -1', lg: 'span 4' }}>
								<VStack spacing={8} align="stretch">
									{/* Header section */}
									<Box>
										<Heading size="lg" mb={2} color={textPrimary}>
											Supplier Dashboard
										</Heading>
										<Text color={textMuted}>
											View real-time KPI metrics, revenue tracking, and order performance
										</Text>
									</Box>

									{/* KPI Stats Grid - 4 column layout */}
									<Grid
										templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
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
													_hover={{
														boxShadow: 'lg',
														transform: 'translateY(-2px)',
													}}
													transition="all 0.2s"
												>
													<Stat>
														<StatLabel
															color={textMuted}
															fontSize="sm"
															fontWeight="500"
														>
															{stat.label}
														</StatLabel>
														<StatNumber
															fontSize="3xl"
															fontWeight="bold"
															color={textPrimary}
															mt={2}
														>
															{stat.value}
														</StatNumber>
														<StatHelpText
															color={stat.isPositive ? 'green.500' : 'orange.500'}
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

									{/* Recent Orders and Quick Actions section */}
									<Grid
										templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }}
										gap={6}
									>
										{/* Recent Orders Card - spans 2 columns on large screens */}
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
																_hover={{
																	bg: orderHoverBg,
																}}

															>
																<Flex
																	justify="space-between"
																	align="center"
																	mb={2}
																>
																	<HStack spacing={3}>
																		{/* Order number and store */}
																		<Text
																			fontWeight="600"
																			fontSize="sm"
																			color={textPrimary}
																		>
																			{order.order_no}
																		</Text>
																		<Text
																			color={textMuted}
																			fontSize="sm"
																		>
																			{order.store_name || '-'}
																		</Text>
																	</HStack>
																	{/* Status badge */}
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
																{/* Date and amount */}
																<Flex
																	justify="space-between"
																	align="center"
																>
																	<Text
																		fontSize="sm"
																		color={textMuted}
																	>
																		{formatDate(order.created_at)}
																	</Text>
																	<Text fontWeight="bold" color="green.500">
																		${Number(order.total_amount || 0).toFixed(2)}
																	</Text>
																</Flex>
															</Box>
														))
													) : (
														<Text
															color={textMuted}
															textAlign="center"
															py={4}
														>
															No orders yet. Start browsing products to place a supply order!
														</Text>
													)}
												</VStack>
											</Box>
										</GridItem>

										{/* Quick Links Card */}
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
													<Button
														colorScheme="blue"
														variant="outline"
														size="sm"
														fontWeight="500"
														justifyContent="flex-start"
													>
														View All Orders
													</Button>
													<Button
														colorScheme="purple"
														variant="outline"
														size="sm"
														fontWeight="500"
														justifyContent="flex-start"
													>
														Browse Products
													</Button>
													<Button
														colorScheme="green"
														variant="outline"
														size="sm"
														fontWeight="500"
														justifyContent="flex-start"
													>
														View Bids
													</Button>
													<Button
														colorScheme="orange"
														variant="outline"
														size="sm"
														fontWeight="500"
														justifyContent="flex-start"
													>
														Update Profile
													</Button>
												</VStack>
											</Box>
										</GridItem>
									</Grid>

									{/* Performance Summary Banner */}
									<Box
										bgGradient="linear(to-r, blue.600, blue.400)"
										p={6}
										borderRadius="xl"
										border="1px"
										borderColor="blue.300"
									>
										<Flex
											direction={{ base: 'column', md: 'row' }}
											align={{ base: 'flex-start', md: 'center' }}
											justify="space-between"
											gap={4}
										>
											<Box>
												<Heading size="sm" color="white" mb={2}>
													📊 Performance Summary
												</Heading>
												<Text color="whiteAlpha.900" fontSize="sm">
													{kpis?.completionRate}% of your orders have been successfully delivered. Keep up the great work!
												</Text>
											</Box>
											<Button
												colorScheme="whiteAlpha"
												variant="outline"
												flexShrink={0}
												fontWeight="600"
												_hover={{ bg: 'whiteAlpha.200' }}
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
