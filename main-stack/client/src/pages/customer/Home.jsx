import React, { useEffect, useState } from "react";
import * as userApi from "../../api/user";
import { FaUsers, FaBoxOpen, FaStore } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
	Box,
	Button,
	SimpleGrid,
	Container,
	Grid,
	GridItem,
	Heading,
	Text,
	VStack,
	HStack,
	Flex,
	Icon,
	Link,
	useToast,
	useColorModeValue,
} from "@chakra-ui/react";
// import trust icon, tech icons from chkra ui
import {
	FaRobot,
	FaChartLine,
	FaShoppingCart,
	FaBullseye,
	FaCentercode,
} from "react-icons/fa";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function CustomerHome() {
	const navigate = useNavigate();
	const toast = useToast();
	const [stats, setStats] = useState([]);

	const cardBg = useColorModeValue("white", "gray.800");
	const textColor = useColorModeValue("gray.700", "gray.300");
	// const mutedText = useColorModeValue("gray.600", "gray.400");

	const features = [
		{
			icon: FaBullseye,
			title: "Clean & Trust-Based",
			description: "Shopping should be simple, smart, and stress-free.",
		},
		{
			icon: FaRobot,
			title: "AI Insights",
			description: "We blend smart technology with everyday shopping.",
		},
		{
			icon: FaCentercode,
			title: "Customer-Centric",
			description: "Because you deserve better shopping—every single time.",
		},
		{
			icon: FaShoppingCart,
			title: "Market Basket",
			description: "Discover product correlations and bundle opportunities",
		},
	];

	useEffect(() => {
		async function load() {
			try {
				const res = await userApi.getAboutusStat();
				const raw = res?.data?.stats || {};

				const formattedStats = [
					{
						label: "Happy Customers",
						number: raw.totalCustomers?.count ?? 0,
					},
					{
						label: "Products Available",
						number: raw.totalProducts?.count ?? 0,
					},
					{
						label: "Stores Connected",
						number: raw.totalStores?.count ?? 0,
					},
				];

				setStats(formattedStats);
			} catch (e) {
				console.error("failed to load stats", e);
				toast({
					title: "Failed to load overview",
					status: "error",
					duration: 4000,
				});
			}
		}

		load();
	}, [toast]);


	return (
		<Box
			minH="100vh"
			bg="#020617" // dark background to match navbar
			display="flex"
			flexDirection="column"
		>
			<Navbar />

			<Box flex={1}>
				{/* Hero Section */}
				<Box
					bgGradient="linear(to-r, cyan.500, purple.600)"
					color="white"
					py={{ base: 12, md: 24 }}
					textAlign="center"
					boxShadow="xl"
				>
					<Container maxW="container.lg">
						<Heading size="2xl" fontWeight="bold" mb={4} lineHeight={1.2}>
							Smarter Shopping Starts Here 🚀
						</Heading>
						<Text fontSize="lg" opacity={0.9} mb={8} maxW="600px" mx="auto">
							RetailIQ brings you the best products, optimized prices, and a
							smooth buying experience powered by real-time intelligence.
						</Text>
						<HStack justify="center" spacing={4}>
							<Link onClick={() => navigate("/customer/products")}>
								<Button
									size="lg"
									fontWeight="600"
									bg="white"
									color="gray.900"
									_hover={{ bg: "gray.100" }}
								>
									Explore Products
								</Button>
							</Link>
						</HStack>
					</Container>
				</Box>

				{/* Features Section */}
				<Container maxW="container.xl" py={16} px={6}>
					<VStack spacing={12} align="stretch">
						<Box textAlign="center">
							<Heading size="lg" mb={2} color="gray.100">
								Why Choose RetailIQ?
							</Heading>
							<Text color="gray.400">
								Powerful tools built specifically for retail success
							</Text>
						</Box>

						<Grid
							templateColumns={{
								base: "1fr",
								md: "repeat(2, 1fr)",
								lg: "repeat(4, 1fr)",
							}}
							gap={8}
						>
							{features.map((feature, idx) => (
								<Box
									key={idx}
									bg="whiteAlpha.50"
									p={6}
									borderRadius="xl"
									boxShadow="md"
									textAlign="center"
									border="1px solid"
									borderColor="whiteAlpha.200"
									_hover={{
										transform: "translateY(-4px)",
										boxShadow: "xl",
										bg: "whiteAlpha.100",
									}}
									transition="all 0.2s ease-out"
								>
									<Icon as={feature.icon} fontSize="4xl" mb={3} color="cyan.400" />
									<Heading size="sm" mb={2} color="gray.100">
										{feature.title}
									</Heading>
									<Text color="gray.400" fontSize="sm">
										{feature.description}
									</Text>
								</Box>
							))}
						</Grid>
					</VStack>
				</Container>

				{/* Quick Stats */}
				{/* Quick Stats */}
				<Container maxW="container.xl" py={16}>
					<VStack spacing={8}>
						<Box textAlign="center">
							<Heading size="lg" color="gray.100" mb={2}>
								Our Impact in Numbers
							</Heading>
							<Text color="gray.400">
								Trusted by customers and retailers alike
							</Text>
						</Box>

						<SimpleGrid
							columns={{ base: 1, sm: 2, md: 3 }}
							spacing={8}
							w="full"
						>
							{stats.map((stat, idx) => {
								const icons = [FaUsers, FaBoxOpen, FaStore];
								const StatIcon = icons[idx];

								return (
									<Box
										key={idx}
										position="relative"
										bg="whiteAlpha.50"
										backdropFilter="blur(10px)"
										p={8}
										borderRadius="2xl"
										textAlign="center"
										border="1px solid"
										borderColor="whiteAlpha.200"
										boxShadow="0 10px 30px rgba(0,0,0,0.4)"
										transition="all 0.35s ease"
										_hover={{
											transform: "translateY(-8px) scale(1.03)",
											boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
											borderColor: "cyan.400",
										}}
									>
										{/* Glow effect */}
										<Box
											position="absolute"
											inset={0}
											borderRadius="2xl"
											bgGradient="linear(to-r, cyan.400, purple.500)"
											opacity={0.08}
											zIndex={0}
										/>

										<VStack spacing={4} position="relative" zIndex={1}>
											<Flex
												w="64px"
												h="64px"
												borderRadius="full"
												align="center"
												justify="center"
												bgGradient="linear(to-r, cyan.400, purple.500)"
												color="white"
												fontSize="2xl"
												boxShadow="lg"
											>
												<Icon as={StatIcon} />
											</Flex>

											<Heading
												size="2xl"
												bgGradient="linear(to-r, cyan.300, purple.400)"
												bgClip="text"
												fontWeight="extrabold"
											>
												{stat.number}
											</Heading>

											<Text
												fontWeight="600"
												color="gray.200"
												letterSpacing="wide"
												textTransform="uppercase"
												fontSize="sm"
											>
												{stat.label}
											</Text>
										</VStack>
									</Box>
								);
							})}
						</SimpleGrid>
					</VStack>
				</Container>


				{/* CTA Section */}
				<Box
					bgGradient="linear(to-r, blue.600, purple.600)"
					py={12}
					borderTop="1px solid"
					borderColor="whiteAlpha.300"
				>
					<Container maxW="container.lg" textAlign="center" px={6}>
						<VStack spacing={3}>
							<Heading size="lg" mb={2} color="white">
								Are you not just the customer?
							</Heading>
							<Heading
								size="lg"
								bgGradient="linear(to-r, red.400, teal.500)"
								bgClip="text"
								fontWeight="extrabold"
								cursor="pointer"
							>
								Need to manage or grow your retail business?
							</Heading>
							<Heading size="lg" color="white" fontWeight="600">
								Ready to Transform Your Retail Business?
							</Heading>
						</VStack>
						<Text color="whiteAlpha.800" mb={6} fontSize="md">
							Start using RetailIQ today and see the difference AI-powered
							analytics can make.
						</Text>
						<HStack justify="center" spacing={4}>
							<Button
								size="lg"
								fontWeight="600"
								bg="white"
								color="gray.900"
								_hover={{ bg: "gray.100" }}
							>
								Get Started
							</Button>
							<Button
								variant="outline"
								size="lg"
								fontWeight="600"
								borderColor="whiteAlpha.800"
								color="white"
								_hover={{ bg: "whiteAlpha.200" }}
							>
								View Pricing
							</Button>
						</HStack>
					</Container>
				</Box>
				{/* Benefits Section */}
				<Container maxW="container.xl" py={16} px={6}>
					<VStack spacing={8} align="stretch">
						<Box textAlign="center">
							<Heading size="lg" mb={2} color="gray.100">
								Key Benefits
							</Heading>
							<Text color="gray.400">
								How RetailIQ helps your business grow
							</Text>
						</Box>

						<Grid
							templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
							gap={8}
						>
							{[
								"Reduce lost sales with accurate demand forecasting",
								"Optimize inventory investment with AI recommendations",
								"Design effective promotions with market basket analysis",
								"Predict stock-outs and overstock situations",
								"Make data-driven pricing decisions",
								"Track performance with real-time dashboards",
							].map((benefit, idx) => (
								<HStack key={idx} spacing={3} align="flex-start">
									<Box color="green.400" fontSize="lg" mt={1}>
										✓
									</Box>
									<Text color="gray.200">{benefit}</Text>
								</HStack>
							))}
						</Grid>
					</VStack>
				</Container>
			</Box>

			<Footer />
		</Box>
	);
}
