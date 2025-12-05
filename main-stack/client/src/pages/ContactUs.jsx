import React, { useState } from "react";
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Icon,
    SimpleGrid,
    FormControl,
    FormLabel,
    Textarea,
    Button,
    useToast,
    useColorModeValue,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Spinner,
} from "@chakra-ui/react";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import * as userApi from "../api/user";
export default function ContactUs() {
    const { user } = useAuth();
    const toast = useToast();
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);


    const bgGradient = useColorModeValue(
        "linear(to-br, gray.50, blue.50)",
        "linear(to-br, gray.900, gray.800)"
    );
    const cardBg = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.300");
    const AlertBg = useColorModeValue("yellow.50", "yellow.900");
    const contactInfo = [
        {
            icon: FaPhone,
            title: "Phone",
            content: "+1 (800) RETAIL-IQ",
            color: "cyan.400",
        },
        {
            icon: FaEnvelope,
            title: "Email",
            content: "support@retailiq.com",
            color: "purple.500",
        },
        {
            icon: FaMapMarkerAlt,
            title: "Address",
            content: "123 Innovation Drive, Tech Valley, CA 94025",
            color: "pink.500",
        },
        {
            icon: FaClock,
            title: "Hours",
            content: "Monday - Friday: 9 AM - 6 PM (EST)",
            color: "teal.400",
        },
    ];

    // Validation
    const validateMessage = () => {
        if (!message.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter your message.",
                status: "error",
                duration: 3,
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
                duration: 3,
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
                duration: 3,
                isClosable: true,
                position: "top-right",
            });
            return false;
        }

        return true;
    };

    // Handle feedback submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateMessage()) {
            return;
        }

        setLoading(true);

        try {
            const dataPayload = {
                message: message.trim(),
                email: user?.email || "abc@gmail.com",
                name: user?.name || "Intersteller",
                id: user?.id || null,

            }
            const response = await userApi.submitFeedback(dataPayload)

            if (!response) {
                throw new Error(response.data.message || "Failed to send feedback");
            }

            // Success
            toast({
                title: "Success!",
                description: "Your feedback has been sent. Thank you!",
                status: "success",
                duration: 3,
                isClosable: true,
                position: "top-right",
            });

            setMessage("");
            setSubmitted(true);

            // Reset submitted state after 5 seconds
            setTimeout(() => setSubmitted(false), 5000);
        } catch (error) {
            console.error("Error sending feedback:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to send feedback. Please try again.",
                status: "error",
                duration: 3,
                isClosable: true,
                position: "top-right",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box minH="100vh" bg={bgGradient} w='100vw' >
            {/* Hero Section */}
            <Navbar />
            <Box
                bg="linear(to-r, gray.900, gray.800)"
                py={{ base: 12, md: 20 }}
                color="white"
                borderBottom="2px solid"
                borderColor="cyan.400"
            >
                <Container maxW="container.lg">
                    <VStack spacing={6} align="start">
                        <Heading
                            as="h1"
                            size={{ base: "2xl", md: "3xl" }}
                            fontWeight="extrabold"
                            bgGradient="linear(to-r, cyan.400, purple.500)"
                            bgClip="text"
                        >
                            Get In Touch
                        </Heading>
                        <Text fontSize={{ base: "lg", md: "xl" }} color="gray.300" maxW="2xl">
                            Have questions or feedback? We'd love to hear from you. Our
                            support team is here to help and ready to assist you with
                            anything you need.
                        </Text>
                    </VStack>
                </Container>
            </Box>

            {/* Contact Info Cards */}
            <Container maxW="container.lg" py={{ base: 12, md: 16 }}>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={16}>
                    {contactInfo.map((info, idx) => (
                        <Box
                            key={idx}
                            bg={cardBg}
                            p={6}
                            borderRadius="lg"
                            boxShadow="md"
                            border="1px solid"
                            borderColor={info.color.replace(".", ".200")}
                            textAlign="center"
                            _hover={{
                                transform: "translateY(-4px)",
                                boxShadow: "lg",
                            }}
                            transition="all 0.3s"
                        >
                            <Icon
                                as={info.icon}
                                w={10}
                                h={10}
                                color={info.color}
                                mb={4}
                            />
                            <Heading as="h3" size="md" mb={2}>
                                {info.title}
                            </Heading>
                            <Text color={textColor}>{info.content}</Text>
                        </Box>
                    ))}
                </SimpleGrid>

                {/* Main Content - Two Columns */}
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={12}>
                    {/* Map/Info Section */}
                    <Box>
                        <Heading as="h2" size="lg" mb={6} color={textColor}>
                            Visit Our Location
                        </Heading>

                        {/* Map Placeholder */}
                        <Box
                            w="100%"
                            h={{ base: "300px", md: "400px" }}
                            borderRadius="lg"
                            overflow="hidden"
                            boxShadow="lg"
                            mb={6}
                            bg="gray.600"
                        >
                            <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen=""
                                referrerPolicy="no-referrer-when-downgrade"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3168.0866410825936!2d-122.084!3d37.3861!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fbb54c47d8eef%3A0x1234567890!2sTech%20Valley%2C%20CA!5e0!3m2!1sen!2sus!4v1234567890"
                            ></iframe>
                        </Box>

                        <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md" border="1px solid" borderColor="cyan.200">
                            <Heading as="h3" size="md" mb={4}>
                                Office Details
                            </Heading>
                            <VStack align="start" spacing={3} color={textColor}>
                                <Text>
                                    <strong>Main Office:</strong><br />
                                    RetailIQ Headquarters<br />
                                    123 Innovation Drive<br />
                                    Tech Valley, CA 94025<br />
                                    United States
                                </Text>
                                <Text>
                                    <strong>Business Hours:</strong><br />
                                    Monday - Friday: 9:00 AM - 6:00 PM (EST)<br />
                                    Saturday: 10:00 AM - 4:00 PM (EST)<br />
                                    Sunday: Closed
                                </Text>
                                <Text>
                                    <strong>Response Time:</strong><br />
                                    We typically respond within 24 hours.<br />
                                    For urgent matters, please call our support line.
                                </Text>
                            </VStack>
                        </Box>
                    </Box>

                    {/* Feedback Form Section */}
                    <Box>
                        <Heading as="h2" size="lg" mb={6} color={textColor}>
                            Send Us Your Feedback
                        </Heading>

                        {submitted && (
                            <Alert
                                status="success"
                                borderRadius="lg"
                                mb={6}
                                bg="linear(to-r, green.100, teal.100)"
                                border="1px solid"
                                borderColor="teal.300"
                            >
                                <AlertIcon />
                                <Box>
                                    <AlertTitle>Thank you!</AlertTitle>
                                    <AlertDescription>
                                        Your feedback has been received. We appreciate your input
                                        and will review it shortly.
                                    </AlertDescription>
                                </Box>
                            </Alert>
                        )}

                        <Box
                            bg={cardBg}
                            p={8}
                            borderRadius="lg"
                            boxShadow="lg"
                            border="1px solid"
                            borderColor="cyan.200"
                        >
                            <form onSubmit={handleSubmit}>
                                <VStack spacing={6}>
                                    {/* Message Field */}
                                    <FormControl isRequired>
                                        <FormLabel
                                            fontWeight="600"
                                            mb={2}
                                            color={textColor}
                                        >
                                            Your Message
                                            <Text
                                                as="span"
                                                fontSize="xs"
                                                color="gray.500"
                                                ml={2}
                                            >
                                                ({message.length}/1000)
                                            </Text>
                                        </FormLabel>
                                        <Textarea
                                            placeholder="Tell us what's on your mind... (minimum 10 characters)"
                                            value={message}
                                            onChange={(e) => {
                                                if (e.target.value.length <= 1000) {
                                                    setMessage(e.target.value);
                                                }
                                            }}
                                            minH="150px"
                                            maxH="300px"
                                            resize="vertical"
                                            borderColor="cyan.300"
                                            _focus={{
                                                borderColor: "cyan.400",
                                                boxShadow: "0 0 0 1px cyan.400",
                                            }}
                                            _placeholder={{ color: "gray.500" }}
                                            bg={useColorModeValue("gray.50", "gray.700")}
                                            disabled={loading}
                                        />
                                    </FormControl>

                                    {/* Info Message */}
                                    <Alert
                                        status="info"
                                        borderRadius="lg"
                                        bg={useColorModeValue("blue.50", "blue.900")}
                                        border="1px solid"
                                        borderColor="blue.200"
                                    >
                                        <AlertIcon />
                                        <Box>
                                            <AlertTitle>💡 Tip:</AlertTitle>
                                            <AlertDescription fontSize="sm">
                                                Be specific about your feedback to help us improve your
                                                experience. Include details about what you liked or what
                                                could be better.
                                            </AlertDescription>
                                        </Box>
                                    </Alert>

                                    {/* Submit Button */}
                                    <Button
                                        w="100%"
                                        size="lg"
                                        bg="red.600"
                                        color="white"
                                        _hover={{
                                            bg: "linear(to-r, cyan.500, purple.600)",
                                            transform: "translateY(-2px)",
                                        }}
                                        _active={{
                                            transform: "translateY(0)",
                                        }}
                                        type="submit"
                                        isDisabled={loading || !message.trim()}
                                        transition="all 0.3s"
                                    >
                                        {loading ? (
                                            <HStack spacing={2}>
                                                <Spinner size="sm" color="white" />
                                                <Text>Sending...</Text>
                                            </HStack>
                                        ) : (
                                            "Send Feedback"
                                        )}
                                    </Button>

                                    {/* Character Count Warning */}
                                    {message.length > 900 && (
                                        <Alert
                                            status="warning"
                                            borderRadius="lg"
                                            fontSize="sm"
                                            bg={AlertBg}
                                            border="1px solid"
                                            borderColor="yellow.200"
                                        >
                                            <AlertIcon />
                                            <Box>
                                                <AlertDescription>
                                                    You're approaching the character limit ({1000 - message.length} characters remaining).
                                                </AlertDescription>
                                            </Box>
                                        </Alert>
                                    )}
                                </VStack>
                            </form>
                        </Box>
                    </Box>
                </SimpleGrid>
            </Container>

            {/* FAQ Section */}
            <Box bg={useColorModeValue("gray.100", "gray.700")} py={{ base: 12, md: 16 }}>
                <Container maxW="container.lg">
                    <Heading
                        as="h2"
                        size="xl"
                        textAlign="center"
                        mb={12}
                        bgGradient="linear(to-r, cyan.400, purple.500)"
                        bgClip="text"
                    >
                        Frequently Asked Questions
                    </Heading>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                        {[
                            {
                                q: "How quickly will I receive a response?",
                                a: "We aim to respond to all inquiries within 24 hours during business days. For urgent matters, please call our support line.",
                            },
                            {
                                q: "What should I do if I have a problem with my order?",
                                a: "Please contact our customer support team with your order number and a description of the issue. We'll help resolve it as quickly as possible.",
                            },
                            {
                                q: "Can I schedule a demo or consultation?",
                                a: "Yes! Contact our sales team at sales@retailiq.com to schedule a personalized demonstration of our platform.",
                            },
                            {
                                q: "Is there a community forum?",
                                a: "Yes, our online community is available 24/7. Connect with other users, share tips, and get support from our team.",
                            },
                        ].map((faq, idx) => (
                            <Box
                                key={idx}
                                bg={cardBg}
                                p={6}
                                borderRadius="lg"
                                boxShadow="md"
                                border="1px solid"
                                borderColor="cyan.200"
                            >
                                <Heading as="h3" size="md" mb={3} color="cyan.400">
                                    {faq.q}
                                </Heading>
                                <Text color={textColor}>{faq.a}</Text>
                            </Box>
                        ))}
                    </SimpleGrid>
                </Container>
            </Box>

            {/* CTA Section */}
            <Box
                bg="linear(to-r, gray.900, gray.800)"
                py={{ base: 12, md: 16 }}
                color="white"
                borderTop="2px solid"
                borderColor="cyan.400"
            >
                <Container maxW="container.md" textAlign="center">
                    <VStack spacing={6}>
                        <Heading as="h2" size="lg">
                            Ready to Explore?
                        </Heading>
                        <Text fontSize="lg" color="gray.300">
                            Browse our full range of products or reach out with any questions.
                        </Text>
                        <HStack spacing={4} justify="center" pt={4}>
                            <Button
                                size="lg"
                                bg="cyan.400"
                                color="gray.900"
                                _hover={{ bg: "cyan.300" }}
                                onClick={() => window.location.href = "/customer/products"}
                            >
                                Shop Now
                            </Button>
                        </HStack>
                    </VStack>
                </Container>
            </Box>
            <Footer />
        </Box>
    );
}
