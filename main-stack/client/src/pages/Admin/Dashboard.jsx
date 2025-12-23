import React, { useEffect, useState } from "react";
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
	Badge,
	Flex,
	useToast,
	useColorModeValue,
	Icon,
	Stack,
	StackDivider,
	Spinner,
} from "@chakra-ui/react";
import {
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
import AdminSidebar from "../../components/AdminSidebar";
import * as adminApi from "../../api/admin";

export default function AdminDashboard() {
	const toast = useToast();
	const [loading, setLoading] = useState(false);
	const [metrics, setMetrics] = useState({
		totalOrders: 0,
		totalSuppliers: 0,
		totalCustomers: 0,
	});
	const [activitiesState, setActivitiesState] = useState([]);

	useEffect(() => {
		let mounted = true;
		async function load() {
			setLoading(true);
			try {
				const res = await adminApi.getOverview();
				if (!mounted) return;
				setMetrics(res?.data?.metrics || {});
				setActivitiesState(res?.data?.activities || []);
			} catch (err) {
				console.error("failed to load admin overview", err);
				toast({
					title: "Failed to load overview",
					status: "error",
					duration: 4000,
				});
			} finally {
				if (mounted) setLoading(false);
			}
		}
		load();
		return () => (mounted = false);
	}, [toast]);

	// Colors extracted BEFORE any loops
	const bgCard = useColorModeValue("white", "gray.800");
	const bgPage = useColorModeValue("gray.50", "gray.900");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	const textMuted = useColorModeValue("gray.600", "gray.300");
	const iconBg = useColorModeValue("gray.100", "gray.700");
	const subtleCard = useColorModeValue("white", "gray.800");

	const stats = [
		{
			label: "Total Orders",
			value: metrics.totalOrders ?? 0,
			change: "",
			positive: true,
			icon: FiPackage,
			spark: [8, 10, 12, 13, 15, 17],
		},
		{
			label: "Total Suppliers",
			value: metrics.totalSuppliers ?? 0,
			change: "",
			positive: true,
			icon: FiUsers,
			spark: [2, 3, 3, 4, 4, 5],
		},
		{
			label: "Total Customers",
			value: metrics.totalCustomers ?? 0,
			change: "",
			positive: true,
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

	const actions = [
		{ label: "View Reports", icon: FiFileText },
		{ label: "Manage Users", icon: FiUsers },
		{ label: "System Settings", icon: FiSettings },
		{ label: "Backup Data", icon: FiDownloadCloud },
	];

	return (
		<Box minH="100vh" bg={bgPage} display="flex" flexDirection="column">
			<Navbar />

			<Container maxW="container.xl" py={6} flex={1}>
				<Flex gap={6} align="flex-start">
					{/* Sidebar */}
					<Box
						as="aside"
						display={{ base: "none", lg: "block" }}
						rounded="2xl"
						overflow="hidden"
						boxShadow="sm"
						bg={subtleCard}
						border="1px solid"
						borderColor={borderColor}
					>
						<AdminSidebar />
					</Box>

					<Box flex="1">
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
											_hover={{
												transform: "translateY(-6px)",
												boxShadow: "xl",
											}}
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

											{/* Sparkline placeholder */}
											<svg width="100%" height="40">
												<path fill="none" stroke={s.positive ? "#22c55e" : "#ef4444"} strokeWidth="2" />
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
										{/* <Button size="sm" variant="ghost">
											View all
										</Button> */}
									</Flex>

									{/* Constrain height and make scrollable when content overflows */}
									<Box
										maxH={{ base: "220px", md: "320px" }}
										overflowY="auto"
										pr={2} // space for scrollbar so text doesn't jump
										sx={{
											// optional nicer scrollbar for webkit browsers
											"&::-webkit-scrollbar": { width: "8px" },
											"&::-webkit-scrollbar-thumb": { borderRadius: "24px", background: "rgba(0,0,0,0.12)" },
										}}
									>
										<Stack spacing={3} divider={<StackDivider />}>
											{loading && (
												<Flex align="center" justify="center" py={6}>
													<Spinner />
												</Flex>
											)}

											{!loading && activitiesState.length === 0 && (
												<Text color={textMuted}>No recent activity</Text>
											)}

											{!loading &&
												activitiesState.map((a, i) => (
													<Box key={i} p={3} borderRadius="md">
														<Flex justify="space-between" align="start">
															<Box>
																<Text fontWeight="600">{a.title}</Text>
																<Text fontSize="sm" color={textMuted} mt={1}>
																	{a.type} •{" "}
																	{a.created_at ? new Date(a.created_at).toLocaleString() : "—"}
																</Text>
															</Box>

															{/* optional small badge or icon area */}
															<Box ml={3} textAlign="right">
																{/* example: show a short status or time */}
																<Text fontSize="xs" color={textMuted}>
																	{a.short_status || ""}
																</Text>
															</Box>
														</Flex>
													</Box>
												))}
										</Stack>
									</Box>
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
												leftIcon={<Icon as={ac.icon} />}
												variant="outline"
												size="sm"
												onClick={() => toast({ title: ac.label, status: "info" })}
											>
												{ac.label}
											</Button>
										))}
									</VStack>
								</Box>

								{/* Placeholder 3rd column (kept empty intentionally) */}
								<Box
									bg={bgCard}
									p={6}
									borderRadius="lg"
									border="1px solid"
									borderColor={borderColor}
									boxShadow="md"
								>
									<Heading size="md" mb={2}>
										Summary
									</Heading>
									<Text color={textMuted}>Quick summary or KPIs can go here.</Text>
								</Box>
							</SimpleGrid>
						</VStack>
					</Box>
				</Flex>
			</Container>

			<Footer />
		</Box>
	);
}