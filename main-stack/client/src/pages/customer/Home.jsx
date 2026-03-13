import React, { useEffect, useState } from "react";
import {
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
	Text,
	VStack,
	useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
	FaBolt,
	FaBoxOpen,
	FaChartLine,
	FaRobot,
	FaShieldAlt,
	FaShoppingBag,
	FaStore,
	FaUsers,
} from "react-icons/fa";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import * as userApi from "../../api/user";

const featureCards = [
	{
		icon: FaRobot,
		title: "Smarter discovery",
		description: "Browse curated inventory with clearer product context and cleaner purchase flows.",
	},
	{
		icon: FaChartLine,
		title: "Better pricing signals",
		description: "See products that help you buy confidently without friction across screens.",
	},
	{
		icon: FaShieldAlt,
		title: "Reliable shopping",
		description: "Orders, wishlist, cart, and profile tools stay connected through one account experience.",
	},
	{
		icon: FaBolt,
		title: "Faster actions",
		description: "Move from discovery to checkout with fewer taps and more focused page design.",
	},
];

const journeyCards = [
	"Explore products with cleaner search, category, and stock visibility.",
	"Add items to cart or wishlist directly from a more focused catalog experience.",
	"Track every purchase and order update from the same customer workspace.",
];

export default function CustomerHome() {
	const navigate = useNavigate();
	const toast = useToast();
	const [stats, setStats] = useState([
		{ label: "Happy Customers", number: 0, icon: FaUsers },
		{ label: "Categories of Products Available", number: 0, icon: FaBoxOpen },
		{ label: "Stores Connected", number: 0, icon: FaStore },
	]);

	useEffect(() => {
		let mounted = true;

		async function load() {
			try {
				const res = await userApi.getAboutusStat();
				const raw = res?.data?.stats || {};

				if (!mounted) return;

				setStats([
					{
						label: "Happy Customers",
						number: Number(raw.totalCustomers?.count) || 0,
						icon: FaUsers,
					},
					{
						label: "Categories of Products Available",
						number: Number(raw.totalProducts?.count) || 0,
						icon: FaBoxOpen,
					},
					{
						label: "Stores Connected",
						number: Number(raw.totalStores?.count) || 0,
						icon: FaStore,
					},
				]);
			} catch (error) {
				console.error("failed to load stats", error);
				toast({
					title: "Failed to load overview",
					status: "error",
					duration: 4000,
				});
			}
		}

		load();
		return () => {
			mounted = false;
		};
	}, [toast]);

	return (
		<Box minH="100vh" bg="var(--background)" display="flex" flexDirection="column">
			<Navbar />

			<Box flex={1}>
				<Box
					position="relative"
					overflow="hidden"
					bg="linear-gradient(180deg, #eaf3ff 0%, #f8fbff 60%, #ffffff 100%)"
					borderBottom="1px solid"
					borderColor="var(--border-light)"
				>
					<Box
						position="absolute"
						top="-6rem"
						right="-6rem"
						w="22rem"
						h="22rem"
						borderRadius="full"
						bg="rgba(0, 102, 204, 0.10)"
						filter="blur(10px)"
					/>
					<Container maxW="container.xl" py={{ base: 12, md: 20 }}>
						<Grid templateColumns={{ base: "1fr", lg: "1.2fr 0.8fr" }} gap={10} alignItems="center">
							<VStack align="start" spacing={6}>
								<Badge
									bg="var(--primary-lighter)"
									color="var(--primary-dark)"
									px={4}
									py={1.5}
									borderRadius="full"
									fontSize="xs"
									textTransform="uppercase"
									letterSpacing="0.14em"
								>
									Enhanced Customer Experience
								</Badge>
								<Heading
									fontSize={{ base: "3xl", md: "5xl" }}
									lineHeight="1.05"
									letterSpacing="-0.04em"
									maxW="4xl"
								>
									Shop smarter with a cleaner RetailIQ home experience.
								</Heading>
								<Text fontSize="lg" color="var(--text-secondary)" maxW="2xl">
									Discover products, move faster through the catalog, and manage your orders from a customer workspace that matches the updated design language across the app.
								</Text>
								<HStack spacing={4} flexWrap="wrap">
									<Button size="lg" onClick={() => navigate("/customer/products")}>
										Explore Products
									</Button>
									<Button size="lg" variant="outline" onClick={() => navigate("/customer/my-orders")}>
										View My Orders
									</Button>
								</HStack>
							</VStack>

							<Box
								bg="white"
								border="1px solid"
								borderColor="var(--border-light)"
								borderRadius="3xl"
								p={{ base: 6, md: 7 }}
								boxShadow="0 24px 60px rgba(15, 23, 42, 0.10)"
							>
								<VStack align="stretch" spacing={5}>
									<Text
										fontSize="xs"
										fontWeight="700"
										textTransform="uppercase"
										letterSpacing="0.16em"
										color="var(--primary-color)"
									>
										What&apos;s better now
									</Text>
									{journeyCards.map((item, index) => (
										<HStack
											key={item}
											align="flex-start"
											spacing={4}
											bg={index === 1 ? "var(--primary-lighter)" : "var(--surface-secondary)"}
											borderRadius="2xl"
											p={4}
										>
											<Flex
												w="2.25rem"
												h="2.25rem"
												borderRadius="full"
												align="center"
												justify="center"
												bg="white"
												color="var(--primary-color)"
												fontWeight="700"
												flexShrink={0}
											>
												{index + 1}
											</Flex>
											<Text color="var(--text-secondary)">{item}</Text>
										</HStack>
									))}
								</VStack>
							</Box>
						</Grid>
					</Container>
				</Box>

				<Container maxW="container.xl" py={{ base: 10, md: 16 }}>
					<VStack spacing={12} align="stretch">
						<SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
							{stats.map((stat) => (
								<Box
									key={stat.label}
									bg="white"
									border="1px solid"
									borderColor="var(--border-light)"
									borderRadius="2xl"
									p={6}
									boxShadow="var(--shadow-sm)"
								>
									<HStack justify="space-between" align="start">
										<VStack align="start" spacing={2}>
											<Text fontSize="sm" color="var(--text-secondary)">
												{stat.label}
											</Text>
											<Heading size="xl" color="var(--primary-color)">
												{stat.number}
											</Heading>
										</VStack>
										<Flex
											w="3rem"
											h="3rem"
											borderRadius="xl"
											align="center"
											justify="center"
											bg="var(--primary-lighter)"
											color="var(--primary-color)"
										>
											<Icon as={stat.icon} boxSize={5} />
										</Flex>
									</HStack>
								</Box>
							))}
						</SimpleGrid>

						<Box>
							<VStack align="start" spacing={2} mb={6}>
								<Heading size="lg">Why customers will notice the difference</Heading>
								<Text color="var(--text-secondary)">
									The refreshed user side now matches the stronger product and dashboard styling already present in RetailIQ.
								</Text>
							</VStack>
							<SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
								{featureCards.map((feature) => (
									<Box
										key={feature.title}
										bg="white"
										border="1px solid"
										borderColor="var(--border-light)"
										borderRadius="2xl"
										p={6}
										boxShadow="var(--shadow-sm)"
										transition="all var(--transition-normal)"
										_hover={{ transform: "translateY(-4px)", boxShadow: "var(--shadow-md)" }}
									>
										<Flex
											w="3.25rem"
											h="3.25rem"
											borderRadius="xl"
											align="center"
											justify="center"
											bg="var(--primary-lighter)"
											color="var(--primary-color)"
											mb={4}
										>
											<Icon as={feature.icon} boxSize={5} />
										</Flex>
										<Heading size="sm" mb={2}>
											{feature.title}
										</Heading>
										<Text color="var(--text-secondary)" fontSize="sm">
											{feature.description}
										</Text>
									</Box>
								))}
							</SimpleGrid>
						</Box>

						<Box
							bg="linear-gradient(135deg, #0f3d91 0%, #0066cc 60%, #0aa2dd 100%)"
							borderRadius="3xl"
							p={{ base: 7, md: 10 }}
							color="white"
							boxShadow="0 24px 60px rgba(0, 102, 204, 0.20)"
						>
							<Grid templateColumns={{ base: "1fr", lg: "1fr auto" }} gap={8} alignItems="center">
								<VStack align="start" spacing={3}>
									<Heading size="lg" color="white">
										Ready to browse the upgraded storefront?
									</Heading>
									<Text color="whiteAlpha.900" maxW="2xl">
										Open the product catalog, manage your wishlist, or review your latest orders without leaving the updated customer flow.
									</Text>
								</VStack>
								<HStack spacing={4} flexWrap="wrap">
									<Button
										size="lg"
										bg="white"
										color="var(--primary-dark)"
										_hover={{ bg: "whiteAlpha.900" }}
										leftIcon={<FaShoppingBag />}
										onClick={() => navigate("/customer/products")}
									>
										Start Shopping
									</Button>
									<Button
										size="lg"
										variant="outline"
										borderColor="whiteAlpha.700"
										color="white"
										_hover={{ bg: "whiteAlpha.200", borderColor: "whiteAlpha.900" }}
										onClick={() => navigate("/contact-us")}
									>
										Contact Support
									</Button>
								</HStack>
							</Grid>
						</Box>
					</VStack>
				</Container>
			</Box>

			<Footer />
		</Box>
	);
}
