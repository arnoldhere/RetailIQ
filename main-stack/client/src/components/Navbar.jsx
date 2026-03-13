import React from "react";
import {
	Box,
	Button,
	Flex,
	Heading,
	Menu,
	MenuButton,
	MenuDivider,
	MenuItem,
	MenuList,
	useDisclosure,
	Drawer,
	DrawerBody,
	DrawerOverlay,
	DrawerContent,
	DrawerCloseButton,
	VStack,
	HStack,
	Text,
	Icon,
	Link as ChakraLink,
	Spacer,
	Badge,
} from "@chakra-ui/react";
import { HamburgerIcon, ChevronDownIcon, CloseIcon } from "@chakra-ui/icons";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiShoppingCart, FiHeart, FiBox } from "react-icons/fi";
import { BiRocket } from "react-icons/bi";

export default function Navbar() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const { isOpen, onOpen, onClose } = useDisclosure();

	const profilePath =
		user?.role === "admin"
			? "/admin/profile"
			: user?.role === "supplier"
				? "/supplier/profile"
				: "/customer/profile";

	const explorePath =
		user?.role === "admin"
			? "/admin/products"
			: user?.role === "supplier"
				? "/supplier/orders"
				: "/customer/products";

	async function handleLogout() {
		await logout();
		localStorage.clear();
		sessionStorage.clear();
		document.cookie.split(";").forEach((c) => {
			document.cookie = c
				.replace(/^ +/, "")
				.replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
		});
		navigate("/auth/login");
	}

	const navLinkStyle = {
		fontSize: "0.95rem",
		fontWeight: "500",
		color: "var(--text-secondary)",
		transition: "all var(--transition-normal)",
		position: "relative",

		_after: {
			content: '""',
			position: "absolute",
			bottom: "-2px",
			left: "0",
			width: "0%",
			height: "2px",
			bg: "var(--primary-color)",
			transition: "width 0.25s ease",
		},

		_hover: {
			color: "var(--primary-color)",
			textDecoration: "none",
			_after: {
				width: "100%",
			},
		},
	};


	const RoleColor = () => {
		if (user?.role === "admin") return "red";
		if (user?.role === "supplier") return "orange";
		return "blue";
	};

	const RoleIcon = () => {
		if (user?.role === "admin") return "👤";
		if (user?.role === "supplier") return "🏪";
		return "👤";
	};

	return (
		<>
			<Box
				bg="var(--surface)"
				borderBottom="1px solid var(--border-light)"
				boxShadow="var(--shadow-sm)"
				position="sticky"
				top={0}
				zIndex={40}
				className="fade-in"
			>
				<Flex
					px={{ base: 4, md: 6 }}
					py={4}
					maxW="100%"
					justify="space-between"
					align="center"
				>
					{/* Logo */}
					<Heading
						size="lg"
						color="var(--primary-color)"
						fontWeight="700"
						cursor="pointer"
						onClick={() => navigate("/")}
						flexShrink={0}
						display="flex"
						alignItems="center"
						gap={2}
						transition="all var(--transition-normal)"
						_hover={{ transform: "scale(1.05)" }}
					>
						<Icon as={BiRocket} boxSize={6} />
						<Text display={{ base: "none", sm: "block" }}>RetailIQ</Text>
					</Heading>

					{/* Desktop Menu */}
					<HStack
						spacing={8}
						display={{ base: "none", md: "flex" }}
						align="center"
						ml={12}
						flex={1}
					>
						{/* Navigation Links */}
						<ChakraLink
							{...navLinkStyle}
							onClick={() => navigate(explorePath)}
						>
							{user?.role === "admin" ? "Products" : user?.role === "supplier" ? "Orders" : "Explore"}
						</ChakraLink>

						{user?.role === "supplier" && (
							<ChakraLink
								{...navLinkStyle}
								onClick={() => navigate("/supplier/bids")}
							>
								My Bids
							</ChakraLink>
						)}

						{user?.role !== "admin" && (
							<>
								<ChakraLink
									{...navLinkStyle}
									onClick={() => navigate("/about-us")}
									cursor="pointer"
								>
									About
								</ChakraLink>
								<ChakraLink
									{...navLinkStyle}
									onClick={() => navigate("/contact-us")}
									cursor="pointer"
								>
									Contact
								</ChakraLink>
							</>
						)}
					</HStack>

					<Spacer display={{ base: "none", md: "block" }} />

					{/* Desktop User Menu */}
					<HStack
						spacing={4}
						display={{ base: "none", md: "flex" }}
						align="center"
						flexShrink={0}
					>
						{user ? (
							<>
								{/* Cart & Wishlist (for customers) */}
								{user?.role === "customer" && (
									<HStack spacing={3}>
										<ChakraLink
											display="flex"
											alignItems="center"
											gap={2}
											_hover={{
												color: "var(--primary-color)",
												textDecoration: "none",
											}}
											transition="all var(--transition-normal)"
											onClick={() => navigate("/customer/cart")}
										>
											<Icon as={FiShoppingCart} boxSize={5} />
										</ChakraLink>
										<ChakraLink
											display="flex"
											alignItems="center"
											gap={2}
											_hover={{
												color: "var(--primary-color)",
												textDecoration: "none",
											}}
											transition="all var(--transition-normal)"
											onClick={() => navigate("/customer/wishlist")}
										>
											<Icon as={FiHeart} boxSize={5} />
										</ChakraLink>
										<ChakraLink
											display="flex"
											alignItems="center"
											gap={2}
											_hover={{
												color: "var(--primary-color)",
												textDecoration: "none",
											}}
											transition="all var(--transition-normal)"
											onClick={() => navigate("/customer/my-orders")}
										>
											<Icon as={FiBox} boxSize={5} />
										</ChakraLink>
									</HStack>
								)}

								<Box w="1px" h={6} bg="var(--border-light)" />

								<Text fontSize="sm" fontWeight="500" color="var(--text-secondary)">
									{(user?.firstname || user?.name) && `Hi, ${user?.firstname || user?.name}`}
								</Text>

								<Menu>
									<MenuButton
										as={Button}
										rightIcon={<ChevronDownIcon />}
										bg="var(--primary-lighter)"
										color="var(--primary-color)"
										_hover={{
											bg: "var(--primary-lighter)",
											color: "var(--primary-dark)",
										}}
										_active={{
											bg: "var(--primary-lighter)",
										}}
										size="sm"
										fontWeight="500"
									>
										{RoleIcon()} {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "User"}
									</MenuButton>
									<MenuList
										borderColor="var(--border-light)"
										bg="var(--surface)"
										minW="200px"
									>
										<MenuItem
											fontSize="sm"
											color="var(--text-primary)"
											_hover={{
												bg: "var(--surface-secondary)",
											}}
											onClick={() => navigate(profilePath)}
										>
											👤 Profile
										</MenuItem>
										<MenuItem
											fontSize="sm"
											color="var(--text-primary)"
											_hover={{
												bg: "var(--surface-secondary)",
											}}
										>
											⚙️ Settings
										</MenuItem>
										<MenuDivider m={2} />
										<MenuItem
											onClick={handleLogout}
											color="var(--danger-color)"
											_hover={{ bg: "var(--surface-secondary)" }}
											fontSize="sm"
											fontWeight="500"
										>
											Logout
										</MenuItem>
									</MenuList>
								</Menu>
							</>
						) : (
							<HStack spacing={2}>
								<Button
									onClick={() => navigate("/auth/login")}
									variant="outline"
									size="sm"
									fontSize="sm"
									borderColor="var(--primary-color)"
									color="var(--primary-color)"
									_hover={{
										bg: "var(--primary-lighter)",
									}}
									fontWeight="500"
								>
									Login
								</Button>
								<Button
									onClick={() => navigate("/auth/signup")}
									bg="var(--primary-color)"
									color="white"
									size="sm"
									fontSize="sm"
									_hover={{
										bg: "var(--primary-dark)",
										transform: "translateY(-2px)",
										boxShadow: "var(--shadow-md)",
									}}
									fontWeight="500"
								>
									Sign Up
								</Button>
							</HStack>
						)}
					</HStack>

					{/* Mobile Hamburger */}
					<Button
						display={{ base: "flex", md: "none" }}
						onClick={onOpen}
						variant="ghost"
						icon={<HamburgerIcon />}
						size="md"
						flexShrink={0}
						ml={4}
						color="var(--primary-color)"
						_hover={{
							bg: "var(--surface-secondary)",
						}}
					>
						<HamburgerIcon />
					</Button>
				</Flex>
			</Box>

			{/* Mobile Drawer */}
			<Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
				<DrawerOverlay />
				<DrawerContent bg="var(--surface)" color="var(--text-primary)">
					<DrawerCloseButton
						color="var(--primary-color)"
						mt={2}
						_focus={{ outline: "none" }}
					/>
					<DrawerBody pt={8}>
						<VStack spacing={6} align="stretch">
							{/* User Info */}
							{user?.firstname && (
								<Box borderBottom="2px solid var(--border-light)" pb={4}>
									<Text fontWeight={700} fontSize="md" color="var(--primary-color)" mb={1}>
										{user.firstname} {user.lastname}
									</Text>
									<Badge
										colorScheme={RoleColor()}
										variant="subtle"
										fontSize="xs"
										fontWeight="600"
									>
										{user?.role?.toUpperCase()}
									</Badge>
									<Text fontSize="xs" color="var(--text-secondary)" mt={2}>
										{user?.email}
									</Text>
								</Box>
							)}

							{/* Navigation Links */}
							{user && (
								<VStack spacing={3} align="stretch">
									<Text fontSize="xs" fontWeight="700" color="var(--text-tertiary)" textTransform="uppercase">
										Navigation
									</Text>
									<Button
										variant="ghost"
										justifyContent="flex-start"
										_hover={{ bg: "var(--surface-secondary)" }}
										onClick={() => {
											navigate(explorePath);
											onClose();
										}}
										fontSize="sm"
										fontWeight="500"
										color="var(--text-primary)"
									>
										{user?.role === "admin" ? "📦 Manage Products" : user?.role === "supplier" ? "📦 Supplier Orders" : "🔍 Explore Products"}
									</Button>
									{user?.role !== "admin" && (
										<>
											<Button
												variant="ghost"
												justifyContent="flex-start"
												_hover={{ bg: "var(--surface-secondary)" }}
												onClick={() => {
													navigate("/about-us");
													onClose();
												}}
												fontSize="sm"
												fontWeight="500"
												color="var(--text-primary)"
											>
												ℹ️ About Us
											</Button>
											<Button
												variant="ghost"
												justifyContent="flex-start"
												_hover={{ bg: "var(--surface-secondary)" }}
												onClick={() => {
													navigate("/contact-us");
													onClose();
												}}
												fontSize="sm"
												fontWeight="500"
												color="var(--text-primary)"
											>
												📞 Contact Us
											</Button>
										</>
									)}
								</VStack>
							)}

							{/* Customer Links */}
							{user?.role === "customer" && (
								<VStack spacing={3} align="stretch" borderTop="2px solid var(--border-light)" pt={4}>
									<Text fontSize="xs" fontWeight="700" color="var(--text-tertiary)" textTransform="uppercase">
										Shopping
									</Text>
									<Button
										variant="ghost"
										justifyContent="flex-start"
										_hover={{ bg: "var(--surface-secondary)" }}
										onClick={() => {
											navigate("/customer/cart");
											onClose();
										}}
										fontSize="sm"
										fontWeight="500"
										color="var(--text-primary)"
									>
										🛒 Shopping Cart
									</Button>
									<Button
										variant="ghost"
										justifyContent="flex-start"
										_hover={{ bg: "var(--surface-secondary)" }}
										onClick={() => {
											navigate("/customer/wishlist");
											onClose();
										}}
										fontSize="sm"
										fontWeight="500"
										color="var(--text-primary)"
									>
										❤️ My Wishlist
									</Button>
									<Button
										variant="ghost"
										justifyContent="flex-start"
										_hover={{ bg: "var(--surface-secondary)" }}
										onClick={() => {
											navigate("/customer/my-orders");
											onClose();
										}}
										fontSize="sm"
										fontWeight="500"
										color="var(--text-primary)"
									>
										📦 My Orders
									</Button>
								</VStack>
							)}

							{/* Supplier Links */}
							{user?.role === "supplier" && (
								<VStack spacing={3} align="stretch" borderTop="2px solid var(--border-light)" pt={4}>
									<Text fontSize="xs" fontWeight="700" color="var(--text-tertiary)" textTransform="uppercase">
										Supplier
									</Text>
									<Button
										variant="ghost"
										justifyContent="flex-start"
										_hover={{ bg: "var(--surface-secondary)" }}
										onClick={() => {
											navigate("/supplier/bids");
											onClose();
										}}
										fontSize="sm"
										fontWeight="500"
										color="var(--text-primary)"
									>
										📊 My Bids
									</Button>
									<Button
										variant="ghost"
										justifyContent="flex-start"
										_hover={{ bg: "var(--surface-secondary)" }}
										onClick={() => {
											navigate("/supplier/orders");
											onClose();
										}}
										fontSize="sm"
										fontWeight="500"
										color="var(--text-primary)"
									>
										📦 Orders
									</Button>
								</VStack>
							)}

							{/* Account */}
							{user && (
								<VStack spacing={3} align="stretch" borderTop="2px solid var(--border-light)" pt={4}>
									<Text fontSize="xs" fontWeight="700" color="var(--text-tertiary)" textTransform="uppercase">
										Account
									</Text>
									<Button
										variant="ghost"
										justifyContent="flex-start"
										_hover={{ bg: "var(--surface-secondary)" }}
										onClick={() => {
											navigate(profilePath);
											onClose();
										}}
										fontSize="sm"
										fontWeight="500"
										color="var(--text-primary)"
									>
										👤 Profile
									</Button>
									<Button
										variant="ghost"
										justifyContent="flex-start"
										_hover={{ bg: "var(--surface-secondary)" }}
										fontSize="sm"
										fontWeight="500"
										color="var(--text-primary)"
									>
										⚙️ Settings
									</Button>
									<Button
										colorScheme="red"
										variant="outline"
										w="100%"
										onClick={() => {
											handleLogout();
											onClose();
										}}
										fontSize="sm"
										fontWeight="500"
										mt={4}
									>
										Logout
									</Button>
								</VStack>
							)}

							{/* Guest Mode */}
							{!user && (
								<VStack spacing={6} align="stretch">
									<Box borderBottom="2px solid var(--border-light)" pb={4}>
										<Text fontWeight={700} fontSize="md" color="var(--primary-color)" mb={1}>
											RetailIQ
										</Text>
										<Text fontSize="xs" color="var(--text-secondary)">
											Welcome to our platform
										</Text>
									</Box>

									{/* Navigation Links */}
									<VStack spacing={3} align="stretch">
										<Text fontSize="xs" fontWeight="700" color="var(--text-tertiary)" textTransform="uppercase">
											Navigation
										</Text>
										<Button
											variant="ghost"
											justifyContent="flex-start"
											_hover={{ bg: "var(--surface-secondary)" }}
											onClick={() => {
												navigate("/customer/products");
												onClose();
											}}
											fontSize="sm"
											fontWeight="500"
											color="var(--text-primary)"
										>
											🔍 Explore Products
										</Button>
										<Button
											variant="ghost"
											justifyContent="flex-start"
											_hover={{ bg: "var(--surface-secondary)" }}
											onClick={() => {
												navigate("/about-us");
												onClose();
											}}
											fontSize="sm"
											fontWeight="500"
											color="var(--text-primary)"
										>
											ℹ️ About Us
										</Button>
										<Button
											variant="ghost"
											justifyContent="flex-start"
											_hover={{ bg: "var(--surface-secondary)" }}
											onClick={() => {
												navigate("/contact-us");
												onClose();
											}}
											fontSize="sm"
											fontWeight="500"
											color="var(--text-primary)"
										>
											📞 Contact Us
										</Button>
									</VStack>

									{/* Auth Buttons */}
									<VStack spacing={3} align="stretch" borderTop="2px solid var(--border-light)" pt={4}>
										<Button
											onClick={() => {
												navigate("/auth/login");
												onClose();
											}}
											variant="outline"
											borderColor="var(--primary-color)"
											color="var(--primary-color)"
											w="100%"
											fontSize="sm"
											fontWeight="500"
											_hover={{
												bg: "var(--primary-lighter)",
											}}
										>
											Login
										</Button>
										<Button
											onClick={() => {
												navigate("/auth/signup");
												onClose();
											}}
											bg="var(--primary-color)"
											color="white"
											w="100%"
											fontSize="sm"
											fontWeight="500"
											_hover={{
												bg: "var(--primary-dark)",
											}}
										>
											Sign Up
										</Button>
									</VStack>
								</VStack>
							)}
						</VStack>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</>
	);
}
