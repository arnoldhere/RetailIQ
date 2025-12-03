import React from "react";
import {
	Box,
	Button,
	Container,
	SimpleGrid,
	Heading,
	Text,
	VStack,
	HStack,
	Stat,
	StatLabel,
	StatNumber,
	StatHelpText,
	Badge,
	Flex,
	useToast,
	useColorModeValue,
	Icon,
	IconButton,
	Menu,
	MenuButton,
	MenuList,
	MenuItem,
	Stack,
} from "@chakra-ui/react";

import {
	FiArrowUpRight,
	FiArrowDownLeft,
	FiAlertTriangle,
	FiUsers,
	FiPackage,
	FiBarChart2,
	FiSettings,
	FiDownloadCloud,
	FiFileText,
} from "react-icons/fi";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function sparklinePath(values = [], width = 90, height = 30, pad = 2) {
	if (values.length === 0) return "";
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min || 1;
	const step = (width - pad * 2) / (values.length - 1);

	return (
		"M" +
		values
			.map((v, i) => {
				const x = pad + step * i;
				const y = pad + (1 - (v - min) / range) * (height - pad * 2);
				return `${x},${y}`;
			})
			.join(" L ")
	);
}

export default function AdminDashboard() {
	const toast = useToast();

	// Colors extracted BEFORE any loops
	const bgCard = useColorModeValue("white", "gray.800");
	const bgPage = useColorModeValue("gray.50", "gray.900");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	const textMuted = useColorModeValue("gray.600", "gray.300");
	const iconBg = useColorModeValue("gray.100", "gray.700");

	const stats = [
		{
			label: "Total Revenue",
			value: "$45,230",
			change: "+12.5%",
			positive: true,
			icon: FiBarChart2,
			spark: [10, 12, 18, 22, 19, 24],
		},
		{
			label: "Total Orders",
			value: "2,847",
			change: "+8.3%",
			positive: true,
			icon: FiPackage,
			spark: [8, 10, 12, 13, 15, 17],
		},
		{
			label: "Avg Order Value",
			value: "$28.40",
			change: "-3.2%",
			positive: false,
			icon: FiUsers,
			spark: [32, 30, 29, 28, 27, 26],
		},
		{
			label: "Stock Alerts",
			value: "58 low",
			change: "12 critical",
			positive: false,
			icon: FiAlertTriangle,
			spark: [3, 4, 6, 9, 7, 12],
		},
	];

	const activities = [
		{ title: "New user registered", tag: "User", time: "5 min ago" },
		{ title: "Stock updated successfully", tag: "Stock", time: "12 min ago" },
		{ title: "System backup completed", tag: "Backup", time: "1 hr ago" },
		{ title: "New supplier added", tag: "Supplier", time: "3 hr ago" },
	];

	const actions = [
		{ label: "View Reports", icon: FiFileText },
		{ label: "Manage Users", icon: FiUsers },
		{ label: "System Settings", icon: FiSettings },
		{ label: "Backup Data", icon: FiDownloadCloud },
	];

	return (
		<Box minH="100vh" bg={bgPage} display="flex" flexDirection="column">
			<Navbar />

			<Container maxW="container.xl" py={10} flex={1}>
				<VStack spacing={8} align="stretch">
					{/* Header */}
					<Flex justify="space-between" align="center" wrap="wrap">
						<Box>
							<Heading size="lg">Admin Dashboard</Heading>
							<Text color={textMuted}>Overview of system performance</Text>
						</Box>

						<HStack>
							<Button variant="ghost" leftIcon={<FiFileText />}>
								Export
							</Button>
							<Button colorScheme="blue" leftIcon={<FiBarChart2 />}>
								Analytics
							</Button>
						</HStack>
					</Flex>

					{/* Stats */}
					<SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
						{stats.map((s, index) => {
							const spark = sparklinePath(s.spark);
							return (
								<Box
									key={index}
									bg={bgCard}
									p={6}
									borderRadius="lg"
									border="1px solid"
									borderColor={borderColor}
									boxShadow="md"
									transition="0.25s"
									_hover={{ transform: "translateY(-6px)", boxShadow: "xl" }}
								>
									<Flex justify="space-between">
										<Box>
											<Stat>
												<StatLabel color={textMuted}>{s.label}</StatLabel>
												<StatNumber>{s.value}</StatNumber>
												<Badge
													mt={2}
													colorScheme={s.positive ? "green" : "red"}
													borderRadius="full"
													px={3}
												>
													{s.change}
												</Badge>
											</Stat>
										</Box>

										<Box
											w="48px"
											h="48px"
											bg={iconBg}
											borderRadius="12px"
											display="flex"
											alignItems="center"
											justifyContent="center"
										>
											<Icon as={s.icon} boxSize={6} />
										</Box>
									</Flex>

									{/* Sparkline */}
									<svg width="100%" height="40">
										<path
											d={spark}
											fill="none"
											stroke={s.positive ? "#22c55e" : "#ef4444"}
											strokeWidth="2"
										/>
									</svg>
								</Box>
							);
						})}
					</SimpleGrid>

					{/* Main grid */}
					<SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
						{/* Activity */}
						<Box
							bg={bgCard}
							p={6}
							borderRadius="lg"
							border="1px solid"
							borderColor={borderColor}
							boxShadow="md"
						>
							<Flex justify="space-between" mb={4}>
								<Heading size="md">Recent Activity</Heading>
								<Button size="sm" variant="ghost">
									View all
								</Button>
							</Flex>

							<VStack align="stretch" spacing={4}>
								{activities.map((a, i) => (
									<Box
										key={i}
										p={4}
										borderRadius="md"
										// bg={useColorModeValue("gray.100", "gray.700")}
									>
										<Text fontWeight="600">{a.title}</Text>
										<Text fontSize="xs" color={textMuted}>
											{a.tag} • {a.time}
										</Text>
									</Box>
								))}
							</VStack>
						</Box>

						{/* Quick actions */}
						<Box
							bg={bgCard}
							p={6}
							borderRadius="lg"
							border="1px solid"
							borderColor={borderColor}
							boxShadow="md"
						>
							<Heading size="md" mb={4}>
								Quick Actions
							</Heading>
							<VStack spacing={4} align="stretch">
								{actions.map((ac, i) => (
									<Button
										key={i}
										leftIcon={<ac.icon />}
										variant="outline"
										size="sm"
										onClick={() => toast({ title: ac.label, status: "info" })}
									>
										{ac.label}
									</Button>
								))}
							</VStack>
						</Box>
					</SimpleGrid>

					{/* Info Banner */}
					<Box
						bg={useColorModeValue("blue.50", "blue.900")}
						p={6}
						borderRadius="lg"
						border="1px solid"
						borderColor={useColorModeValue("blue.200", "blue.700")}
					>
						<Flex
							justify="space-between"
							align="center"
							direction={{ base: "column", md: "row" }}
							gap={3}
						>
							<Box>
								<Heading
									size="sm"
									color={useColorModeValue("blue.800", "white")}
								>
									📊 System Status
								</Heading>
								<Text color={textMuted}>
									All systems operational — Last backup: 2 hours ago
								</Text>
							</Box>

							<Button colorScheme="blue">View Details</Button>
						</Flex>
					</Box>
				</VStack>
			</Container>

			<Footer />
		</Box>
	);
}
