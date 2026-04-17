import React, { useEffect, useMemo, useState } from "react";
import {
	Alert,
	AlertDescription,
	AlertIcon,
	AlertTitle,
	Badge,
	Box,
	Button,
	Container,
	Flex,
	Grid,
	Heading,
	HStack,
	Icon,
	Input,
	Progress,
	Select,
	SimpleGrid,
	Spinner,
	Stat,
	StatHelpText,
	StatLabel,
	StatNumber,
	Table,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
	VStack,
	useToast,
} from "@chakra-ui/react";
import { FiActivity, FiCalendar, FiDollarSign, FiPackage, FiShoppingBag, FiTrendingUp, FiUsers, FiAlertTriangle, FiTrendingDown } from "react-icons/fi";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/AdminSidebar";
import * as adminApi from "../../api/admin";

const RANGE_OPTIONS = [
	{ value: "7d", label: "Last 7 days" },
	{ value: "30d", label: "Last 30 days" },
	{ value: "90d", label: "Last 90 days" },
	{ value: "365d", label: "Last 365 days" },
	{ value: "custom", label: "Custom range" },
];

const INTERVAL_OPTIONS = [
	{ value: "day", label: "Daily" },
	{ value: "week", label: "Weekly" },
	{ value: "month", label: "Monthly" },
];

function formatCurrency(value) {
	return `₹${Number(value || 0).toLocaleString("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

function formatCompact(value) {
	return Number(value || 0).toLocaleString("en-IN");
}

function formatPercent(value) {
	return `${Number(value || 0).toFixed(1)}%`;
}

function trendColor(value) {
	if (value > 0) return "green.500";
	if (value < 0) return "red.500";
	return "gray.500";
}

function EmptyPanel({ message }) {
	return (
		<Flex minH="220px" align="center" justify="center" border="1px dashed" borderColor="gray.200" borderRadius="xl" bg="gray.50" px={6}>
			<Text color="var(--text-secondary)" textAlign="center">
				{message}
			</Text>
		</Flex>
	);
}

function KpiCard({ label, value, helpText, subText, accent = "var(--primary-color)", icon }) {
	return (
		<Box
			bg="white"
			borderRadius="2xl"
			border="1px solid"
			borderColor="var(--border-light)"
			boxShadow="var(--shadow-sm)"
			p={5}
			transition="all var(--transition-normal)"
			_hover={{ transform: "translateY(-4px)", boxShadow: "var(--shadow-md)" }}
		>
			<Flex justify="space-between" align="start" gap={4}>
				<Stat>
					<StatLabel color="var(--text-secondary)" fontSize="sm">
						{label}
					</StatLabel>
					<StatNumber fontSize="2xl" color="var(--text-primary)" mt={2}>
						{value}
					</StatNumber>
					{helpText ? (
						<StatHelpText mb={0} color="var(--text-secondary)">
							{helpText}
						</StatHelpText>
					) : null}
					{subText ? (
						<Text fontSize="xs" color="var(--text-secondary)" mt={1}>
							{subText}
						</Text>
					) : null}
				</Stat>
				<Flex
					w="44px"
					h="44px"
					align="center"
					justify="center"
					borderRadius="xl"
					bg="var(--surface-secondary)"
					color={accent}
				>
					<Icon as={icon} boxSize={5} />
				</Flex>
			</Flex>
		</Box>
	);
}

function TrendChartCard({ title, subtitle, data, color = "#0f62fe", metricKey, valueFormatter }) {
	const points = useMemo(() => {
		if (!Array.isArray(data) || data.length === 0) return { polyline: "", items: [], maxValue: 0 };

		const width = 520;
		const height = 210;
		const padding = 26;
		const maxValue = Math.max(...data.map((item) => Number(item[metricKey] || 0)), 1);
		const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

		const items = data.map((item, index) => {
			const rawValue = Number(item[metricKey] || 0);
			const x = padding + (stepX * index);
			const y = height - padding - ((rawValue / maxValue) * (height - padding * 2));
			return { x, y, rawValue, label: item.bucket };
		});

		return {
			items,
			maxValue,
			polyline: items.map((item) => `${item.x},${item.y}`).join(" "),
		};
	}, [data, metricKey]);

	return (
		<Box bg="white" borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" p={5} boxShadow="var(--shadow-sm)">
			<VStack align="stretch" spacing={4}>
				<Box>
					<Heading size="md" color="var(--text-primary)">{title}</Heading>
					<Text color="var(--text-secondary)" fontSize="sm" mt={1}>{subtitle}</Text>
				</Box>

				{!data?.length ? (
					<EmptyPanel message="No trend data available for the selected filters." />
				) : (
					<Box w="full" overflowX="auto">
						<Box minW="520px">
							<svg viewBox="0 0 520 210" width="100%" height="240" role="img" aria-label={title}>
								<defs>
									<linearGradient id={`fill-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor={color} stopOpacity="0.28" />
										<stop offset="100%" stopColor={color} stopOpacity="0.02" />
									</linearGradient>
								</defs>
								<line x1="26" y1="184" x2="494" y2="184" stroke="#e5e7eb" strokeWidth="1.2" />
								<polyline
									fill="none"
									stroke={color}
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
									points={points.polyline}
								/>
								<polygon
									fill={`url(#fill-${metricKey})`}
									points={`26,184 ${points.polyline} 494,184`}
								/>
								{points.items.map((item) => (
									<g key={`${metricKey}-${item.label}`}>
										<circle cx={item.x} cy={item.y} r="4.5" fill={color}>
											<title>{`${item.label}: ${valueFormatter(item.rawValue)}`}</title>
										</circle>
										<text x={item.x} y="202" textAnchor="middle" fontSize="10" fill="#64748b">
											{item.label}
										</text>
									</g>
								))}
							</svg>
						</Box>
					</Box>
				)}
			</VStack>
		</Box>
	);
}

function DistributionCard({ title, subtitle, items, itemKey, valueKey, valueFormatter, colorMap = {} }) {
	const total = useMemo(
		() => items.reduce((sum, item) => sum + Number(item[valueKey] || 0), 0),
		[items, valueKey]
	);

	return (
		<Box bg="white" borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" p={5} boxShadow="var(--shadow-sm)">
			<VStack align="stretch" spacing={4}>
				<Box>
					<Heading size="md" color="var(--text-primary)">{title}</Heading>
					<Text color="var(--text-secondary)" fontSize="sm" mt={1}>{subtitle}</Text>
				</Box>
				{!items?.length ? (
					<EmptyPanel message="Nothing to compare yet for the selected filters." />
				) : (
					<VStack align="stretch" spacing={4}>
						{items.map((item) => {
							const label = item[itemKey];
							const count = Number(item[valueKey] || 0);
							const pct = total ? (count / total) * 100 : 0;
							const tone = colorMap[label] || "var(--primary-color)";
							return (
								<Box key={label}>
									<Flex justify="space-between" mb={1}>
										<Text fontSize="sm" fontWeight="600" color="var(--text-primary)">{label}</Text>
										<Text fontSize="sm" color="var(--text-secondary)">{valueFormatter(count)}</Text>
									</Flex>
									<Progress value={pct} borderRadius="full" bg="gray.100" sx={{ "> div": { background: tone } }} />
								</Box>
							);
						})}
					</VStack>
				)}
			</VStack>
		</Box>
	);
}

function RankedBarsCard({ title, subtitle, items, labelKey, primaryKey, secondaryKey, primaryFormatter, secondaryFormatter, color = "#0f62fe" }) {
	const maxValue = Math.max(...items.map((item) => Number(item[primaryKey] || 0)), 0);

	return (
		<Box bg="white" borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" p={5} boxShadow="var(--shadow-sm)">
			<VStack align="stretch" spacing={4}>
				<Box>
					<Heading size="md" color="var(--text-primary)">{title}</Heading>
					<Text color="var(--text-secondary)" fontSize="sm" mt={1}>{subtitle}</Text>
				</Box>

				{!items?.length ? (
					<EmptyPanel message="No ranked performance data found in this time window." />
				) : (
					<VStack align="stretch" spacing={4}>
						{items.map((item) => {
							const value = Number(item[primaryKey] || 0);
							const pct = maxValue ? (value / maxValue) * 100 : 0;
							return (
								<Box key={`${item[labelKey]}-${item[primaryKey]}`}>
									<Flex justify="space-between" align="center" gap={4} mb={1}>
										<Text fontWeight="600" color="var(--text-primary)">{item[labelKey]}</Text>
										<VStack align="end" spacing={0}>
											<Text fontSize="sm" fontWeight="700" color="var(--text-primary)">{primaryFormatter(value)}</Text>
											{secondaryKey ? (
												<Text fontSize="xs" color="var(--text-secondary)">
													{secondaryFormatter(item[secondaryKey])}
												</Text>
											) : null}
										</VStack>
									</Flex>
									<Box bg="gray.100" borderRadius="full" h="10px" overflow="hidden">
										<Box h="full" w={`${pct}%`} bg={color} borderRadius="full" />
									</Box>
								</Box>
							);
						})}
					</VStack>
				)}
			</VStack>
		</Box>
	);
}

function ProfitWaterfallCard({ title, subtitle, data }) {
	if (!data) {
		return (
			<Box bg="white" borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" p={5} boxShadow="var(--shadow-sm)">
				<VStack align="stretch" spacing={4}>
					<Box>
						<Heading size="md" color="var(--text-primary)">{title}</Heading>
						<Text color="var(--text-secondary)" fontSize="sm" mt={1}>{subtitle}</Text>
					</Box>
					<EmptyPanel message="Profit waterfall data not available." />
				</VStack>
			</Box>
		);
	}

	const rows = Array.isArray(data.breakdown) ? data.breakdown : [];

	return (
		<Box bg="white" borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" p={5} boxShadow="var(--shadow-sm)">
			<VStack align="stretch" spacing={4}>
				<Box>
					<Heading size="md" color="var(--text-primary)">{title}</Heading>
					<Text color="var(--text-secondary)" fontSize="sm" mt={1}>{subtitle}</Text>
				</Box>

				{!rows.length ? (
					<EmptyPanel message="No profit breakdown data available." />
				) : (
					<VStack align="stretch" spacing={3}>
						{rows.map((item, idx) => {
							const isPositive = item.amount >= 0;
							const color = isPositive ? "#16a34a" : "#ef4444";
							return (
								<Box key={`waterfall-${idx}`}>
									<Flex justify="space-between" align="center" mb={1}>
										<Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
											{item.label}
										</Text>
										<Text fontSize="sm" fontWeight="700" color={color}>
											{isPositive ? "+" : ""}{formatCurrency(item.amount)}
										</Text>
									</Flex>
									<Box bg={isPositive ? "green.50" : "red.50"} h="8px" borderRadius="full" />
								</Box>
							);
						})}
						<Box borderTop="2px solid" borderColor="var(--border-light)" pt={3} mt={3}>
							<Flex justify="space-between" align="center">
								<Text fontSize="sm" fontWeight="700" color="var(--text-primary)">
									Net Profit
								</Text>
								<Text fontSize="lg" fontWeight="700" color={data.net_profit >= 0 ? "#16a34a" : "#ef4444"}>
									{data.net_profit >= 0 ? "+" : ""}{formatCurrency(data.net_profit)}
								</Text>
							</Flex>
						</Box>
					</VStack>
				)}
			</VStack>
		</Box>
	);
}

function ExpensesBreakdownCard({ title, subtitle, data }) {
	if (!data || !Array.isArray(data)) {
		return (
			<Box bg="white" borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" p={5} boxShadow="var(--shadow-sm)">
				<VStack align="stretch" spacing={4}>
					<Box>
						<Heading size="md" color="var(--text-primary)">{title}</Heading>
						<Text color="var(--text-secondary)" fontSize="sm" mt={1}>{subtitle}</Text>
					</Box>
					<EmptyPanel message="No expense data available." />
				</VStack>
			</Box>
		);
	}

	const total = data.reduce((sum, item) => sum + Number(item.amount || 0), 0);

	return (
		<Box bg="white" borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" p={5} boxShadow="var(--shadow-sm)">
			<VStack align="stretch" spacing={4}>
				<Box>
					<Heading size="md" color="var(--text-primary)">{title}</Heading>
					<Text color="var(--text-secondary)" fontSize="sm" mt={1}>{subtitle}</Text>
				</Box>

				{!data.length ? (
					<EmptyPanel message="No expenses recorded in this period." />
				) : (
					<VStack align="stretch" spacing={4}>
						{data.map((item, idx) => {
							const amount = Number(item.amount || 0);
							const pct = total ? (amount / total) * 100 : 0;
							return (
								<Box key={`expense-${idx}`}>
									<Flex justify="space-between" mb={1}>
										<Text fontSize="sm" fontWeight="600" color="var(--text-primary)">
											{item.category}
										</Text>
										<Text fontSize="sm" color="var(--text-secondary)">
											{formatCurrency(amount)} ({pct.toFixed(1)}%)
										</Text>
									</Flex>
									<Progress
										value={pct}
										borderRadius="full"
										bg="gray.100"
										height="8px"
										sx={{ "> div": { background: "#f59e0b" } }}
									/>
								</Box>
							);
						})}
					</VStack>
				)}
			</VStack>
		</Box>
	);
}

function AnomaliesCard({ title, subtitle, data }) {
	if (!data || !Array.isArray(data)) {
		return (
			<Box bg="white" borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" p={5} boxShadow="var(--shadow-sm)">
				<VStack align="stretch" spacing={4}>
					<Box>
						<Heading size="md" color="var(--text-primary)">{title}</Heading>
						<Text color="var(--text-secondary)" fontSize="sm" mt={1}>{subtitle}</Text>
					</Box>
					<EmptyPanel message="No anomalies detected." />
				</VStack>
			</Box>
		);
	}

	return (
		<Box bg="white" borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" p={5} boxShadow="var(--shadow-sm)">
			<VStack align="stretch" spacing={4}>
				<Box>
					<Heading size="md" color="var(--text-primary)">{title}</Heading>
					<Text color="var(--text-secondary)" fontSize="sm" mt={1}>{subtitle}</Text>
				</Box>

				{!data.length ? (
					<Flex
						minH="160px"
						align="center"
						justify="center"
						borderRadius="xl"
						bg="green.50"
						border="1px solid"
						borderColor="green.200"
						px={4}
					>
						<Text color="green.700" textAlign="center" fontWeight="600">
							✓ No financial anomalies detected. System is healthy.
						</Text>
					</Flex>
				) : (
					<VStack align="stretch" spacing={3}>
						{data.map((anomaly, idx) => (
							<Alert
								key={`anomaly-${idx}`}
								status={anomaly.severity === 'critical' ? 'error' : anomaly.severity === 'warning' ? 'warning' : 'info'}
								borderRadius="lg"
								variant="left-accent"
							>
								<AlertIcon as={FiAlertTriangle} />
								<Box flex="1">
									<AlertTitle fontSize="sm" fontWeight="600">
										{anomaly.title}
									</AlertTitle>
									<AlertDescription fontSize="xs" mt={1}>
										{anomaly.description}
									</AlertDescription>
								</Box>
							</Alert>
						))}
					</VStack>
				)}
			</VStack>
		</Box>
	);
}

function YoYComparisonCard({ title, subtitle, data }) {
	if (!data || !Array.isArray(data)) {
		return (
			<Box bg="white" borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" p={5} boxShadow="var(--shadow-sm)">
				<VStack align="stretch" spacing={4}>
					<Box>
						<Heading size="md" color="var(--text-primary)">{title}</Heading>
						<Text color="var(--text-secondary)" fontSize="sm" mt={1}>{subtitle}</Text>
					</Box>
					<EmptyPanel message="Year-over-year comparison data not available." />
				</VStack>
			</Box>
		);
	}

	return (
		<Box bg="white" borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" p={5} boxShadow="var(--shadow-sm)">
			<VStack align="stretch" spacing={4}>
				<Box>
					<Heading size="md" color="var(--text-primary)">{title}</Heading>
					<Text color="var(--text-secondary)" fontSize="sm" mt={1}>{subtitle}</Text>
				</Box>

				{!data.length ? (
					<EmptyPanel message="Insufficient historical data for comparison." />
				) : (
					<VStack align="stretch" spacing={4}>
						{data.map((item, idx) => {
							const growth = Number(item.growth_pct || 0);
							const isPositive = growth >= 0;
							return (
								<Box key={`yoy-${idx}`}>
									<Flex justify="space-between" align="center" gap={4} mb={1}>
										<Text fontWeight="600" color="var(--text-primary)" fontSize="sm">
											{item.metric}
										</Text>
										<HStack spacing={2}>
											<VStack align="end" spacing={0}>
												<Text fontSize="xs" color="var(--text-secondary)">Current: {formatCurrency(item.current)}</Text>
												<Text fontSize="xs" color="var(--text-secondary)">Last Year: {formatCurrency(item.previous)}</Text>
											</VStack>
											<Flex
												minW="60px"
												align="center"
												justify="center"
												borderRadius="md"
												bg={isPositive ? "green.50" : "red.50"}
												px={3}
												py={1}
											>
												<Icon as={isPositive ? FiTrendingUp : FiTrendingDown} color={isPositive ? "#16a34a" : "#ef4444"} mr={1} />
												<Text fontSize="sm" fontWeight="700" color={isPositive ? "#16a34a" : "#ef4444"}>
													{isPositive ? "+" : ""}{growth.toFixed(1)}%
												</Text>
											</Flex>
										</HStack>
									</Flex>
									<Box bg="gray.100" borderRadius="full" h="6px" overflow="hidden">
										<Box h="full" w={`${Math.min(Math.abs(growth), 100)}%`} bg={isPositive ? "#16a34a" : "#ef4444"} borderRadius="full" />
									</Box>
								</Box>
							);
						})}
					</VStack>
				)}
			</VStack>
		</Box>
	);
}

export default function AdminAnalytics() {
	const toast = useToast();
	const [draftFilters, setDraftFilters] = useState({
		range: "30d",
		interval: "day",
		store_id: "",
		start_date: "",
		end_date: "",
	});
	const [appliedFilters, setAppliedFilters] = useState({
		range: "30d",
		interval: "day",
		store_id: "",
		start_date: "",
		end_date: "",
	});
	const [analytics, setAnalytics] = useState(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState("");

	// Financial metrics state
	const [financialMetrics, setFinancialMetrics] = useState(null);
	const [yoyComparison, setYoyComparison] = useState(null);
	const [anomalies, setAnomalies] = useState(null);
	const [profitWaterfall, setProfitWaterfall] = useState(null);
	const [expensesBreakdown, setExpensesBreakdown] = useState(null);
	const [financialLoading, setFinancialLoading] = useState(false);
	const [financialError, setFinancialError] = useState("");

	useEffect(() => {
		let active = true;

		async function loadAnalytics() {
			try {
				if (analytics) {
					setRefreshing(true);
				} else {
					setLoading(true);
				}
				setError("");

				const response = await adminApi.getAnalytics(appliedFilters);
				if (!active) return;
				setAnalytics(response?.data || null);
			} catch (err) {
				if (!active) return;
				const message = err?.response?.data?.message || "Unable to load live analytics right now.";
				setError(message);
				toast({
					title: "Analytics unavailable",
					description: message,
					status: "error",
					duration: 4000,
				});
			} finally {
				if (!active) return;
				setLoading(false);
				setRefreshing(false);
			}
		}

		loadAnalytics();
		return () => {
			active = false;
		};
	}, [appliedFilters, toast]);

	// Load financial data in parallel with main analytics
	useEffect(() => {
		let active = true;

		async function loadFinancialData() {
			try {
				setFinancialLoading(true);
				setFinancialError("");

				const [metricsRes, yoyRes, anomaliesRes, waterfallRes, expensesRes] = await Promise.allSettled([
					adminApi.getFinancialMetrics(appliedFilters),
					adminApi.getYoyComparison(appliedFilters),
					adminApi.getFinancialAnomalies(appliedFilters),
					adminApi.getProfitWaterfall(appliedFilters),
					adminApi.getExpenseBreakdown(appliedFilters),
				]);

				if (!active) return;

				// Handle results gracefully - if one fails, others can still display
				if (metricsRes.status === 'fulfilled') setFinancialMetrics(metricsRes.value?.data || null);
				if (yoyRes.status === 'fulfilled') setYoyComparison(yoyRes.value?.data || null);
				if (anomaliesRes.status === 'fulfilled') setAnomalies(anomaliesRes.value?.data || null);
				if (waterfallRes.status === 'fulfilled') setProfitWaterfall(waterfallRes.value?.data || null);
				if (expensesRes.status === 'fulfilled') setExpensesBreakdown(expensesRes.value?.data || null);

				// Only set error if all requests failed
				const failedCount = [metricsRes, yoyRes, anomaliesRes, waterfallRes, expensesRes].filter(p => p.status === 'rejected').length;
				if (failedCount === 5) {
					setFinancialError("Unable to load financial data");
				}
			} catch (err) {
				if (!active) return;
				setFinancialError("Failed to load financial analytics");
			} finally {
				if (!active) return;
				setFinancialLoading(false);
			}
		}

		loadFinancialData();
		return () => {
			active = false;
		};
	}, [appliedFilters]);

	const stores = analytics?.stores || [];
	const kpis = analytics?.kpis || {};
	const charts = analytics?.charts || {};
	const warnings = analytics?.warnings || [];

	function updateDraft(key, value) {
		setDraftFilters((prev) => {
			const next = { ...prev, [key]: value };
			if (key === "range" && value !== "custom") {
				next.start_date = "";
				next.end_date = "";
			}
			if (key === "range" && value === "365d") {
				next.interval = "month";
			}
			return next;
		});
	}

	function applyFilters() {
		setAppliedFilters({ ...draftFilters });
	}

	function resetFilters() {
		const next = {
			range: "30d",
			interval: "day",
			store_id: "",
			start_date: "",
			end_date: "",
		};
		setDraftFilters(next);
		setAppliedFilters(next);
	}

	const statusColors = {
		completed: "#16a34a",
		processing: "#2563eb",
		shipped: "#0ea5e9",
		cancelled: "#ef4444",
		pending: "#f59e0b",
		returned: "#8b5cf6",
	};

	return (
		<Box minH="100vh" bg="var(--surface-light)" display="flex" flexDirection="column">
			<Navbar />

			<Container maxW="container.xl" py={6} flex={1}>
				<Flex gap={6} align="flex-start" direction={{ base: "column", lg: "row" }}>
					<Box display={{ base: "block", lg: "none" }}>
						<AdminSidebar />
					</Box>

					<Box
						as="aside"
						display={{ base: "none", lg: "block" }}
						rounded="2xl"
						overflow="hidden"
						boxShadow="sm"
						bg="var(--surface-card)"
						border="1px solid"
						borderColor="var(--border-light)"
					>
						<AdminSidebar />
					</Box>

					<Box flex="1">
						<VStack spacing={6} align="stretch">
							<Box
								bg="linear-gradient(135deg, #0b3a8f 0%, #0058b8 52%, #0ea5e9 100%)"
								borderRadius="3xl"
								p={{ base: 6, md: 8 }}
								color="white"
								boxShadow="0 26px 64px rgba(0, 90, 180, 0.18)"
							>
								<Grid templateColumns={{ base: "1fr", xl: "1.1fr 0.9fr" }} gap={8} alignItems="center">
									<VStack align="start" spacing={3}>
										<Badge bg="whiteAlpha.180" color="white" px={3} py={1} borderRadius="full">
											Live Admin Analytics
										</Badge>
										<Heading size="lg" color="white">
											Track store growth, transaction movement, and operational health from one live dashboard.
										</Heading>
										<Text color="whiteAlpha.900" maxW="2xl">
											This workspace reads live system data and isolates failures cleanly, so analytics issues do not interrupt the rest of the admin system.
										</Text>
									</VStack>

									<SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
										<Box bg="whiteAlpha.160" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.260" p={4}>
											<Text fontSize="sm" color="whiteAlpha.800">Applied Range</Text>
											<Heading size="md" color="white" mt={1}>{analytics?.filters?.range || appliedFilters.range}</Heading>
										</Box>
										<Box bg="whiteAlpha.160" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.260" p={4}>
											<Text fontSize="sm" color="whiteAlpha.800">Stores In Scope</Text>
											<Heading size="md" color="white" mt={1}>{formatCompact(kpis.storesInScope)}</Heading>
										</Box>
										<Box bg="whiteAlpha.160" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.260" p={4}>
											<Text fontSize="sm" color="whiteAlpha.800">Revenue Growth</Text>
											<Heading size="md" color="white" mt={1}>{formatPercent(kpis.revenueGrowth)}</Heading>
										</Box>
										<Box bg="whiteAlpha.160" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.260" p={4}>
											<Text fontSize="sm" color="whiteAlpha.800">Signup Growth</Text>
											<Heading size="md" color="white" mt={1}>{formatPercent(kpis.signupGrowth)}</Heading>
										</Box>
									</SimpleGrid>
								</Grid>
							</Box>

							<Box
								bg="white"
								borderRadius="2xl"
								border="1px solid"
								borderColor="var(--border-light)"
								p={5}
								boxShadow="var(--shadow-sm)"
							>
								<Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "2fr 1fr 1fr 1fr auto" }} gap={4} alignItems="end">
									<Box>
										<Text fontWeight="700" color="var(--text-primary)" mb={1}>Date Range</Text>
										<Select value={draftFilters.range} onChange={(event) => updateDraft("range", event.target.value)}>
											{RANGE_OPTIONS.map((option) => (
												<option key={option.value} value={option.value}>{option.label}</option>
											))}
										</Select>
									</Box>

									<Box>
										<Text fontWeight="700" color="var(--text-primary)" mb={1}>Grouping</Text>
										<Select value={draftFilters.interval} onChange={(event) => updateDraft("interval", event.target.value)}>
											{INTERVAL_OPTIONS.map((option) => (
												<option key={option.value} value={option.value}>{option.label}</option>
											))}
										</Select>
									</Box>

									<Box>
										<Text fontWeight="700" color="var(--text-primary)" mb={1}>Store Filter</Text>
										<Select value={draftFilters.store_id} onChange={(event) => updateDraft("store_id", event.target.value)}>
											<option value="">All stores</option>
											{stores.map((store) => (
												<option key={store.id} value={store.id}>{store.name}</option>
											))}
										</Select>
									</Box>

									{draftFilters.range === "custom" ? (
										<>
											<Box>
												<Text fontWeight="700" color="var(--text-primary)" mb={1}>Start Date</Text>
												<Input type="date" value={draftFilters.start_date} onChange={(event) => updateDraft("start_date", event.target.value)} />
											</Box>
											<Box>
												<Text fontWeight="700" color="var(--text-primary)" mb={1}>End Date</Text>
												<Input type="date" value={draftFilters.end_date} onChange={(event) => updateDraft("end_date", event.target.value)} />
											</Box>
										</>
									) : null}

									<HStack justify={{ base: "stretch", xl: "end" }} spacing={3}>
										<Button variant="outline" onClick={resetFilters}>
											Reset
										</Button>
										<Button colorScheme="blue" onClick={applyFilters} isLoading={refreshing}>
											Apply
										</Button>
									</HStack>
								</Grid>
							</Box>

							{error ? (
								<Alert status="error" borderRadius="xl">
									<AlertIcon />
									<Box>
										<AlertTitle>Analytics could not be loaded</AlertTitle>
										<AlertDescription>{error}</AlertDescription>
									</Box>
								</Alert>
							) : null}

							{warnings.length ? (
								<Alert status="warning" borderRadius="xl">
									<AlertIcon />
									<Box>
										<AlertTitle>Partial analytics response</AlertTitle>
										<AlertDescription>
											{warnings.join(", ")}. The rest of the dashboard is still available.
										</AlertDescription>
									</Box>
								</Alert>
							) : null}

							{loading ? (
								<Flex minH="360px" justify="center" align="center">
									<VStack spacing={4}>
										<Spinner size="lg" color="var(--primary-color)" />
										<Text color="var(--text-secondary)">Loading live analytics...</Text>
									</VStack>
								</Flex>
							) : (
								<VStack spacing={6} align="stretch">
									{refreshing ? (
										<HStack color="var(--text-secondary)">
											<Spinner size="sm" color="var(--primary-color)" />
											<Text fontSize="sm">Refreshing analytics with the latest filters...</Text>
										</HStack>
									) : null}

									<SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={5}>
										<KpiCard label="Gross Sales" value={formatCurrency(kpis.grossRevenue)} helpText={`Growth ${formatPercent(kpis.revenueGrowth)}`} subText="Total revenue from all customer orders before deductions. Measures overall sales performance." icon={FiDollarSign} />
										<KpiCard label="Paid Sales" value={formatCurrency(kpis.paidRevenue)} helpText={`Paid rate ${formatPercent(kpis.paidRate)}`} subText="Revenue from successfully paid orders. Indicates actual cash inflow from customers." icon={FiTrendingUp} accent="#16a34a" />
										<KpiCard label="COGS" value={formatCurrency(kpis.costOfGoodsSold)} helpText="Cost of goods sold for paid orders" subText="Direct costs of producing goods sold. Essential for calculating gross profit margins." icon={FiPackage} accent="#f97316" />
										<KpiCard label="Gross Profit" value={formatCurrency(kpis.grossProfit)} helpText={`Margin ${formatPercent(kpis.grossProfitMargin)}`} subText="Revenue minus COGS. Shows profitability before operating expenses." icon={FiTrendingUp} accent="#10b981" />
										<KpiCard label="Procurement Spend" value={formatCurrency(kpis.procurementSpend)} helpText={`Supply growth ${formatPercent(kpis.supplyGrowth)}`} subText="Total amount spent purchasing goods from suppliers. Tracks supply chain investment." icon={FiPackage} accent="#f59e0b" />
										<KpiCard label="Net Profit" value={formatCurrency(kpis.netRevenue)} helpText="Paid sales minus COGS and supplier payments" subText="Final profit after all costs. The bottom-line profitability of operations." icon={FiActivity} accent="#0ea5e9" />
										<KpiCard label="Customer Orders" value={formatCompact(kpis.totalCustomerOrders)} helpText={`Completion ${formatPercent(kpis.completionRate)}`} subText="Total number of customer orders placed. Indicates demand and transaction volume." icon={FiShoppingBag} />
										<KpiCard label="Active Customers" value={formatCompact(kpis.activeCustomers)} helpText={`${formatCompact(kpis.newCustomers)} new in range`} subText="Unique customers who placed orders. Measures customer base engagement." icon={FiUsers} accent="#ea580c" />
									</SimpleGrid>

									{/* Revenue & Sales Trends Section */}
									<Box>
										<Heading size="lg" color="var(--text-primary)" mb={4} display="flex" alignItems="center" gap={2}>
											<Icon as={FiTrendingUp} color="var(--primary-color)" />
											Revenue & Sales Trends
										</Heading>
										<Text color="var(--text-secondary)" mb={6}>
											Monitor how sales and procurement evolve over time to identify patterns and growth opportunities.
										</Text>
										<SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
											<TrendChartCard
												title="Sales Trend"
												subtitle="Revenue movement from customer orders in the selected window."
												data={charts.customerTrend || []}
												metricKey="revenue"
												valueFormatter={formatCurrency}
												color="#0f62fe"
											/>
											<TrendChartCard
												title="Procurement Trend"
												subtitle="Supply order spend over time for store operations."
												data={charts.supplyTrend || []}
												metricKey="spend"
												valueFormatter={formatCurrency}
												color="#f59e0b"
											/>
										</SimpleGrid>
									</Box>

									{/* Operational Insights Section */}
									<Box>
										<Heading size="lg" color="var(--text-primary)" mb={4} display="flex" alignItems="center" gap={2}>
											<Icon as={FiActivity} color="var(--primary-color)" />
											Operational Insights
										</Heading>
										<Text color="var(--text-secondary)" mb={6}>
											Understand order fulfillment, customer behavior, and product performance across your stores.
										</Text>
										<SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
											<TrendChartCard
												title="Signup Trend"
												subtitle="New customer, supplier, and store manager onboarding activity."
												data={charts.signupTrend || []}
												metricKey="total"
												valueFormatter={formatCompact}
												color="#16a34a"
											/>
											<DistributionCard
												title="Order Status Breakdown"
												subtitle="Current customer order status distribution."
												items={charts.statusBreakdown || []}
												itemKey="status"
												valueKey="count"
												valueFormatter={formatCompact}
												colorMap={statusColors}
											/>
											<DistributionCard
												title="Payment Method Mix"
												subtitle="How customers are paying across the selected range."
												items={charts.paymentMix || []}
												itemKey="method"
												valueKey="count"
												valueFormatter={formatCompact}
											/>
											<RankedBarsCard
												title="Top Products"
												subtitle="Products contributing the highest customer-order revenue."
												items={charts.topProducts || []}
												labelKey="product_name"
												primaryKey="revenue"
												secondaryKey="units_sold"
												primaryFormatter={formatCurrency}
												secondaryFormatter={(value) => `${formatCompact(value)} units`}
												color="#0ea5e9"
											/>
										</SimpleGrid>
									</Box>

									{/* Store Performance Section */}
									<Box>
										<Heading size="lg" color="var(--text-primary)" mb={4} display="flex" alignItems="center" gap={2}>
											<Icon as={FiPackage} color="var(--primary-color)" />
											Store Performance
										</Heading>
										<Text color="var(--text-secondary)" mb={6}>
											Live view of store-level revenue, procurement, and customer activity across your network.
										</Text>
										<Box bg="white" borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" boxShadow="var(--shadow-sm)" overflow="hidden">
											<Flex justify="space-between" align="center" px={5} py={4} borderBottom="1px solid" borderColor="var(--border-light)">
												<Box>
													<Heading size="md" color="var(--text-primary)">Store Performance</Heading>
													<Text color="var(--text-secondary)" fontSize="sm" mt={1}>
														Live view of store-level revenue, procurement, and customer activity.
													</Text>
												</Box>
												<Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
													Top active stores
												</Badge>
											</Flex>
											{!charts.storePerformance?.length ? (
												<Box p={5}>
													<EmptyPanel message="Store performance will appear here once transactions exist for the selected filters." />
												</Box>
											) : (
												<Box overflowX="auto">
													<Table variant="simple">
														<Thead bg="gray.50">
															<Tr>
																<Th>Store</Th>
																<Th isNumeric>Customer Orders</Th>
																<Th isNumeric>Paid Revenue</Th>
																<Th isNumeric>Procurement</Th>
																<Th isNumeric>Supply Orders</Th>
																<Th isNumeric>Active Customers</Th>
															</Tr>
														</Thead>
														<Tbody>
															{charts.storePerformance.map((row) => (
																<Tr key={row.store_id}>
																	<Td fontWeight="600">{row.store_name}</Td>
																	<Td isNumeric>{formatCompact(row.customer_orders)}</Td>
																	<Td isNumeric>{formatCurrency(row.paid_revenue)}</Td>
																	<Td isNumeric>{formatCurrency(row.procurement_spend)}</Td>
																	<Td isNumeric>{formatCompact(row.supply_orders)}</Td>
																	<Td isNumeric>{formatCompact(row.active_customers)}</Td>
																</Tr>
															))}
														</Tbody>
													</Table>
												</Box>
											)}
										</Box>
									</Box>

									{/* Enhanced Financial Analytics Section */}
									<Box>
										<Heading size="lg" color="var(--text-primary)" mb={4} display="flex" alignItems="center" gap={2}>
											<Icon as={FiDollarSign} color="var(--primary-color)" />
											Financial Analytics
										</Heading>
										<Text color="var(--text-secondary)" mb={6}>
											Deep dive into profitability, expenses, and financial health with automated anomaly detection.
										</Text>
										{financialLoading ? (
											<HStack justify="center" py={10}>
												<Spinner size="sm" color="var(--primary-color)" />
												<Text fontSize="sm" color="var(--text-secondary)">Loading financial analytics...</Text>
											</HStack>
										) : (
											<>
												{financialError ? (
													<Alert status="warning" borderRadius="xl">
														<AlertIcon />
														<Box>
															<AlertTitle>Financial data unavailable</AlertTitle>
															<AlertDescription>{financialError}</AlertDescription>
														</Box>
													</Alert>
												) : null}

												<SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
													<ProfitWaterfallCard
														title="Profit Waterfall"
														subtitle="Breakdown of how gross revenue converts to net profit."
														data={profitWaterfall}
													/>
													<ExpensesBreakdownCard
														title="Expense Categories"
														subtitle="Operating costs distribution across categories."
														data={expensesBreakdown}
													/>
												</SimpleGrid>

												<AnomaliesCard
													title="Financial Anomalies"
													subtitle="Automatically detected issues and unusual patterns in financial data."
													data={anomalies?.anomalies || []}
												/>

												<SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
													<YoYComparisonCard
														title="Year-over-Year Growth"
														subtitle="How current period compares to the same period last year."
														data={yoyComparison?.comparison || []}
													/>
													{financialMetrics ? (
														<Box bg="white" borderRadius="2xl" border="1px solid" borderColor="var(--border-light)" p={5} boxShadow="var(--shadow-sm)">
															<VStack align="stretch" spacing={4}>
																<Box>
																	<Heading size="md" color="var(--text-primary)">Financial Summary</Heading>
																	<Text color="var(--text-secondary)" fontSize="sm" mt={1}>Key financial metrics for the selected period.</Text>
																</Box>
																<SimpleGrid columns={2} spacing={4}>
																	<Stat>
																		<StatLabel fontSize="xs" color="var(--text-secondary)">Gross Profit</StatLabel>
																		<StatNumber fontSize="lg" color="var(--text-primary)" mt={1}>
																			{formatCurrency(financialMetrics.gross_profit)}
																		</StatNumber>
																		<StatHelpText mb={0} fontSize="xs">
																			{formatPercent((financialMetrics.gross_profit_margin || 0) * 100)}
																		</StatHelpText>
																	</Stat>
																	<Stat>
																		<StatLabel fontSize="xs" color="var(--text-secondary)">Net Profit</StatLabel>
																		<StatNumber fontSize="lg" color={financialMetrics.net_profit >= 0 ? "var(--text-primary)" : "red.500"} mt={1}>
																			{formatCurrency(financialMetrics.net_profit)}
																		</StatNumber>
																		<StatHelpText mb={0} fontSize="xs">
																			{formatPercent((financialMetrics.net_profit_margin || 0) * 100)}
																		</StatHelpText>
																	</Stat>
																	<Stat>
																		<StatLabel fontSize="xs" color="var(--text-secondary)">Operating Expenses</StatLabel>
																		<StatNumber fontSize="lg" color="var(--text-primary)" mt={1}>
																			{formatCurrency(financialMetrics.total_operating_expenses || 0)}
																		</StatNumber>
																		<StatHelpText mb={0} fontSize="xs">
																			{formatPercent((financialMetrics.operating_expense_ratio || 0) * 100)}
																		</StatHelpText>
																	</Stat>
																	<Stat>
																		<StatLabel fontSize="xs" color="var(--text-secondary)">Revenue</StatLabel>
																		<StatNumber fontSize="lg" color="var(--text-primary)" mt={1}>
																			{formatCurrency(financialMetrics.total_revenue || 0)}
																		</StatNumber>
																		<StatHelpText mb={0} fontSize="xs">
																			Platform revenue
																		</StatHelpText>
																	</Stat>
																</SimpleGrid>
															</VStack>
														</Box>
													) : null}
												</SimpleGrid>
											</>
										)}
									</Box>
								</VStack>
							)}
						</VStack>
					</Box>
				</Flex>
			</Container>

			<Footer />
		</Box >
	);
}
