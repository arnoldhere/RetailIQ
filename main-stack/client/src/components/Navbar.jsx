import React, { useState } from "react";
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
					>
						RetailIQ
					</Heading>

					{/* Desktop Menu */}
					<HStack
						spacing={4}
						display={{ base: "none", md: "flex" }}
						align="center"
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
							>
								{user?.role === "admin"
									? "👤 Admin"
									: user?.role === "supplier"
									? "🏪 Supplier"
									: "👥 Customer"}
							</MenuButton>
							<MenuList
								// bg="#0B1220"
								// border="1px solid"
								borderColor="whiteAlpha.200"
							>
								<MenuItem _hover={{ bg: "whiteAlpha.200" }}>Profile</MenuItem>
								<MenuItem _hover={{ bg: "whiteAlpha.200" }}>Settings</MenuItem>
								<MenuDivider />
								<MenuItem
									onClick={handleLogout}
									color="red.400"
									_hover={{ bg: "red.900" }}
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
					>
						<HamburgerIcon />
					</Button>
				</Flex>
			</Box>

			{/* Mobile Drawer */}
			<Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
				<DrawerOverlay />
				<DrawerContent bg="#0B1220" color="gray.100">
					<DrawerCloseButton />
					<DrawerBody pt={8}>
						<VStack spacing={4} align="stretch">
							{user?.firstname && (
								<Text fontWeight={600}>
									{user.firstname} {user.lastname}
								</Text>
							)}
							<Text fontSize="sm" color="gray.400">
								Role:{" "}
								{user?.role === "admin"
									? "Admin"
									: user?.role === "supplier"
									? "Supplier"
									: "Customer"}
							</Text>
							<Button variant="ghost" _hover={{ bg: "whiteAlpha.200" }}>
								Profile
							</Button>
							<Button variant="ghost" _hover={{ bg: "whiteAlpha.200" }}>
								Settings
							</Button>
							<Button
								colorScheme="red"
								variant="outline"
								onClick={handleLogout}
							>
								Logout
							</Button>
						</VStack>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</>
	);
}
