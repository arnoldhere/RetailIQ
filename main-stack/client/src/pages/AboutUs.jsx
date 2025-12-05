import React, { useEffect, useState } from "react";
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Icon,
    SimpleGrid,
    Button,
    useColorModeValue,
    useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import * as userApi from "../api/user";
import {
    FaShoppingBag,
    FaCheckCircle,
    FaLightbulb,
    FaUsers,
    FaAward,
    FaGlobeAmericas,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AboutUs() {
    const navigate = useNavigate();
    const bgGradient = useColorModeValue(
        "linear(to-br, gray.50, blue.50)",
        "linear(to-br, gray.900, gray.800)"
    );
    const toast = useToast();

    const [loading, setLoading] = useState(false);

    // stats cards -> mapped from API metrics
    const [stats, setStats] = useState([]);

    useEffect(() => {
        let mounted = true;

        async function load() {
            setLoading(true);
            try {
                const res = await userApi.getMetrics();
                if (!mounted) return;
                const metrics = res?.data?.metrics || {};
                // helper to safely extract numeric value
                const getValue = (v) => {
                    if (v == null) return 0;
                    if (typeof v === "object" && "count" in v) return v.count;
                    return v;
                };

                // build stats array from API response
                const mappedStats = [
                    {
                        number: getValue(metrics.totalOrders),
                        label: "Total Orders",
                    },
                    {
                        number: getValue(metrics.totalSuppliers),
                        label: "Total Suppliers",
                    },
                    {
                        number: getValue(metrics.totalCustomers),
                        label: "Total Customers",
                    },
                    {
                        number: getValue(metrics.totalProducts),
                        label: "Total Products",
                    },
                ];
                setStats(mappedStats);
            } catch (err) {
                console.error("failed to load metrics overview", err);
                toast({
                    title: "Failed to load overview",
                    status: "error",
                    duration: 4000,
                });
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => {
            mounted = false;
        };
    }, [toast]);

    const cardBg = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.300");
    const accentColor = "cyan.400";

    const features = [
        {
            icon: FaShoppingBag,
            title: "Smart Shopping",
            description:
                "Intelligent product discovery with AI-driven recommendations tailored to your preferences.",
        },
        {
            icon: FaCheckCircle,
            title: "Verified Quality",
            description:
                "All products are carefully curated and verified to ensure the highest quality standards.",
        },
        {
            icon: FaLightbulb,
            title: "Innovation First",
            description:
                "Constantly innovating to bring you the latest retail technology and shopping experience.",
        },
        {
            icon: FaUsers,
            title: "Community Driven",
            description:
                "Built by a passionate team that values customer feedback and community engagement.",
        },
        {
            icon: FaAward,
            title: "Award Winning",
            description:
                "Recognized for excellence in customer service and technological innovation.",
        },
        {
            icon: FaGlobeAmericas,
            title: "Global Reach",
            description:
                "Serving customers worldwide with fast, reliable delivery and support.",
        },
    ];

    const teamMembers = [
        {
            name: "Innovation Team",
            role: "Technology & Product",
            description: "Driving cutting-edge retail solutions",
        },
        {
            name: "Customer Success",
            role: "Support & Operations",
            description: "Dedicated to your shopping experience",
        },
        {
            name: "Design Studio",
            role: "UX/UI & Experience",
            description: "Creating beautiful, intuitive interfaces",
        },
    ];

    return (
        <Box minH="100vh" bg={bgGradient} w="100vw">
            <Navbar />
            {/* Hero Section */}
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
                            About RetailIQ
                        </Heading>
                        <Text
                            fontSize={{ base: "lg", md: "xl" }}
                            color="gray.300"
                            maxW="2xl"
                        >
                            Revolutionizing retail with intelligent, user-centric shopping
                            solutions. We combine cutting-edge technology with customer
                            obsession to create the future of e-commerce.
                        </Text>
                        <Button
                            mt={4}
                            size="lg"
                            bg="cyan.400"
                            color="gray.900"
                            _hover={{ bg: "cyan.300" }}
                            fontSize={{ base: "sm", md: "md" }}
                            onClick={() => navigate("/customer/products")}
                        >
                            Explore Our Store
                        </Button>
                    </VStack>
                </Container>
            </Box>

            {/* Mission & Vision */}
            <Container maxW="container.lg" py={{ base: 12, md: 20 }}>
                {/* ... your mission/vision sections unchanged ... */}

                {/* Stats */}
                <Box mb={16}>
                    <Heading
                        as="h2"
                        size="xl"
                        textAlign="center"
                        mb={12}
                        bgGradient="linear(to-r, cyan.400, purple.500)"
                        bgClip="text"
                    >
                        By The Numbers
                    </Heading>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8}>
                        {stats.map((stat, idx) => (
                            <Box
                                key={stat.key ?? idx}
                                bg={cardBg}
                                p={8}
                                borderRadius="lg"
                                textAlign="center"
                                boxShadow="md"
                                border="1px solid"
                                borderColor="cyan.200"
                                _hover={{
                                    transform: "translateY(-4px)",
                                    boxShadow: "lg",
                                }}
                                transition="all 0.3s"
                            >
                                <Heading
                                    as="h3"
                                    size="2xl"
                                    bgGradient="linear(to-r, cyan.400, purple.500)"
                                    bgClip="text"
                                    mb={2}
                                >
                                    {loading ? "…" : stat.number}
                                </Heading>
                                <Text color={textColor} fontWeight="600">
                                    {stat.label}
                                </Text>
                            </Box>
                        ))}
                    </SimpleGrid>
                </Box>
            </Container>

            {/* Why Choose Us, Team, CTA, Footer — unchanged */}
            <Box bg={useColorModeValue("gray.100", "gray.700")} py={{ base: 12, md: 20 }}>
                <Container maxW="container.lg">
                    <Heading
                        as="h2"
                        size="xl"
                        textAlign="center"
                        mb={12}
                        bgGradient="linear(to-r, cyan.400, purple.500)"
                        bgClip="text"
                    >
                        Why Choose RetailIQ?
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                        {features.map((feature, idx) => (
                            <Box
                                key={idx}
                                bg={cardBg}
                                p={8}
                                borderRadius="lg"
                                boxShadow="md"
                                border="1px solid"
                                borderColor={idx % 2 === 0 ? "cyan.200" : "purple.200"}
                                _hover={{
                                    transform: "translateY(-4px)",
                                    boxShadow: "lg",
                                }}
                                transition="all 0.3s"
                            >
                                <Icon
                                    as={feature.icon}
                                    w={10}
                                    h={10}
                                    color={idx % 2 === 0 ? "cyan.400" : "purple.500"}
                                    mb={4}
                                />
                                <Heading as="h3" size="md" mb={3}>
                                    {feature.title}
                                </Heading>
                                <Text color={textColor} lineHeight="1.8">
                                    {feature.description}
                                </Text>
                            </Box>
                        ))}
                    </SimpleGrid>
                </Container>
            </Box>

            <Container maxW="container.lg" py={{ base: 12, md: 20 }}>
                <Heading
                    as="h2"
                    size="xl"
                    textAlign="center"
                    mb={12}
                    bgGradient="linear(to-r, cyan.400, purple.500)"
                    bgClip="text"
                >
                    Our Dedicated Team
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
                    {teamMembers.map((member, idx) => (
                        <Box
                            key={idx}
                            bg={cardBg}
                            p={8}
                            borderRadius="lg"
                            boxShadow="lg"
                            border="1px solid"
                            borderColor="cyan.200"
                            textAlign="center"
                            _hover={{
                                transform: "translateY(-4px)",
                                boxShadow: "xl",
                            }}
                            transition="all 0.3s"
                        >
                            <Box
                                w={16}
                                h={16}
                                mx="auto"
                                mb={4}
                                borderRadius="full"
                                bg="linear(to-r, cyan.400, purple.500)"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                color="white"
                                fontWeight="bold"
                                fontSize="lg"
                            >
                                {member.name.split(" ")[0][0]}
                            </Box>
                            <Heading as="h3" size="md" mb={1}>
                                {member.name}
                            </Heading>
                            <Text
                                color={accentColor}
                                fontWeight="600"
                                fontSize="sm"
                                mb={3}
                            >
                                {member.role}
                            </Text>
                            <Text color={textColor}>{member.description}</Text>
                        </Box>
                    ))}
                </SimpleGrid>
            </Container>

            <Box
                bg="linear(to-r, gray.900, gray.800)"
                py={{ base: 12, md: 16 }}
                color="white"
                borderTop="2px solid"
                borderColor="cyan.400"
            >
                <Container maxW="container.md">
                    <VStack spacing={6} textAlign="center">
                        <Heading as="h2" size="xl">
                            Ready to Experience the Future of Shopping?
                        </Heading>
                        <Text fontSize="lg" color="gray.300">
                            Join thousands of satisfied customers and discover a smarter way
                            to shop online.
                        </Text>
                        <HStack spacing={4} justify="center" pt={4}>
                            <Button
                                size="lg"
                                bg="cyan.400"
                                color="gray.900"
                                _hover={{ bg: "cyan.300" }}
                                onClick={() => navigate("/customer/products")}
                            >
                                Start Shopping
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                borderColor="cyan.400"
                                color="cyan.400"
                                _hover={{ bg: "rgba(34, 211, 238, 0.1)" }}
                                onClick={() => navigate("/contact-us")}
                            >
                                Get In Touch
                            </Button>
                        </HStack>
                    </VStack>
                </Container>
            </Box>
            <Footer />
        </Box>
    );
}
