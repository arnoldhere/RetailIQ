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
	Icon,
	Stack,
	StackDivider,
	Spinner,
	FormControl,
	FormLabel,
	Select,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalCloseButton,
	useDisclosure,
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
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
	const toast = useToast();
	const navigate = useNavigate();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [loading, setLoading] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [metrics, setMetrics] = useState({
		totalOrders: 0,
		totalSuppliers: 0,
		totalCustomers: 0,
	});
	const [activitiesState, setActivitiesState] = useState([]);
	const [exportConfig, setExportConfig] = useState({
		report: "users_list",
		format: "csv",
		interval: "month",
	});

	const reportOptions = [
		{
			value: "users_list",
			label: "Users List",
			description: "Full user directory export with account status and signup dates.",
			recommendedFormat: "csv",
		},
		{
			value: "signup_growth",
			label: "Signup Growth",
			description: "User signup growth grouped by year, month, week, or day.",
			recommendedFormat: "csv",
		},
		{
			value: "orders_details",
			label: "Orders Details",
			description: "Detailed customer order export with customer and payment status data.",
			recommendedFormat: "csv",
		},
		{
			value: "transactional_traffic",
			label: "Transactional Traffic",
			description: "Traffic summary for recent transactions with daily activity totals.",
			recommendedFormat: "pdf",
		},
		{
			value: "orders_report",
			label: "Orders Report",
			description: "Combined customer and supply order summary for operations review.",
			recommendedFormat: "pdf",
		},
		{
			value: "supplier_report",
			label: "Supplier Report",
			description: "Supplier activity, order value, and payment coverage summary.",
			recommendedFormat: "pdf",
		},
	];

	const intervalOptions = [
		{ value: "year", label: "Year" },
		{ value: "month", label: "Month" },
		{ value: "week", label: "Week" },
		{ value: "day", label: "Day" },
	];

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
	const bgCard = "var(--surface-card)";
	const bgPage = "var(--surface-light)";
	const borderColor = "var(--border-light)";
	const textMuted = "var(--text-secondary)";
	const iconBg = "var(--surface-elevated)";
	const subtleCard = "var(--surface-card)";

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
			value: metrics.totalProducts ?? 0,
			change: "",
			positive: true,
			icon: FiUsers,
			spark: [32, 30, 29, 28, 27, 26],
		},
		{
			label: "Total Products",
			value: metrics.totalProducts ?? 0,
			change: "",
			positive: false,
			icon: FiPackage,
			spark: [3, 4, 6, 9, 7, 12],
		},
	];

	const actions = [
		{ label: "View Reports", icon: FiFileText },
		{ label: "Manage Users", icon: FiUsers },
		{ label: "System Settings", icon: FiSettings },
		{ label: "Backup Data", icon: FiDownloadCloud },
	];

	const selectedReport = reportOptions.find((option) => option.value === exportConfig.report) || reportOptions[0];

	function readFilenameFromHeaders(headers, fallbackName) {
		const contentDisposition = headers?.["content-disposition"] || headers?.["Content-Disposition"];
		if (!contentDisposition) return fallbackName;

		const match = contentDisposition.match(/filename="?([^"]+)"?/i);
		return match?.[1] || fallbackName;
	}

	function updateExportConfig(key, value) {
		if (key === "report") {
			const nextReport = reportOptions.find((option) => option.value === value);
			setExportConfig((prev) => ({
				...prev,
				report: value,
				format: nextReport?.recommendedFormat || prev.format,
			}));
			return;
		}

		setExportConfig((prev) => ({ ...prev, [key]: value }));
	}

	async function handleExport() {
		try {
			setExporting(true);
			const res = await adminApi.exportReport(
				exportConfig.report,
				exportConfig.format,
				exportConfig.interval
			);

			const fallbackName = `${exportConfig.report}.${exportConfig.format}`;
			const fileName = readFilenameFromHeaders(res?.headers, fallbackName);
			const mimeType = res?.headers?.["content-type"] || "application/octet-stream";
			const blob = new Blob([res.data], { type: mimeType });
			const url = window.URL.createObjectURL(blob);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = fileName;
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			window.URL.revokeObjectURL(url);

			toast({
				title: "Export ready",
				description: `${selectedReport.label} downloaded successfully.`,
				status: "success",
				duration: 3000,
			});
			onClose();
		} catch (err) {
			console.error("failed to export report", err);
			toast({
				title: "Export failed",
				description: err?.response?.data?.message || "Unable to generate the selected report.",
				status: "error",
				duration: 4000,
			});
		} finally {
			setExporting(false);
		}
	}

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
									<Button variant="ghost" leftIcon={<FiFileText />} onClick={onOpen}>
										Export
									</Button>
									<Button colorScheme="blue" leftIcon={<FiBarChart2 />} onClick={() => navigate("/admin/analytics")}>
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
											borderRadius="12px"
											border="1px solid"
											borderColor={borderColor}
											boxShadow="var(--shadow-sm)"
											transition="all var(--transition-normal)"
											_hover={{
												transform: "translateY(-6px)",
												boxShadow: "var(--shadow-lg)",
												borderColor: "var(--primary-color)",
											}}
										>
											<Flex justify="space-between">
												<Box>
													<Stat>
														<StatLabel color={textMuted}>{s.label}</StatLabel>
														<StatNumber color="var(--primary-color)" fontSize="28px" fontWeight="700">{s.value}</StatNumber>
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
													color="var(--primary-color)"
													transition="all var(--transition-fast)"
												>
													<Icon as={s.icon} boxSize={6} />
												</Box>
											</Flex>

											{/* Sparkline placeholder */}
											<svg width="100%" height="40">
												<path fill="none" stroke={s.positive ? "#10b981" : "#ef4444"} strokeWidth="2" />
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

			<Modal isOpen={isOpen} onClose={onClose} isCentered>
				<ModalOverlay />
				<ModalContent borderRadius="2xl">
					<ModalHeader>Export Report</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<VStack spacing={5} align="stretch">
							<FormControl>
								<FormLabel fontWeight="600">Report Type</FormLabel>
								<Select
									value={exportConfig.report}
									onChange={(event) => updateExportConfig("report", event.target.value)}
								>
									{reportOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</Select>
							</FormControl>

							<Box bg="gray.50" borderRadius="xl" px={4} py={3} border="1px solid" borderColor="gray.100">
								<Text fontWeight="600" color="gray.700">{selectedReport.label}</Text>
								<Text mt={1} fontSize="sm" color={textMuted}>
									{selectedReport.description}
								</Text>
							</Box>

							<FormControl>
								<FormLabel fontWeight="600">File Format</FormLabel>
								<Select
									value={exportConfig.format}
									onChange={(event) => updateExportConfig("format", event.target.value)}
								>
									<option value="csv">CSV</option>
									<option value="pdf">PDF</option>
								</Select>
							</FormControl>

							{exportConfig.report === "signup_growth" && (
								<FormControl>
									<FormLabel fontWeight="600">Signup Interval</FormLabel>
									<Select
										value={exportConfig.interval}
										onChange={(event) => updateExportConfig("interval", event.target.value)}
									>
										{intervalOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</Select>
								</FormControl>
							)}

							<Text fontSize="sm" color={textMuted}>
								Recommended format for this report: {selectedReport.recommendedFormat.toUpperCase()}
							</Text>
						</VStack>
					</ModalBody>
					<ModalFooter>
						<Button variant="ghost" mr={3} onClick={onClose}>
							Cancel
						</Button>
						<Button
							colorScheme="blue"
							leftIcon={<FiDownloadCloud />}
							onClick={handleExport}
							isLoading={exporting}
							loadingText="Preparing"
						>
							Download
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			<Footer />
		</Box>
	);
}
