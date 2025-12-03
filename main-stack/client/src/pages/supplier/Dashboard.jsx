import React from "react";
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
	Container,
} from "@chakra-ui/react";
import { ArrowUpIcon, ArrowDownIcon } from "@chakra-ui/icons";
import { FiTrendingUp } from "react-icons/fi";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function SupplierDashboard() {
	const stats = [
		{
			label: "Total Sales",
			value: "$18,450",
			change: "+9.2%",
			isPositive: true,
			icon: ArrowUpIcon,
		},
		{
			label: "Orders Pending",
			value: "32",
			change: "5 urgent",
			isPositive: false,
			icon: FiTrendingUp,
		},
		{
			label: "Inventory Level",
			value: "2,120 units",
			change: "-2.1%",
			isPositive: false,
			icon: ArrowDownIcon,
		},
		{
			label: "Customer Rating",
			value: "4.8/5.0",
			change: "+0.3%",
			isPositive: true,
			icon: ArrowUpIcon,
		},
	];

	const recentOrders = [
		{
			id: "#ORD-1847",
			store: "Main Street Store",
			amount: "$420",
			status: "delivered",
			date: "2 hrs ago",
		},
		{
			id: "#ORD-1846",
			store: "Downtown Market",
			amount: "$680",
			status: "shipped",
			date: "5 hrs ago",
		},
		{
			id: "#ORD-1845",
			store: "Mall Branch",
			amount: "$350",
			status: "processing",
			date: "1 day ago",
		},
	];

	const getStatusColor = (status) => {
		const colors = {
			delivered: "green",
			shipped: "blue",
			processing: "orange",
			pending: "red",
		};
		return colors[status] || "gray";
	};

	return (
		<Box minH="100vh" bg="#020617" display="flex" flexDirection="column">
			<Navbar />

			{/* main content – now full width */}
			<Container
				maxW="100vw"
				width="100vw"
				px={{ base: 1, md: 6, lg: 8 }}
				py={5}
				centerContent={true}
				flex={1}
			>
				<VStack spacing={8} align="stretch">
					<Box>
						<Heading size="lg" mb={2} color="gray.100">
							Supplier Dashboard
						</Heading>
						<Text color="gray.400">
							Manage orders, inventory, and performance metrics
						</Text>
					</Box>

					{/* Stats Cards */}
					<Grid
						templateColumns={{
							base: "1fr",
							md: "repeat(2, 1fr)",
							lg: "repeat(4, 1fr)",
						}}
						gap={6}
					>
						{stats.map((stat, idx) => (
							<GridItem key={idx}>
								<Box
									bg="whiteAlpha.50"
									p={6}
									borderRadius="xl"
									boxShadow="md"
									border="1px"
									borderColor="whiteAlpha.200"
									_hover={{
										transform: "translateY(-4px)",
										boxShadow: "xl",
										bg: "whiteAlpha.100",
									}}
									transition="all 0.2s ease-out"
								>
									<Stat>
										<StatLabel color="gray.300" fontSize="sm" fontWeight="500">
											{stat.label}
										</StatLabel>
										<StatNumber
											fontSize="3xl"
											fontWeight="bold"
											color="gray.50"
											mt={2}
										>
											{stat.value}
										</StatNumber>
										<StatHelpText
											color={stat.isPositive ? "green.400" : "red.400"}
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

					{/* Recent Orders + Quick Actions */}
					<Grid templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} gap={6}>
						<GridItem colSpan={{ base: 1, lg: 2 }}>
							<Box
								bg="whiteAlpha.50"
								p={6}
								borderRadius="xl"
								boxShadow="md"
								border="1px"
								borderColor="whiteAlpha.200"
							>
								<Heading size="md" mb={4} color="gray.100">
									Recent Orders
								</Heading>
								<VStack spacing={3} align="stretch">
									{recentOrders.map((order) => (
										<Box
											key={order.id}
											p={4}
											borderRadius="lg"
											bg="whiteAlpha.100"
											border="1px"
											borderColor="whiteAlpha.200"
										>
											<Flex justify="space-between" align="center" mb={2}>
												<HStack spacing={3}>
													<Text fontWeight="600" fontSize="sm" color="gray.100">
														{order.id}
													</Text>
													<Text color="gray.400" fontSize="sm">
														{order.store}
													</Text>
												</HStack>
												<Badge
													colorScheme={getStatusColor(order.status)}
													fontSize="xs"
													borderRadius="full"
													px={2}
													py={0.5}
												>
													{order.status.toUpperCase()}
												</Badge>
											</Flex>
											<Flex justify="space-between" align="center">
												<Text fontSize="sm" color="gray.400">
													{order.date}
												</Text>
												<Text fontWeight="bold" color="green.400">
													{order.amount}
												</Text>
											</Flex>
										</Box>
									))}
								</VStack>
							</Box>
						</GridItem>

						<GridItem>
							<Box
								bg="whiteAlpha.50"
								p={6}
								borderRadius="xl"
								boxShadow="md"
								border="1px"
								borderColor="whiteAlpha.200"
							>
								<Heading size="md" mb={4} color="gray.100">
									Quick Actions
								</Heading>
								<VStack spacing={3} align="stretch">
									<Button
										colorScheme="blue"
										variant="ghost"
										size="sm"
										fontWeight="500"
										justifyContent="flex-start"
										_hover={{ bg: "whiteAlpha.200" }}
									>
										New Order
									</Button>
									<Button
										colorScheme="green"
										variant="ghost"
										size="sm"
										fontWeight="500"
										justifyContent="flex-start"
										_hover={{ bg: "whiteAlpha.200" }}
									>
										Update Inventory
									</Button>
									<Button
										colorScheme="purple"
										variant="ghost"
										size="sm"
										fontWeight="500"
										justifyContent="flex-start"
										_hover={{ bg: "whiteAlpha.200" }}
									>
										View Analytics
									</Button>
									<Button
										colorScheme="orange"
										variant="ghost"
										size="sm"
										fontWeight="500"
										justifyContent="flex-start"
										_hover={{ bg: "whiteAlpha.200" }}
									>
										Settings
									</Button>
								</VStack>
							</Box>
						</GridItem>
					</Grid>

					{/* Performance Banner */}
					<Box
						bgGradient="linear(to-r, green.700, emerald.500)"
						p={6}
						borderRadius="xl"
						border="1px"
						borderColor="green.300"
					>
						<Flex
							direction={{ base: "column", md: "row" }}
							align={{ base: "flex-start", md: "center" }}
							justify="space-between"
							gap={4}
						>
							<Box>
								<Heading size="sm" color="white" mb={2}>
									✅ Performance
								</Heading>
								<Text color="whiteAlpha.900" fontSize="sm">
									Your orders are on track. Average delivery time: 2.3 days.
								</Text>
							</Box>
							<Button
								colorScheme="whiteAlpha"
								variant="outline"
								flexShrink={0}
								fontWeight="600"
								_hover={{ bg: "whiteAlpha.200", color: "gray.900" }}
							>
								View Reports
							</Button>
						</Flex>
					</Box>
				</VStack>
			</Container>

			<Footer />
		</Box>
	);
}
