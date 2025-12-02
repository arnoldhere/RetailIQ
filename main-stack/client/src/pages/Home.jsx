import {
	Box,
	Button,
	Heading,
	Text,
	VStack,
	Container,
	Grid,
	GridItem,
	Stat,
	StatLabel,
	StatNumber,
	StatHelpText,
	Flex,
	Icon,
	Badge,
	HStack,
} from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";
import { ArrowUpIcon, ArrowDownIcon, WarningIcon } from "@chakra-ui/icons";

export default function Home() {
	const { user, logout } = useAuth();

	return (
		<Box minH="100vh" bg="gray.50" w='90vw'>
			{/* Header */}
			<Box
				bg="white"
				borderBottom="1px"
				borderColor="gray.200"
				// px={6}
				// py={4}
				boxShadow="sm"
			>
				<Container maxW="container.xl">
					<Flex justify="space-between" align="center">
						<Heading
							size="lg"
							bgGradient="linear(to-r, blue.600, purple.600)"
							bgClip="text"
							fontWeight="bold"
						>
							RetailIQ
						</Heading>
						<Button
							colorScheme="red"
							variant="ghost"
							onClick={logout}
							size="sm"
							fontWeight="500"
						>
							Logout
						</Button>
					</Flex>
				</Container>
			</Box>

			{/* Main Content */}
			<Container maxW="container.xl" py={8} px={6}>
				<VStack spacing={8} align="stretch">
					{/* Welcome Section */}
					<Box
						p={8}
						borderRadius="2xl"
						bgGradient="linear(to-br, blue.500, purple.600)"
						boxShadow="xl"
						color="white"
						position="relative"
						overflow="hidden"
					>
						<Box position="relative" zIndex={1}>
							<Heading size="xl" mb={3}>
								Welcome back{user?.firstname ? `, ${user.firstname}` : ""}! 👋
							</Heading>
							<Text fontSize="lg" opacity={0.95} maxW="2xl">
								Your retail analytics dashboard is ready. Monitor sales,
								inventory, and insights in real-time to make data-driven
								decisions for your business.
							</Text>
							<HStack mt={6} spacing={4}>
								<Badge
									px={3}
									py={1}
									borderRadius="full"
									bg="whiteAlpha.300"
									color="white"
									fontSize="sm"
									fontWeight="600"
								>
									Dashboard v2.0
								</Badge>
								<Badge
									px={3}
									py={1}
									borderRadius="full"
									bg="whiteAlpha.300"
									color="white"
									fontSize="sm"
									fontWeight="600"
								>
									AI-Powered
								</Badge>
							</HStack>
						</Box>

						{/* Decorative Elements */}
						<Box
							position="absolute"
							top="-20"
							right="-20"
							w="300px"
							h="300px"
							borderRadius="full"
							bg="whiteAlpha.100"
							filter="blur(60px)"
						/>
					</Box>

					{/* Stats Grid */}
					<Grid
						templateColumns={{
							base: "1fr",
							md: "repeat(2, 1fr)",
							lg: "repeat(4, 1fr)",
						}}
						gap={6}
					>
						<GridItem>
							<Box
								bg="white"
								p={6}
								borderRadius="xl"
								boxShadow="md"
								border="1px"
								borderColor="gray.100"
								transition="all 0.3s"
								_hover={{
									transform: "translateY(-4px)",
									boxShadow: "lg",
								}}
							>
								<Stat>
									<StatLabel color="gray.600" fontSize="sm" fontWeight="500">
										Total Revenue
									</StatLabel>
									<StatNumber
										fontSize="3xl"
										fontWeight="bold"
										color="gray.800"
										mt={2}
									>
										$24,580
									</StatNumber>
									<StatHelpText color="green.500" fontWeight="600" mt={2}>
										<Flex align="center" gap={1}>
											<ArrowUpIcon />
											<Text>12.5% from last month</Text>
										</Flex>
									</StatHelpText>
								</Stat>
							</Box>
						</GridItem>

						<GridItem>
							<Box
								bg="white"
								p={6}
								borderRadius="xl"
								boxShadow="md"
								border="1px"
								borderColor="gray.100"
								transition="all 0.3s"
								_hover={{
									transform: "translateY(-4px)",
									boxShadow: "lg",
								}}
							>
								<Stat>
									<StatLabel color="gray.600" fontSize="sm" fontWeight="500">
										Total Orders
									</StatLabel>
									<StatNumber
										fontSize="3xl"
										fontWeight="bold"
										color="gray.800"
										mt={2}
									>
										1,247
									</StatNumber>
									<StatHelpText color="green.500" fontWeight="600" mt={2}>
										<Flex align="center" gap={1}>
											<ArrowUpIcon />
											<Text>8.3% from last month</Text>
										</Flex>
									</StatHelpText>
								</Stat>
							</Box>
						</GridItem>

						<GridItem>
							<Box
								bg="white"
								p={6}
								borderRadius="xl"
								boxShadow="md"
								border="1px"
								borderColor="gray.100"
								transition="all 0.3s"
								_hover={{
									transform: "translateY(-4px)",
									boxShadow: "lg",
								}}
							>
								<Stat>
									<StatLabel color="gray.600" fontSize="sm" fontWeight="500">
										Avg. Order Value
									</StatLabel>
									<StatNumber
										fontSize="3xl"
										fontWeight="bold"
										color="gray.800"
										mt={2}
									>
										$19.70
									</StatNumber>
									<StatHelpText color="red.500" fontWeight="600" mt={2}>
										<Flex align="center" gap={1}>
											<ArrowDownIcon />
											<Text>3.2% from last month</Text>
										</Flex>
									</StatHelpText>
								</Stat>
							</Box>
						</GridItem>

						<GridItem>
							<Box
								bg="white"
								p={6}
								borderRadius="xl"
								boxShadow="md"
								border="1px"
								borderColor="gray.100"
								transition="all 0.3s"
								_hover={{
									transform: "translateY(-4px)",
									boxShadow: "lg",
								}}
							>
								<Stat>
									<StatLabel color="gray.600" fontSize="sm" fontWeight="500">
										Stock Items
									</StatLabel>
									<StatNumber
										fontSize="3xl"
										fontWeight="bold"
										color="gray.800"
										mt={2}
									>
										8,432
									</StatNumber>
									<StatHelpText color="orange.500" fontWeight="600" mt={2}>
										<Flex align="center" gap={1}>
											<WarningIcon />
											<Text>42 items low stock</Text>
										</Flex>
									</StatHelpText>
								</Stat>
							</Box>
						</GridItem>
					</Grid>

					{/* Quick Actions */}
					<Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
						<GridItem>
							<Box
								bg="white"
								p={8}
								borderRadius="xl"
								boxShadow="md"
								border="1px"
								borderColor="gray.100"
							>
								<Heading size="md" mb={4} color="gray.800">
									Quick Actions
								</Heading>
								<VStack spacing={3} align="stretch">
									<Button
										variant="outline"
										colorScheme="blue"
										size="lg"
										justifyContent="flex-start"
										fontWeight="500"
									>
										View Sales Report
									</Button>
									<Button
										variant="outline"
										colorScheme="purple"
										size="lg"
										justifyContent="flex-start"
										fontWeight="500"
									>
										Manage Inventory
									</Button>
									<Button
										variant="outline"
										colorScheme="green"
										size="lg"
										justifyContent="flex-start"
										fontWeight="500"
									>
										AI Insights
									</Button>
								</VStack>
							</Box>
						</GridItem>

						<GridItem>
							<Box
								bg="white"
								p={8}
								borderRadius="xl"
								boxShadow="md"
								border="1px"
								borderColor="gray.100"
							>
								<Heading size="md" mb={4} color="gray.800">
									Recent Activity
								</Heading>
								<VStack spacing={4} align="stretch">
									<Box
										p={4}
										bg="blue.50"
										borderRadius="lg"
										borderLeft="4px"
										borderColor="blue.500"
									>
										<Text fontWeight="600" color="gray.800" fontSize="sm">
											New order #1847
										</Text>
										<Text color="gray.600" fontSize="xs" mt={1}>
											2 minutes ago
										</Text>
									</Box>
									<Box
										p={4}
										bg="green.50"
										borderRadius="lg"
										borderLeft="4px"
										borderColor="green.500"
									>
										<Text fontWeight="600" color="gray.800" fontSize="sm">
											Inventory updated
										</Text>
										<Text color="gray.600" fontSize="xs" mt={1}>
											15 minutes ago
										</Text>
									</Box>
									<Box
										p={4}
										bg="purple.50"
										borderRadius="lg"
										borderLeft="4px"
										borderColor="purple.500"
									>
										<Text fontWeight="600" color="gray.800" fontSize="sm">
											AI forecast generated
										</Text>
										<Text color="gray.600" fontSize="xs" mt={1}>
											1 hour ago
										</Text>
									</Box>
								</VStack>
							</Box>
						</GridItem>
					</Grid>

					{/* Info Banner */}
					<Box
						bg="blue.50"
						p={6}
						borderRadius="xl"
						border="1px"
						borderColor="blue.200"
					>
						<Flex
							direction={{ base: "column", md: "row" }}
							align={{ base: "flex-start", md: "center" }}
							justify="space-between"
							gap={4}
						>
							<Box>
								<Heading size="sm" color="blue.900" mb={2}>
									📊 Enhanced Analytics Available
								</Heading>
								<Text color="blue.800" fontSize="sm">
									Unlock advanced AI-powered insights, demand forecasting, and
									market basket analysis to optimize your retail operations.
								</Text>
							</Box>
							<Button colorScheme="blue" flexShrink={0} fontWeight="600">
								Learn More
							</Button>
						</Flex>
					</Box>
				</VStack>
			</Container>
		</Box>
	);
}
