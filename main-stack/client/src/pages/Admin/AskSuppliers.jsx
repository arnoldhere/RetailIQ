import React, { useEffect, useMemo, useState } from "react";
import {
	Badge,
	Box,
	Button,
	Container,
	Flex,
	FormControl,
	FormLabel,
	Grid,
	Heading,
	HStack,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Select,
	SimpleGrid,
	Spinner,
	Stack,
	Table,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
	VStack,
	useToast,
	Icon,
	Divider,
} from "@chakra-ui/react";
import { FiPlus, FiList, FiClock, FiCheckCircle, FiPackage, FiInfo } from "react-icons/fi";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/AdminSidebar";
import * as adminApi from "../../api/admin";
import * as bidApi from "../../api/bids";

const BID_STATUS_COLOR = {
	submitted: "blue",
	accepted: "green",
	rejected: "red",
};

const ASK_STATUS_COLOR = {
	open: "green",
	closed: "orange",
	cancelled: "red",
};

export default function AskSuppliers() {
	const toast = useToast();

	const [products, setProducts] = useState([]);
	const [stores, setStores] = useState([]);
	const [asks, setAsks] = useState([]);
	const [bids, setBids] = useState([]);

	const [loadingSetup, setLoadingSetup] = useState(false);
	const [loadingAsks, setLoadingAsks] = useState(false);
	const [loadingBids, setLoadingBids] = useState(false);
	const [acceptingBidId, setAcceptingBidId] = useState(null);

	const [bidsModalOpen, setBidsModalOpen] = useState(false);
	const [currentAskId, setCurrentAskId] = useState(null);
	const [currentAskStatus, setCurrentAskStatus] = useState("open");

	const [askStatusFilter, setAskStatusFilter] = useState("all");
	const [selectedStore, setSelectedStore] = useState("");
	const [deliverAt, setDeliverAt] = useState("");

	const [form, setForm] = useState({
		product_id: "",
		quantity: "",
		min_price: "",
		expires_at: "",
		note: "",
	});

	useEffect(() => {
		let mounted = true;

		async function load() {
			try {
				setLoadingSetup(true);
				const [productsRes, storesRes] = await Promise.all([
					adminApi.getProducts(100, 0),
					adminApi.getStores(100, 0),
				]);

				if (!mounted) return;

				setProducts(productsRes?.data?.products || []);
				setStores(storesRes?.data?.stores || []);
			} catch (error) {
				console.error(error);
				toast({ title: "Failed to load ask configuration", status: "error" });
			} finally {
				if (mounted) setLoadingSetup(false);
			}
		}

		load();
		fetchAsks("all");

		return () => {
			mounted = false;
		};
	}, [toast]);

	async function fetchAsks(status = askStatusFilter) {
		try {
			setLoadingAsks(true);
			const filters = status && status !== "all" ? { status } : {};
			const res = await bidApi.getAdminAsks(100, 0, filters);
			setAsks(res?.data?.asks || []);
		} catch (error) {
			console.error(error);
			toast({ title: "Failed to load asks", status: "error" });
		} finally {
			setLoadingAsks(false);
		}
	}

	async function openBids(ask) {
		setCurrentAskId(ask.id);
		setCurrentAskStatus(ask.status || "open");
		setSelectedStore("");
		setDeliverAt("");
		setBidsModalOpen(true);
		setLoadingBids(true);

		try {
			const res = await bidApi.adminListBids(ask.id);
			setBids(res?.data?.bids || []);
		} catch (error) {
			console.error(error);
			setBids([]);
			toast({ title: "Failed to load bids", status: "error" });
		} finally {
			setLoadingBids(false);
		}
	}

	const closeBids = () => {
		setBidsModalOpen(false);
		setCurrentAskId(null);
		setCurrentAskStatus("open");
		setBids([]);
		setSelectedStore("");
		setDeliverAt("");
		setAcceptingBidId(null);
	};

	const handleCreate = async () => {
		const qty = parseInt(form.quantity, 10);
		if (!form.product_id || !Number.isInteger(qty) || qty <= 0) {
			return toast({ title: "Product and valid quantity required", status: "warning" });
		}

		try {
			await bidApi.createAsk({
				...form,
				quantity: qty,
				min_price: form.min_price === "" ? null : Number(form.min_price),
				expires_at: form.expires_at || null,
			});

			toast({ title: "Ask created", status: "success" });
			setForm({
				product_id: "",
				quantity: "",
				min_price: "",
				expires_at: "",
				note: "",
			});
			fetchAsks();
		} catch (error) {
			console.error(error);
			toast({
				title: error?.response?.data?.message || "Failed to create ask",
				status: "error",
			});
		}
	};

	const handleClose = async (id) => {
		try {
			await bidApi.closeAsk(id);
			toast({ title: "Ask closed", status: "success" });
			fetchAsks();
		} catch (error) {
			console.error(error);
			toast({
				title: error?.response?.data?.message || "Failed to close ask",
				status: "error",
			});
		}
	};

	const handleAcceptBid = async (bid) => {
		const storeId = parseInt(selectedStore, 10);
		if (!Number.isInteger(storeId) || storeId <= 0) {
			return toast({ title: "Select a store", status: "warning" });
		}
		if (bid.status !== "submitted") {
			return toast({ title: "Only submitted bids can be accepted", status: "warning" });
		}
		if (currentAskStatus !== "open") {
			return toast({ title: "Ask is closed", status: "warning" });
		}

		try {
			setAcceptingBidId(bid.id);
			const res = await bidApi.acceptBid(bid.id, {
				store_id: storeId,
				deliver_at: deliverAt || null,
			});
			const summary = res?.data?.paymentSummary;
			toast({
				title: "Bid accepted and supply order created",
				description: summary
					? `10% confirmation payment recorded: ₹${Number(summary.totalPaid || 0).toFixed(2)}. Remaining balance: ₹${Number(summary.remainingAmount || 0).toFixed(2)}.`
					: res?.data?.message,
				status: "success",
				duration: 5000,
			});
			closeBids();
			fetchAsks();
		} catch (error) {
			console.error(error);
			toast({
				title: error?.response?.data?.message || "Failed to accept bid",
				status: "error",
			});
		} finally {
			setAcceptingBidId(null);
		}
	};

	const getSupplierLabel = (bid) => {
		const userName = `${bid.firstname || ""} ${bid.lastname || ""}`.trim();
		if (userName) return userName;
		if (bid.supplier_name) return bid.supplier_name;
		if (bid.supplier_email) return bid.supplier_email;
		return `Supplier #${bid.supplier_id}`;
	};

	const overview = useMemo(() => {
		const open = asks.filter((ask) => ask.status === "open").length;
		const closed = asks.filter((ask) => ask.status === "closed").length;
		const activeBids = asks.reduce((count, ask) => count + Number(ask.bids_count || 0), 0);
		return [
			{ label: "Open Asks", value: open, icon: FiClock, color: "blue.500" },
			{ label: "Closed", value: closed, icon: FiCheckCircle, color: "orange.500" },
			{ label: "Active Bids", value: activeBids, icon: FiList, color: "purple.500" },
		];
	}, [asks]);

	return (
		<Box minH="100vh" bg="#F9FAFB" display="flex" flexDirection="column">
			<Navbar />

			<Container maxW="container.xl" py={8} flex={1}>
				<Flex gap={8} direction={{ base: "column", lg: "row" }} align="flex-start">
					{/* Sidebar */}
					<Box
						as="aside"
						display={{ base: "none", lg: "block" }}
						w="280px"
						position="sticky"
						top="20px"
					>
						<AdminSidebar />
					</Box>

					{/* Main Content */}
					<VStack flex="1" spacing={8} align="stretch" w="full">
						{/* Hero Section */}
						<Box
							bg="white"
							borderRadius="24px"
							p={{ base: 6, md: 8 }}
							boxShadow="sm"
							border="1px solid"
							borderColor="gray.100"
						>
							<Stack direction={{ base: "column", md: "row" }} justify="space-between" align="center" spacing={6}>
								<VStack align="start" spacing={1}>
									<Heading size="lg" fontWeight="800" letterSpacing="-0.02em" color="gray.800">
										Procurement Hub
									</Heading>
									<Text color="gray.500" fontSize="md">
										Manage inventory asks and supplier negotiations.
									</Text>
								</VStack>

								<HStack spacing={4} w={{ base: "full", md: "auto" }}>
									{overview.map((item) => (
										<VStack key={item.label} align="center" px={4} borderLeft="1px solid" borderColor="gray.100">
											<Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">
												{item.label}
											</Text>
											<Text fontSize="xl" fontWeight="800" color="gray.700">{item.value}</Text>
										</VStack>
									))}
								</HStack>
							</Stack>
						</Box>

						<Grid templateColumns={{ base: "1fr", xl: "380px 1fr" }} gap={8}>
							{/* Left Column: Form */}
							<Box
								bg="white"
								borderRadius="24px"
								p={6}
								border="1px solid"
								borderColor="gray.100"
								boxShadow="sm"
								height="fit-content"
							>
								<VStack align="stretch" spacing={6}>
									<HStack>
										<Icon as={FiPlus} color="blue.500" boxSize={5} />
										<Heading size="sm">Create New Ask</Heading>
									</HStack>
									<Divider />

									{loadingSetup ? (
										<Flex justify="center" py={10}><Spinner color="blue.500" /></Flex>
									) : (
										<Stack spacing={4}>
											<FormControl isRequired>
												<FormLabel fontSize="xs" fontWeight="bold">PRODUCT</FormLabel>
												<Select
													size="md"
													borderRadius="xl"
													placeholder="Search product..."
													value={form.product_id}
													onChange={(e) => setForm({ ...form, product_id: e.target.value })}
												>
													{products.map((p) => (
														<option key={p.id} value={p.id}>{p.name}</option>
													))}
												</Select>
											</FormControl>

											<Grid templateColumns="1fr 1fr" gap={4}>
												<FormControl isRequired>
													<FormLabel fontSize="xs" fontWeight="bold">QUANTITY</FormLabel>
													<Input
														type="number"
														borderRadius="xl"
														placeholder="0"
														value={form.quantity}
														onChange={(e) => setForm({ ...form, quantity: e.target.value })}
													/>
												</FormControl>
												<FormControl>
													<FormLabel fontSize="xs" fontWeight="bold">TARGET PRICE</FormLabel>
													<Input
														type="number"
														borderRadius="xl"
														placeholder="Optional"
														value={form.min_price}
														onChange={(e) => setForm({ ...form, min_price: e.target.value })}
													/>
												</FormControl>
											</Grid>

											<FormControl>
												<FormLabel fontSize="xs" fontWeight="bold">EXPIRY DATE</FormLabel>
												<Input
													type="datetime-local"
													borderRadius="xl"
													value={form.expires_at}
													onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
												/>
											</FormControl>

											<FormControl>
												<FormLabel fontSize="xs" fontWeight="bold">SPECIAL NOTES</FormLabel>
												<Input
													borderRadius="xl"
													placeholder="e.g. Delivery terms..."
													value={form.note}
													onChange={(e) => setForm({ ...form, note: e.target.value })}
												/>
											</FormControl>

											<Button
												colorScheme="blue"
												size="lg"
												borderRadius="xl"
												mt={2}
												leftIcon={<FiPlus />}
												onClick={handleCreate}
											>
												Post Ask
											</Button>
										</Stack>
									)}
								</VStack>
							</Box>

							{/* Right Column: List */}
							<Box
								bg="white"
								borderRadius="24px"
								p={6}
								border="1px solid"
								borderColor="gray.100"
								boxShadow="sm"
							>
								<VStack align="stretch" spacing={6}>
									<Flex justify="space-between" align="center">
										<HStack>
											<Icon as={FiPackage} color="purple.500" boxSize={5} />
											<Heading size="sm">Ask Pipeline</Heading>
										</HStack>
										<HStack>
											<Select
												size="sm"
												borderRadius="full"
												bg="gray.50"
												value={askStatusFilter}
												onChange={(e) => {
													setAskStatusFilter(e.target.value);
													fetchAsks(e.target.value);
												}}
											>
												<option value="all">All Status</option>
												<option value="open">Open</option>
												<option value="closed">Closed</option>
											</Select>
											<Button size="sm" variant="ghost" onClick={() => fetchAsks()}>Refresh</Button>
										</HStack>
									</Flex>

									<Box overflowX="auto">
										<Table variant="simple" size="sm">
											<Thead>
												<Tr>
													<Th border="none" color="gray.400">Product</Th>
													<Th border="none" color="gray.400">Req. Qty</Th>
													<Th border="none" color="gray.400">Bids</Th>
													<Th border="none" color="gray.400">Status</Th>
													<Th border="none" textAlign="right">Action</Th>
												</Tr>
											</Thead>
											<Tbody>
												{asks.map((ask) => (
													<Tr key={ask.id} _hover={{ bg: "gray.50" }} transition="0.2s">
														<Td fontWeight="600" py={4}>{ask.product_name}</Td>
														<Td>{ask.quantity}</Td>
														<Td>
															<HStack>
																<Text fontWeight="bold">{ask.bids_count || 0}</Text>
																{Number(ask.accepted_bids_count) > 0 && (
																	<Badge colorScheme="green" variant="subtle" borderRadius="full" fontSize="10px">Filled</Badge>
																)}
															</HStack>
														</Td>
														<Td>
															<Badge
																px={2}
																py={0.5}
																borderRadius="full"
																variant="solid"
																colorScheme={ASK_STATUS_COLOR[ask.status]}
															>
																{ask.status}
															</Badge>
														</Td>
														<Td textAlign="right">
															<HStack justify="flex-end">
																<Button size="xs" colorScheme="blue" variant="ghost" onClick={() => openBids(ask)}>
																	View Bids
																</Button>
																{ask.status === "open" && (
																	<Button size="xs" colorScheme="red" variant="ghost" onClick={() => handleClose(ask.id)}>
																		Stop
																	</Button>
																)}
															</HStack>
														</Td>
													</Tr>
												))}
											</Tbody>
										</Table>
									</Box>

									{loadingAsks && <Flex justify="center" py={10}><Spinner /></Flex>}
									{!loadingAsks && asks.length === 0 && (
										<Text textAlign="center" py={10} color="gray.400">No active asks found.</Text>
									)}
								</VStack>
							</Box>
						</Grid>
					</VStack>
				</Flex>
			</Container>

			{/* Bids Modal Improvement */}
			<Modal isOpen={bidsModalOpen} onClose={closeBids} size="5xl" isCentered>
				<ModalOverlay backdropFilter="blur(4px)" />
				<ModalContent borderRadius="3xl" p={2}>
					<ModalHeader fontSize="xl" fontWeight="800">
						Supplier Submissions <Badge ml={2} colorScheme="blue">ID #{currentAskId}</Badge>
					</ModalHeader>
					<ModalCloseButton mt={4} mr={4} />
					<ModalBody>
						<VStack align="stretch" spacing={6}>
							{/* Fulfillment Options Box */}
							<Box bg="blue.50" p={5} borderRadius="2xl">
								<HStack spacing={4}>
									<Icon as={FiInfo} color="blue.500" />
									<Text fontWeight="bold" fontSize="sm" color="blue.700">Set Delivery Destination for the selected bid:</Text>
								</HStack>
								<Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} mt={3}>
									<FormControl isRequired>
										<Select
											bg="white"
											borderRadius="xl"
											value={selectedStore}
											placeholder="Assign to Store"
											onChange={(e) => setSelectedStore(e.target.value)}
										>
											{stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
										</Select>
									</FormControl>
									<Input
										type="datetime-local"
										bg="white"
										borderRadius="xl"
										value={deliverAt}
										onChange={(e) => setDeliverAt(e.target.value)}
									/>
								</Grid>
							</Box>

							{loadingBids ? (
								<Flex justify="center" py={10}><Spinner /></Flex>
							) : (
								<Box border="1px solid" borderColor="gray.100" borderRadius="2xl" overflow="hidden">
									<Table variant="simple" size="md">
										<Thead bg="gray.50">
											<Tr>
												<Th>Supplier</Th>
												<Th>Offer Price</Th>
												<Th>Quantity</Th>
												<Th>Message</Th>
												<Th textAlign="right">Action</Th>
											</Tr>
										</Thead>
										<Tbody>
											{bids.map((bid) => (
												<Tr key={bid.id}>
													<Td fontWeight="600">{getSupplierLabel(bid)}</Td>
													<Td color="green.600" fontWeight="bold">₹{Number(bid.price).toFixed(2)}</Td>
													<Td>{bid.quantity}</Td>
													<Td maxW="200px" isTruncated fontSize="sm" color="gray.500">{bid.message || "-"}</Td>
													<Td textAlign="right">
														<Button
															size="sm"
															colorScheme="green"
															borderRadius="full"
															px={6}
															isDisabled={bid.status !== "submitted" || currentAskStatus !== "open"}
															isLoading={acceptingBidId === bid.id}
															onClick={() => handleAcceptBid(bid)}
														>
															Accept & Order
														</Button>
													</Td>
												</Tr>
											))}
										</Tbody>
									</Table>
								</Box>
							)}
						</VStack>
					</ModalBody>
					<ModalFooter>
						<Button variant="ghost" onClick={closeBids} borderRadius="xl">Dismiss</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			<Footer />
		</Box>
	);
}
