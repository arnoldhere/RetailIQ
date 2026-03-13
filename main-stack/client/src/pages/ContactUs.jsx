import React, { useState } from "react";
import {
	Alert,
	AlertDescription,
	AlertIcon,
	AlertTitle,
	Box,
	Button,
	Container,
	Flex,
	FormControl,
	FormLabel,
	Grid,
	Heading,
	HStack,
	Icon,
	SimpleGrid,
	Spinner,
	Text,
	Textarea,
	VStack,
	useToast,
} from "@chakra-ui/react";
import { FaClock, FaEnvelope, FaMapMarkerAlt, FaPhone, FaPaperPlane } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import * as userApi from "../api/user";

const contactInfo = [
	{
		icon: FaPhone,
		title: "Phone",
		content: "+1 (800) RETAIL-IQ",
	},
	{
		icon: FaEnvelope,
		title: "Email",
		content: "support@retailiq.com",
	},
	{
		icon: FaMapMarkerAlt,
		title: "Address",
		content: "123 Innovation Drive, Tech Valley, CA 94025",
	},
	{
		icon: FaClock,
		title: "Hours",
		content: "Monday to Friday, 9:00 AM to 6:00 PM EST",
	},
];

export default function ContactUs() {
	const { user } = useAuth();
	const toast = useToast();
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const validateMessage = () => {
		if (!message.trim()) {
			toast({
				title: "Validation Error",
				description: "Please enter your message.",
				status: "error",
				duration: 3000,
				isClosable: true,
				position: "top-right",
			});
			return false;
		}

		if (message.trim().length < 10) {
			toast({
				title: "Validation Error",
				description: "Message must be at least 10 characters long.",
				status: "error",
				duration: 3000,
				isClosable: true,
				position: "top-right",
			});
			return false;
		}

		if (message.trim().length > 1000) {
			toast({
				title: "Validation Error",
				description: "Message cannot exceed 1000 characters.",
				status: "error",
				duration: 3000,
				isClosable: true,
				position: "top-right",
			});
			return false;
		}

		return true;
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!validateMessage()) return;

		setLoading(true);
		const storedUserId = localStorage.getItem("retailiq_user_id");

		try {
			const payload = {
				message: message.trim(),
				email: user?.email || "support-request@retailiq.com",
				name: user?.name || user?.firstname || "RetailIQ User",
				id: storedUserId || null,
			};

			const response = await userApi.submitFeedback(payload);
			if (!response) {
				throw new Error("Failed to send feedback");
			}

			toast({
				title: "Message sent",
				description: "Your feedback has been shared with the RetailIQ team.",
				status: "success",
				duration: 3000,
				isClosable: true,
				position: "top-right",
			});

			setMessage("");
			setSubmitted(true);
			setTimeout(() => setSubmitted(false), 5000);
		} catch (error) {
			console.error("Error sending feedback:", error);
			toast({
				title: "Error",
				description: error?.message || "Failed to send feedback. Please try again.",
				status: "error",
				duration: 3000,
				isClosable: true,
				position: "top-right",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box minH="100vh" bg="var(--background)" display="flex" flexDirection="column">
			<Navbar />

			<Box flex={1}>
				<Box
					position="relative"
					overflow="hidden"
					bg="linear-gradient(180deg, #eef5ff 0%, #f8fbff 60%, #ffffff 100%)"
					borderBottom="1px solid"
					borderColor="var(--border-light)"
				>
					<Box
						position="absolute"
						top="-5rem"
						right="-5rem"
						w="18rem"
						h="18rem"
						borderRadius="full"
						bg="rgba(0, 102, 204, 0.10)"
						filter="blur(12px)"
					/>
					<Container maxW="container.xl" py={{ base: 12, md: 18 }}>
						<Grid templateColumns={{ base: "1fr", lg: "1.1fr 0.9fr" }} gap={10} alignItems="center">
							<VStack align="start" spacing={5}>
								<Text
									fontSize="xs"
									fontWeight="700"
									textTransform="uppercase"
									letterSpacing="0.18em"
									color="var(--primary-color)"
								>
									Contact RetailIQ
								</Text>
								<Heading fontSize={{ base: "3xl", md: "5xl" }} lineHeight="1.05" letterSpacing="-0.04em">
									Reach the team behind your store operations.
								</Heading>
								<Text fontSize="lg" color="var(--text-secondary)" maxW="2xl">
									Questions, feedback, and support requests now sit inside a cleaner contact experience that matches the stronger design across the rest of the platform.
								</Text>
							</VStack>

							<Box
								bg="white"
								border="1px solid"
								borderColor="var(--border-light)"
								borderRadius="3xl"
								p={{ base: 6, md: 7 }}
								boxShadow="0 24px 60px rgba(15, 23, 42, 0.10)"
							>
								<VStack align="stretch" spacing={4}>
									<Text fontSize="sm" color="var(--text-secondary)">
										Support is best for account issues, order concerns, and product-related questions.
									</Text>
									{[
										"Response triage for account and login issues",
										"Order, refund, and checkout support",
										"Feedback intake for customer and admin experiences",
									].map((item) => (
										<HStack key={item} align="flex-start" spacing={3}>
											<Flex
												w="2rem"
												h="2rem"
												borderRadius="full"
												align="center"
												justify="center"
												bg="var(--primary-lighter)"
												color="var(--primary-color)"
												flexShrink={0}
											>
												•
											</Flex>
											<Text color="var(--text-secondary)">{item}</Text>
										</HStack>
									))}
								</VStack>
							</Box>
						</Grid>
					</Container>
				</Box>

				<Container maxW="container.xl" py={{ base: 10, md: 16 }}>
					<VStack spacing={10} align="stretch">
						<SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
							{contactInfo.map((info) => (
								<Box
									key={info.title}
									bg="white"
									border="1px solid"
									borderColor="var(--border-light)"
									borderRadius="2xl"
									p={6}
									boxShadow="var(--shadow-sm)"
								>
									<Flex
										w="3rem"
										h="3rem"
										borderRadius="xl"
										align="center"
										justify="center"
										bg="var(--primary-lighter)"
										color="var(--primary-color)"
										mb={4}
									>
										<Icon as={info.icon} boxSize={5} />
									</Flex>
									<Heading size="sm" mb={2}>
										{info.title}
									</Heading>
									<Text color="var(--text-secondary)" fontSize="sm">
										{info.content}
									</Text>
								</Box>
							))}
						</SimpleGrid>

						<Grid templateColumns={{ base: "1fr", lg: "0.9fr 1.1fr" }} gap={8} alignItems="start">
							<Box
								bg="white"
								border="1px solid"
								borderColor="var(--border-light)"
								borderRadius="3xl"
								overflow="hidden"
								boxShadow="var(--shadow-sm)"
							>
								<Box
									h={{ base: "280px", md: "360px" }}
									borderBottom="1px solid"
									borderColor="var(--border-light)"
								>
									<iframe
										title="RetailIQ office location"
										width="100%"
										height="100%"
										style={{ border: 0 }}
										loading="lazy"
										referrerPolicy="no-referrer-when-downgrade"
										src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3168.0866410825936!2d-122.084!3d37.3861!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fbb54c47d8eef%3A0x1234567890!2sTech%20Valley%2C%20CA!5e0!3m2!1sen!2sus!4v1234567890"
									/>
								</Box>
								<VStack align="start" spacing={3} p={6}>
									<Heading size="md">Visit our support office</Heading>
									<Text color="var(--text-secondary)">
										123 Innovation Drive, Tech Valley, CA 94025
									</Text>
									<Text color="var(--text-secondary)">
										Walk-ins are available for scheduled business meetings and support escalations.
									</Text>
								</VStack>
							</Box>

							<Box
								as="form"
								onSubmit={handleSubmit}
								bg="white"
								border="1px solid"
								borderColor="var(--border-light)"
								borderRadius="3xl"
								p={{ base: 6, md: 8 }}
								boxShadow="var(--shadow-sm)"
							>
								<VStack align="stretch" spacing={5}>
									<Box>
										<Heading size="lg" mb={2}>
											Send a message
										</Heading>
										<Text color="var(--text-secondary)">
											Share feedback, report a problem, or ask for help with your account.
										</Text>
									</Box>

									{submitted && (
										<Alert status="success" borderRadius="xl" bg="green.50" border="1px solid" borderColor="green.200">
											<AlertIcon />
											<Box>
												<AlertTitle>Message delivered</AlertTitle>
												<AlertDescription>
													The RetailIQ team has received your message and will review it shortly.
												</AlertDescription>
											</Box>
										</Alert>
									)}

									<FormControl isRequired>
										<FormLabel fontWeight="600">Your Message</FormLabel>
										<Textarea
											value={message}
											onChange={(event) => setMessage(event.target.value)}
											placeholder="Tell us what you need help with"
											rows={8}
											bg="var(--surface-secondary)"
											borderColor="var(--border-light)"
											_focus={{
												borderColor: "var(--primary-color)",
												boxShadow: "0 0 0 1px rgba(0, 102, 204, 0.45)",
											}}
										/>
										<Text mt={2} fontSize="xs" color="var(--text-tertiary)">
											{message.trim().length}/1000 characters
										</Text>
									</FormControl>

									<Button
										type="submit"
										size="lg"
										isLoading={loading}
										loadingText="Sending"
										leftIcon={loading ? <Spinner size="sm" /> : <FaPaperPlane />}
									>
										Send Feedback
									</Button>
								</VStack>
							</Box>
						</Grid>
					</VStack>
				</Container>
			</Box>

			<Footer />
		</Box>
	);
}
