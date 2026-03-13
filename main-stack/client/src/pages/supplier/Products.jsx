import { useState, useEffect, useRef, useCallback } from "react";
import * as productApi from "../../api/products";
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
	NumberDecrementStepper,
	NumberIncrementStepper,
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	Select,
	SimpleGrid,
	Spinner,
	Text,
	VStack,
	useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SupplierSidebar from "../../components/SupplierSidebar";
import * as bidsApi from "../../api/bids";
import { buildApiUrl, resolveMediaUrl } from "../../api/base";

function ProductCard({ product, onViewDetail, onAskSupply }) {
	const cardRef = useRef();

	useEffect(() => {
		if (cardRef.current) {
			gsap.fromTo(cardRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45 });
		}
	}, []);

	const stockStatus =
		product.stock_available > 10 ? "In stock" : product.stock_available > 0 ? "Low stock" : "Out of stock";
	const stockColor =
		product.stock_available > 10 ? "green.400" : product.stock_available > 0 ? "orange.400" : "red.400";

	const primaryImage = product.images && product.images[0];
	const imageUrl = resolveMediaUrl(primaryImage);

	return (
		<Box
			ref={cardRef}
			bg="white"
			borderRadius="2xl"
			overflow="hidden"
			boxShadow="var(--shadow-sm)"
			border="1px solid"
			borderColor="var(--border-light)"
			transition="transform 220ms, box-shadow 220ms"
			_hover={{ transform: "translateY(-6px)", boxShadow: "var(--shadow-md)" }}
			display="flex"
			flexDirection="column"
			role="group"
		>
			<Box pos="relative" w="100%" paddingBottom="80%" bg="var(--surface-secondary)" overflow="hidden">
				<Box
					pos="absolute"
					inset={0}
					bgImage={imageUrl ? `url(${imageUrl})` : undefined}
					bgSize="cover"
					bgPos="center"
					bgRepeat="no-repeat"
					transition="transform 350ms ease"
					_groupHover={{ transform: "scale(1.05)" }}
				/>

				<Badge pos="absolute" bottom={3} left={3} px={3} py={1} borderRadius="full" bg="white" color={stockColor} fontSize="xs">
					{stockStatus}
				</Badge>
			</Box>

			<VStack align="stretch" spacing={3} p={5} flex={1}>
				<Box>
					<Heading size="sm" noOfLines={2} color="var(--text-primary)">
						{product.name}
					</Heading>
					{product.description && (
						<Text fontSize="sm" color="var(--text-secondary)" mt={2} noOfLines={2}>
							{product.description}
						</Text>
					)}
				</Box>

				<Text fontSize="xl" fontWeight="700" color="var(--primary-color)">
					₹{Number(product.sell_price).toFixed(2)}
				</Text>

				<Flex direction="column" gap={3} mt="auto">
					<Button onClick={() => onViewDetail(product.id)}>View details</Button>
					<Button variant="outline" onClick={() => onAskSupply(product)}>
						Ask to place supply order
					</Button>
				</Flex>
			</VStack>
		</Box>
	);
}

export default function SupplierProductsPage() {
	const toast = useToast();
	const navigate = useNavigate();
	const [products, setProducts] = useState([]);
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState({ search: "", category_id: "", sort: "name", order: "asc" });
	const [limit] = useState(12);
	const [offset, setOffset] = useState(0);

	const [supplyModalOpen, setSupplyModalOpen] = useState(false);
	const [supplyProduct, setSupplyProduct] = useState(null);
	const [supplyQty, setSupplyQty] = useState(1);
	const [supplyCost, setSupplyCost] = useState(0);
	const [stores, setStores] = useState([]);
	const [supplyStoreId, setSupplyStoreId] = useState(null);
	const [placingSupply, setPlacingSupply] = useState(false);

	const fetchProducts = useCallback(async () => {
		try {
			setLoading(true);
			const res = await productApi.getPublicProducts(limit, offset, filters);
			setProducts(res?.products || []);
		} catch (err) {
			console.error("Failed to fetch products:", err);
			toast({ title: "Failed to load products", status: "error", duration: 3000 });
		} finally {
			setLoading(false);
		}
	}, [limit, offset, filters, toast]);

	useEffect(() => {
		fetchCategories();
		fetchProducts();
		fetchStores();
	}, [filters, offset, limit, fetchProducts]);

	async function fetchCategories() {
		try {
			const res = await productApi.getCategories(100, 0);
			setCategories(res?.data?.categories || []);
		} catch (err) {
			console.error("Failed to fetch categories:", err);
		}
	}

	async function fetchStores() {
		try {
			const res = await fetch(buildApiUrl("/api/stores"), { credentials: "include" });
			if (!res.ok) throw new Error("Failed to fetch stores");
			const data = await res.json();
			const arr = data.stores || [];
			setStores(arr);
			if (arr.length > 0) setSupplyStoreId(arr[0].id);
		} catch (err) {
			console.error("Failed to fetch stores:", err);
			setStores([]);
			setSupplyStoreId(null);
		}
	}

	const openSupplyModal = (product) => {
		setSupplyProduct(product);
		setSupplyQty(1);
		setSupplyCost(product.cost_price || product.sell_price || 0);
		setSupplyModalOpen(true);
	};

	const closeSupplyModal = () => {
		setSupplyModalOpen(false);
		setSupplyProduct(null);
	};

	async function handlePlaceSupplyOrder() {
		if (!supplyProduct) return;
		if (!supplyQty || supplyQty <= 0) return toast({ title: "Quantity must be at least 1", status: "warning" });
		if (!supplyCost || supplyCost <= 0) return toast({ title: "Cost must be greater than 0", status: "warning" });
		if (!stores.length) return toast({ title: "No stores available to select", status: "error" });
		if (!supplyStoreId) return toast({ title: "Please select a store", status: "warning" });

		try {
			setPlacingSupply(true);
			const payload = {
				store_id: supplyStoreId,
				items: [{ product_id: supplyProduct.id, qty: supplyQty, cost: supplyCost }],
			};
			const res = await bidsApi.placeSupplyOrder(payload);
			toast({ title: "Supply order requested", description: `Order ${res?.data?.order?.order_no} created`, status: "success" });
			closeSupplyModal();
		} catch (err) {
			console.error("Failed to place supply order", err);
			toast({ title: "Failed to place supply order", status: "error" });
		} finally {
			setPlacingSupply(false);
		}
	}

	const handleViewDetail = (productId) => {
		navigate(`/supplier/products/${productId}`);
	};

	const handleFilterChange = (key, value) => {
		setOffset(0);
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

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
							<Heading size="lg" color="white">
								Supplier Catalog
							</Heading>
							<Text color="whiteAlpha.900" mt={2} maxW="2xl">
								Browse product inventory and raise supply requests from an updated supplier page that now matches the admin color direction.
							</Text>
						</Box>

						<Box
							bg="white"
							border="1px solid"
							borderColor="var(--border-light)"
							borderRadius="3xl"
							p={{ base: 5, md: 6 }}
							boxShadow="var(--shadow-sm)"
						>
							<VStack align="stretch" spacing={5}>
								<Grid templateColumns={{ base: "1fr", xl: "1fr auto" }} gap={4} alignItems="end">
									<Box>
										<Heading size="md">Products</Heading>
										<Text color="var(--text-secondary)" mt={1}>
											Search inventory and start a supply order request without changing the existing supplier flow.
										</Text>
									</Box>
									<HStack spacing={3} flexWrap="wrap">
										<FormControl minW={{ base: "full", md: "240px" }}>
											<FormLabel fontSize="sm">Search</FormLabel>
											<Input
												placeholder="Search products"
												value={filters.search}
												onChange={(e) => handleFilterChange("search", e.target.value)}
											/>
										</FormControl>
										<FormControl minW={{ base: "full", md: "200px" }}>
											<FormLabel fontSize="sm">Category</FormLabel>
											<Select value={filters.category_id || ""} onChange={(e) => handleFilterChange("category_id", e.target.value)}>
												<option value="">All Categories</option>
												{categories.map((category) => (
													<option key={category.id} value={category.id}>
														{category.name}
													</option>
												))}
											</Select>
										</FormControl>
									</HStack>
								</Grid>

								{loading ? (
									<Flex justify="center" py={12}>
										<Spinner color="var(--primary-color)" />
									</Flex>
								) : (
									<SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} spacing={6}>
										{products.map((product) => (
											<ProductCard
												key={product.id}
												product={product}
												onViewDetail={handleViewDetail}
												onAskSupply={(prod) => openSupplyModal(prod)}
											/>
										))}
									</SimpleGrid>
								)}
							</VStack>
						</Box>
					</VStack>
				</Flex>
			</Container>

			<Footer />

			<Modal isOpen={supplyModalOpen} onClose={closeSupplyModal} isCentered>
				<ModalOverlay />
				<ModalContent borderRadius="2xl">
					<ModalHeader>Request Supply Order</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<VStack align="stretch" spacing={4}>
							<Text fontWeight={700}>{supplyProduct?.name}</Text>

							<FormControl>
								<FormLabel>Quantity</FormLabel>
								<NumberInput value={supplyQty} min={1} onChange={(val) => setSupplyQty(parseInt(val) || 1)}>
									<NumberInputField />
									<NumberInputStepper>
										<NumberIncrementStepper />
										<NumberDecrementStepper />
									</NumberInputStepper>
								</NumberInput>
							</FormControl>

							<FormControl>
								<FormLabel>Unit Cost</FormLabel>
								<NumberInput value={supplyCost} min={0} onChange={(val) => setSupplyCost(parseFloat(val) || 0)}>
									<NumberInputField />
								</NumberInput>
							</FormControl>

							<FormControl>
								<FormLabel>Store</FormLabel>
								<Select value={supplyStoreId || ""} onChange={(e) => setSupplyStoreId(e.target.value)}>
									<option value="">Select Store</option>
									{stores.map((store) => (
										<option key={store.id} value={store.id}>
											{store.name}
										</option>
									))}
								</Select>
							</FormControl>
						</VStack>
					</ModalBody>

					<ModalFooter>
						<Button variant="ghost" mr={3} onClick={closeSupplyModal}>
							Cancel
						</Button>
						<Button onClick={handlePlaceSupplyOrder} isLoading={placingSupply}>
							Request Order
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</Box>
	);
}
