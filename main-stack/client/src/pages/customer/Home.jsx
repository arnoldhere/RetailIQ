import React from "react";
import {
	Box,
	Button,
	Container,
	Grid,
	GridItem,
	Heading,
	Text,
	VStack,
	HStack,
	Flex,
	Icon,
} from "@chakra-ui/react";
import { ArrowRightIcon, CheckCircleIcon } from "@chakra-ui/icons";
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
							<Button
								size="lg"
								fontWeight="600"
								bg="white"
								color="gray.900"
								_hover={{ bg: "gray.100" }}
							>
								Explore Products
							</Button>
							{/* <Button
								colorScheme="whiteAlpha"
								variant="outline"
								size="lg"
								fontWeight="600"
								_hover={{ bg: "whiteAlpha.200" }}
							>
								Learn More
							</Button> */}
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
									<Text fontSize="4xl" mb={3}>
										{feature.icon}
									</Text>
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
				<Box
					bg="blackAlpha.700"
					py={12}
					borderTop="1px solid"
					borderColor="whiteAlpha.200"
				>
					<Container maxW="container.xl" px={6}>
						<Grid
							templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
							gap={8}
							textAlign="center"
						>
							<Box>
								<Heading size="xl" color="cyan.400">
									500+
								</Heading>
								<Text color="gray.300" mt={2}>
									Active Retailers
								</Text>
							</Box>
							<Box>
								<Heading size="xl" color="purple.400">
									$2.5M+
								</Heading>
								<Text color="gray.300" mt={2}>
									Revenue Optimized
								</Text>
							</Box>
							<Box>
								<Heading size="xl" color="green.400">
									98%
								</Heading>
								<Text color="gray.300" mt={2}>
									Satisfaction Rate
								</Text>
							</Box>
						</Grid>
					</Container>
				</Box>
				{/* CTA Section */}
				<Box
					bgGradient="linear(to-r, blue.600, purple.600)"
					py={12}
					borderTop="1px solid"
					borderColor="whiteAlpha.300"
				>
					<Container maxW="container.lg" textAlign="center" px={6}>
						<Heading size="lg" mb={4} color="white">
							Are not just the customer?
							<br />
							<Heading
								size="lg"
								bgGradient="linear(to-r, red.400, teal.500)"
								bgClip="text"
								fontWeight="extrabold"
								cursor="pointer"
							>
								Need to manage or grow your retail business?
							</Heading>
							{/* <br /> */}
							Ready to Transform Your Retail Business?
						</Heading>
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
