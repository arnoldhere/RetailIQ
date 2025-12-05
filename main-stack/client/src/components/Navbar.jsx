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
} from "@chakra-ui/react";
import { HamburgerIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const { isOpen, onOpen, onClose } = useDisclosure();

	async function handleLogout() {
		await logout();
		navigate("/auth/login");
	}

	return (
		<>
			<Box
				bg="rgba(11,18,32,0.95)"
				backdropFilter="blur(10px)"
				borderBottom="1px solid"
				borderColor="whiteAlpha.200"
				boxShadow="lg"
				position="sticky"
				top={0}
				zIndex={40}
			>
				<Flex
					px={6}
					py={4}
					maxW="container.xl"
					mx="auto"
					justify="space-between"
					align="center"
				>
					{/* Logo */}
					<Heading
						size="lg"
						bgGradient="linear(to-r, cyan.400, purple.500)"
						bgClip="text"
						fontWeight="extrabold"
						cursor="pointer"
						onClick={() => navigate("/")}
						flexShrink={0}
					>
						RetailIQ
					</Heading>

					{/* Desktop Menu */}
					<HStack
						spacing={6}
						display={{ base: "none", md: "flex" }}
						align="center"
						ml={12}
					>
						{/* Navigation Links */}
						<ChakraLink
							fontSize="sm"
							color="gray.300"
							_hover={{ color: "cyan.400", textDecoration: "none" }}
							transition="color 0.2s"
							onClick={() => navigate("/customer/products")}
						>
							Explore
						</ChakraLink>
						<ChakraLink
							fontSize="sm"
							color="gray.300"
							_hover={{ color: "cyan.400", textDecoration: "none" }}
							transition="color 0.2s"
							onClick={() => navigate("/about-us")}
							cursor="pointer"
						>
							About Us
						</ChakraLink>
						<ChakraLink
							fontSize="sm"
							color="gray.300"
							_hover={{ color: "cyan.400", textDecoration: "none" }}
							transition="color 0.2s"
							onClick={() => navigate("/contact-us")}
							cursor="pointer"
						>
							Contact Us
						</ChakraLink>

						{/* Cart & Wishlist Icons (for customers) */}
						{user?.role === "customer" && (
							<HStack spacing={3}>
								<ChakraLink
									fontSize="sm"
									color="gray.300"
									_hover={{ color: "cyan.400" }}
									onClick={() => navigate("/customer/cart")}
								>
									Cart
								</ChakraLink>
								<ChakraLink
									fontSize="sm"
									color="gray.300"
									_hover={{ color: "cyan.400" }}
									onClick={() => navigate("/customer/wishlist")}
								>
									Wishlist
								</ChakraLink>
							</HStack>
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
						<Text fontSize="sm" color="gray.300">
							{user?.firstname && `Welcome, ${user.firstname}`}
						</Text>

						<Menu>
							<MenuButton
								as={Button}
								rightIcon={<ChevronDownIcon />}
								bg="whiteAlpha.100"
								color="gray.100"
								_hover={{ bg: "whiteAlpha.200" }}
								_active={{ bg: "whiteAlpha.300" }}
								size="sm"
							>
								{user?.role === "admin"
									? "👤 Admin"
									: user?.role === "supplier"
										? "🏪 Supplier"
										: "👥 Customer"}
							</MenuButton>
							<MenuList
								borderColor="whiteAlpha.200"
								bg="rgba(11,18,32,0.98)"
								backdropFilter="blur(10px)"
							>
								<MenuItem
									_hover={{ bg: "whiteAlpha.200" }}
									fontSize="sm"
									color="gray.200"
								>
									Profile
								</MenuItem>
								<MenuItem
									_hover={{ bg: "whiteAlpha.200" }}
									fontSize="sm"
									color="gray.200"
								>
									Settings
								</MenuItem>
								<MenuDivider />
								<MenuItem
									onClick={handleLogout}
									color="red.400"
									_hover={{ bg: "red.900" }}
									fontSize="sm"
								>
									Logout
								</MenuItem>
							</MenuList>
						</Menu>
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
					>
						<HamburgerIcon />
					</Button>
				</Flex>
			</Box>

			{/* Mobile Drawer */}
			<Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
				<DrawerOverlay />
				<DrawerContent bg="rgba(11,18,32,0.98)" backdropFilter="blur(10px)" color="gray.100">
					<DrawerCloseButton mt={2} />
					<DrawerBody pt={8}>
						<VStack spacing={6} align="stretch">
							{/* User Info */}
							{user?.firstname && (
								<Box borderBottom="1px solid" borderColor="whiteAlpha.200" pb={4}>
									<Text fontWeight={700} fontSize="md" color="cyan.400" mb={1}>
										{user.firstname} {user.lastname}
									</Text>
									<Text fontSize="xs" color="gray.400">
										{user?.role === "admin"
											? "Admin Account"
											: user?.role === "supplier"
												? "Supplier Account"
												: "Customer Account"}
									</Text>
								</Box>
							)}

							{/* Navigation Links */}
							<VStack spacing={3} align="stretch">
								<Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase">
									Navigation
								</Text>
								<Button
									variant="ghost"
									justifyContent="flex-start"
									_hover={{ bg: "whiteAlpha.200" }}
									onClick={() => {
										navigate("/customer/products");
										onClose();
									}}
									fontSize="sm"
								>
									🔍 Explore Products
								</Button>
								<Button
									variant="ghost"
									justifyContent="flex-start"
									_hover={{ bg: "whiteAlpha.200" }}
									onClick={() => {
										navigate("/about-us");
										onClose();
									}}
									fontSize="sm"
								>
									ℹ️ About Us
								</Button>
								<Button
									variant="ghost"
									justifyContent="flex-start"
									_hover={{ bg: "whiteAlpha.200" }}
									onClick={() => {
										navigate("/contact-us");
										onClose();
									}}
									fontSize="sm"
								>
									📞 Contact Us
								</Button>
							</VStack>

							{/* Customer Links */}
							{user?.role === "customer" && (
								<VStack spacing={3} align="stretch" borderTop="1px solid" borderColor="whiteAlpha.200" pt={4}>
									<Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase">
										Shopping
									</Text>
									<Button
										variant="ghost"
										justifyContent="flex-start"
										_hover={{ bg: "whiteAlpha.200" }}
										onClick={() => {
											navigate("/customer/cart");
											onClose();
										}}
										fontSize="sm"
									>
										🛒 Shopping Cart
									</Button>
									<Button
										variant="ghost"
										justifyContent="flex-start"
										_hover={{ bg: "whiteAlpha.200" }}
										onClick={() => {
											navigate("/customer/wishlist");
											onClose();
										}}
										fontSize="sm"
									>
										❤️ My Wishlist
									</Button>
								</VStack>
							)}

							{/* Account */}
							<VStack spacing={3} align="stretch" borderTop="1px solid" borderColor="whiteAlpha.200" pt={4}>
								<Text fontSize="xs" fontWeight="700" color="gray.400" textTransform="uppercase">
									Account
								</Text>
								<Button
									variant="ghost"
									justifyContent="flex-start"
									_hover={{ bg: "whiteAlpha.200" }}
									fontSize="sm"
								>
									👤 Profile
								</Button>
								<Button
									variant="ghost"
									justifyContent="flex-start"
									_hover={{ bg: "whiteAlpha.200" }}
									fontSize="sm"
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
								>
									Logout
								</Button>
							</VStack>
						</VStack>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</>
	);
}
