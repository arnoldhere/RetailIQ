import React, { useEffect, useMemo, useState } from "react";
import {
	Badge,
	Box,
	Button,
	Container,
	Flex,
	FormControl,
	FormLabel,
	HStack,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Spinner,
	Table,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
	VStack,
	Heading,
} from "@chakra-ui/react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SupplierSidebar from "../../components/SupplierSidebar";
import * as bidApi from "../../api/bids";
import { useToast } from "@chakra-ui/react";

const BID_STATUS_COLOR = {
	submitted: "blue",
	accepted: "green",
	rejected: "red",
};

export default function SupplierBids() {
	const toast = useToast();
	const [asks, setAsks] = useState([]);
	const [supplierBids, setSupplierBids] = useState([]);
	const [isOpen, setIsOpen] = useState(false);
	const [activeAsk, setActiveAsk] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState({ price: "", quantity: "", message: "" });

	useEffect(() => {
		loadData();
	}, []);

	async function loadData() {
		try {
			setLoading(true);
			const [askRes, bidRes] = await Promise.all([
				bidApi.getAsks(100, 0),
				bidApi.getSupplierBids(),
			]);
			setAsks(askRes?.data?.asks || []);
			setSupplierBids(bidRes?.data?.bids || []);
		} catch (err) {
			console.error(err);
			toast({ title: "Failed to load asks and bids", status: "error" });
		} finally {
			setLoading(false);
		}
	}

	const latestBidByAsk = useMemo(() => {
		const map = {};
		for (const bid of supplierBids) {
			if (!map[bid.ask_id]) {
				map[bid.ask_id] = bid;
			}
		}
		return map;
	}, [supplierBids]);

	function openBidModal(ask) {
		const existing = latestBidByAsk[ask.id];
		setActiveAsk(ask);
		setForm({
			price: existing?.status === "submitted" ? String(existing.price || "") : "",
			quantity:
				existing?.status === "submitted"
					? String(existing.quantity || ask.quantity || "")
					: String(ask.quantity || ""),
			message: existing?.status === "submitted" ? String(existing.message || "") : "",
		});
		setIsOpen(true);
	}

	function closeModal() {
		setIsOpen(false);
		setActiveAsk(null);
	}

	async function submitBid() {
		if (!activeAsk) return;
		const price = Number(form.price);
		const quantity = parseInt(form.quantity, 10);
		if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
			return toast({ title: "Price and quantity must be positive", status: "warning" });
		}

		try {
			setSubmitting(true);
			const res = await bidApi.placeBid(activeAsk.id, {
				...form,
				price,
				quantity,
			});
			toast({
				title: res?.data?.message || "Bid submitted",
				status: "success",
			});
			closeModal();
			await loadData();
		} catch (err) {
			console.error(err);
			toast({
				title: err?.response?.data?.message || "Failed to place bid",
				status: "error",
			});
		} finally {
			setSubmitting(false);
		}
	}

	function formatDate(dateValue) {
		if (!dateValue) return "No expiry";
		const dt = new Date(dateValue);
		if (Number.isNaN(dt.getTime())) return String(dateValue);
		return dt.toLocaleString();
	}

	return (
		<Box minH="100vh" bg="var(--background)" display="flex" flexDirection="column">
			<Navbar />

			<Container maxW="container.xl" py={6} flex={1}>
				<Flex gap={6} align="flex-start" direction={{ base: "column", lg: "row" }}>
					<Box display={{ base: "block", lg: "none" }}>
						<SupplierSidebar />
					</Box>

					<Box
						as="aside"
						display={{ base: "none", lg: "block" }}
						rounded="2xl"
						overflow="hidden"
						boxShadow="sm"
						bg="var(--surface)"
						border="1px solid"
						borderColor="var(--border-light)"
					>
						<SupplierSidebar />
					</Box>

					<VStack flex="1" spacing={6} align="stretch">
						<Box
							bg="linear-gradient(135deg, #0f3d91 0%, #0066cc 60%, #0aa2dd 100%)"
							borderRadius="3xl"
							p={{ base: 6, md: 8 }}
							color="white"
							boxShadow="0 24px 60px rgba(0, 102, 204, 0.18)"
						>
							<HStack justify="space-between" align="start" flexWrap="wrap" spacing={4}>
								<Box>
									<Text fontSize="xs" textTransform="uppercase" letterSpacing="0.18em" fontWeight="700" color="whiteAlpha.900">
										Supplier Bids
									</Text>
									<Heading size="lg" color="white" mt={2}>
										Review admin asks and place or update bids from a cleaner supplier workspace.
									</Heading>
								</Box>
								<Button bg="white" color="var(--primary-dark)" _hover={{ bg: "whiteAlpha.900" }} onClick={loadData}>
									Refresh
								</Button>
							</HStack>
						</Box>

						<Box
							bg="white"
							border="1px solid"
							borderColor="var(--border-light)"
							borderRadius="3xl"
							p={{ base: 5, md: 6 }}
							boxShadow="var(--shadow-sm)"
						>
							<VStack spacing={4} align="stretch">
								<Box>
									<Heading size="md">Bid Opportunities</Heading>
									<Text color="var(--text-secondary)" mt={1}>
										Compare ask details with your latest submitted bid for each request.
									</Text>
								</Box>

								{loading ? (
									<Flex justify="center" py={12}>
										<Spinner color="var(--primary-color)" />
									</Flex>
								) : asks.length === 0 ? (
									<Box border="1px dashed" borderColor="var(--border-color)" borderRadius="2xl" p={8} textAlign="center">
										<Text color="var(--text-secondary)">No open asks available right now.</Text>
									</Box>
								) : (
									<Box border="1px solid" borderColor="var(--border-light)" borderRadius="2xl" overflowX="auto">
										<Table variant="simple">
											<Thead bg="var(--surface-secondary)">
												<Tr>
													<Th>Product</Th>
													<Th>Ask Qty</Th>
													<Th>Ask Price</Th>
													<Th>Expires At</Th>
													<Th>Your Latest Bid</Th>
													<Th>Status</Th>
													<Th>Action</Th>
												</Tr>
											</Thead>
											<Tbody>
												{asks.map((ask) => {
													const latest = latestBidByAsk[ask.id];
													const isLocked = latest?.status === "accepted";
													return (
														<Tr key={ask.id}>
															<Td fontWeight="600">{ask.product_name}</Td>
															<Td>{ask.quantity}</Td>
															<Td>{ask.min_price ? `₹${Number(ask.min_price).toFixed(2)}` : "—"}</Td>
															<Td>{formatDate(ask.expires_at)}</Td>
															<Td>{latest ? `${latest.quantity} @ ₹${Number(latest.price).toFixed(2)}` : "No bid yet"}</Td>
															<Td>
																{latest ? (
																	<Badge colorScheme={BID_STATUS_COLOR[latest.status] || "gray"} borderRadius="full" px={3} py={1}>
																		{latest.status}
																	</Badge>
																) : (
																	<Text color="var(--text-secondary)">—</Text>
																)}
															</Td>
															<Td>
																<Button size="sm" isDisabled={isLocked} onClick={() => openBidModal(ask)}>
																	{latest?.status === "submitted" ? "Update Bid" : "Place Bid"}
																</Button>
															</Td>
														</Tr>
													);
												})}
											</Tbody>
										</Table>
									</Box>
								)}
							</VStack>
						</Box>
					</VStack>
				</Flex>
			</Container>

			<Modal isOpen={isOpen} onClose={closeModal}>
				<ModalOverlay />
				<ModalContent borderRadius="2xl">
					<ModalHeader>
						{latestBidByAsk[activeAsk?.id]?.status === "submitted" ? "Update Bid" : "Place Bid"}
					</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<FormControl>
							<FormLabel>Price</FormLabel>
							<Input
								type="number"
								min={0}
								step="0.01"
								value={form.price}
								onChange={(e) => setForm({ ...form, price: e.target.value })}
							/>
						</FormControl>
						<FormControl mt={3}>
							<FormLabel>Quantity</FormLabel>
							<Input
								type="number"
								min={1}
								value={form.quantity}
								onChange={(e) => setForm({ ...form, quantity: e.target.value })}
							/>
						</FormControl>
						<FormControl mt={3}>
							<FormLabel>Message (optional)</FormLabel>
							<Input
								value={form.message}
								onChange={(e) => setForm({ ...form, message: e.target.value })}
							/>
						</FormControl>
					</ModalBody>
					<ModalFooter>
						<Button colorScheme="blue" onClick={submitBid} isLoading={submitting}>
							Submit Bid
						</Button>
						<Button variant="ghost" ml={3} onClick={closeModal}>
							Cancel
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>

			<Footer />
		</Box>
	);
}
