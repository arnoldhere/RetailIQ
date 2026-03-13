import React from "react";
import {
	Box,
	Button,
	Drawer,
	DrawerBody,
	DrawerCloseButton,
	DrawerContent,
	DrawerOverlay,
	HStack,
	Icon,
	Link as ChakraLink,
	Text,
	VStack,
	useDisclosure,
} from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronRight, FiGrid, FiList, FiShoppingCart, FiUser } from "react-icons/fi";

const items = [
	{ to: "/supplier/dashboard", label: "Dashboard", icon: FiGrid },
	{ to: "/supplier/orders", label: "Orders", icon: FiList },
	{ to: "/supplier/bids", label: "Bids", icon: FiShoppingCart },
	{ to: "/supplier/profile", label: "Profile", icon: FiUser },
];

export default function SupplierSidebar({ onItemClick }) {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const loc = useLocation();

	const SidebarContent = (
		<Box
			as="nav"
			aria-label="Supplier sidebar"
			w={{ base: "full", md: 64 }}
			p={4}
			bg="white"
			h="100%"
		>
			<VStack align="stretch" spacing={2}>
				<Box
					mb={3}
					p={4}
					borderRadius="2xl"
					bg="linear-gradient(135deg, #0f3d91 0%, #0066cc 60%, #0aa2dd 100%)"
					color="white"
				>
					<Text fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.16em" color="whiteAlpha.900">
						Supplier Panel
					</Text>
					<Text fontSize="sm" mt={2} color="whiteAlpha.900">
						Manage bids, orders, and profile details from the refreshed supplier workspace.
					</Text>
				</Box>

				{items.map((item) => {
					const active = loc.pathname === item.to;
					return (
						<ChakraLink
							as={Link}
							to={item.to}
							key={item.to}
							px={4}
							py={3}
							borderRadius="xl"
							bg={active ? "var(--primary-lighter)" : "transparent"}
							border="1px solid"
							borderColor={active ? "rgba(0, 102, 204, 0.18)" : "transparent"}
							transition="all var(--transition-normal)"
							_hover={{
								textDecoration: "none",
								bg: active ? "var(--primary-lighter)" : "var(--surface-secondary)",
								borderColor: "var(--border-light)",
							}}
							onClick={() => {
								if (onItemClick) onItemClick();
							}}
							display="flex"
							alignItems="center"
							justifyContent="space-between"
							group
						>
							<HStack spacing={3} align="center" flex={1}>
								<Box
									w="2.25rem"
									h="2.25rem"
									borderRadius="lg"
									bg={active ? "white" : "var(--surface-secondary)"}
									display="flex"
									alignItems="center"
									justifyContent="center"
								>
									<Icon as={item.icon} boxSize={4.5} color={active ? "var(--primary-color)" : "var(--text-secondary)"} />
								</Box>
								<Text
									fontWeight={active ? 700 : 500}
									color={active ? "var(--primary-color)" : "var(--text-secondary)"}
									fontSize="sm"
								>
									{item.label}
								</Text>
							</HStack>
							{active && <Icon as={FiChevronRight} boxSize={4} color="var(--primary-color)" />}
						</ChakraLink>
					);
				})}
			</VStack>
		</Box>
	);

	return (
		<>
			<Button
				display={{ base: "inline-flex", md: "none" }}
				onClick={onOpen}
				size="sm"
				mb={4}
				bg="var(--primary-color)"
				color="white"
				fontWeight="500"
				_hover={{ bg: "var(--primary-dark)" }}
			>
				Supplier Menu
			</Button>

			<Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
				<DrawerOverlay />
				<DrawerContent bg="white">
					<DrawerCloseButton color="var(--primary-color)" mt={2} _focus={{ outline: "none" }} />
					<DrawerBody pt={8} p={0}>
						{SidebarContent}
					</DrawerBody>
				</DrawerContent>
			</Drawer>

			<Box
				display={{ base: "none", md: "block" }}
				h="calc(100vh - 80px)"
				overflowY="auto"
				css={{
					"&::-webkit-scrollbar": {
						width: "6px",
					},
					"&::-webkit-scrollbar-track": {
						background: "var(--background)",
					},
					"&::-webkit-scrollbar-thumb": {
						background: "var(--border-color)",
						borderRadius: "var(--border-radius-md)",
					},
					"&::-webkit-scrollbar-thumb:hover": {
						background: "var(--text-tertiary)",
					},
				}}
			>
				{SidebarContent}
			</Box>
		</>
	);
}
