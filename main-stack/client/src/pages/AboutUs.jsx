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
    Spinner,
    useColorModeValue,
    useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
    FaShoppingBag,
    FaCheckCircle,
    FaLightbulb,
    FaUsers,
    FaAward,
    FaGlobeAmericas,
} from "react-icons/fa";

import * as userApi from "../api/user";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AboutUs() {
    const navigate = useNavigate();
    const toast = useToast();

    const bgGradient = useColorModeValue(
        "linear(to-br, gray.50, blue.50)",
        "linear(to-br, gray.900, gray.800)"
    );
    const cardBg = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.300");
    const mutedText = useColorModeValue("gray.600", "gray.400");

    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        let mounted = true;

        async function load() {
            setLoading(true);
            try {
                const res = await userApi.getAboutusStat();
                if (!mounted) return;

                const raw = res?.data?.stats || {};

                const formattedStats = [
                    {
                        label: "Happy Customers",
                        number: raw.totalCustomers?.count ?? 0,
                    },
                    {
                        label: "Products Available",
                        number: raw.totalProducts?.count ?? 0,
                    },
                    {
                        label: "Trusted Suppliers",
                        number: raw.totalSuppliers?.count ?? 0,
                    },
                    {
                        label: "Stores Connected",
                        number: raw.totalStores?.count ?? 0,
                    },
                ];

                setStats(formattedStats);
            } catch (e) {
                console.error("failed to load about us stats", e);
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

            {/* HERO */}
            <Box
                position="relative"
                bg="linear(to-r, gray.900, gray.800)"
                py={{ base: 12, md: 20 }}
                color="white"
                borderBottom="2px solid"
                borderColor="cyan.400"
            >
                <Box
                    position="absolute"
                    inset={0}
                    bgGradient="radial(circle at top, rgba(34,211,238,0.18), transparent 60%)"
                />
                <Container maxW="container.lg" position="relative">
                    <VStack spacing={6} align="start">
                        <Heading
                            size={{ base: "2xl", md: "3xl" }}
                            fontWeight="extrabold"
                            bgGradient="linear(to-r, cyan.400, purple.500)"
                            bgClip="text"
                        >
                            About RetailIQ
                        </Heading>
                        <Text fontSize={{ base: "lg", md: "xl" }} color="gray.300" maxW="2xl">
                            Revolutionizing retail with intelligent, user-centric shopping
                            solutions powered by innovation and trust.
                        </Text>
                        <Button
                            size="lg"
                            bg="cyan.400"
                            color="gray.900"
                            _hover={{ bg: "cyan.300" }}
                            onClick={() => navigate("/customer/products")}
                        >
                            Explore Our Store
                        </Button>
                    </VStack>
                </Container>
            </Box>

            {/* MISSION / VISION */}
            <Container maxW="container.lg" py={{ base: 12, md: 20 }}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={12} mb={16}>
                    {[
                        {
                            title: "🎯 Our Mission",
                            text:
                                "To empower businesses and customers through innovative retail technology that simplifies shopping and delivers exceptional value.",
                            gradient: "linear(to-r, cyan.400, purple.500)",
                        },
                        {
                            title: "👁️ Our Vision",
                            text:
                                "To become the world's most trusted intelligent retail platform where technology meets human connection.",
                            gradient: "linear(to-r, purple.500, pink.500)",
                        },
                    ].map((item, idx) => (
                        <Box
                            key={idx}
                            bg={cardBg}
                            p={8}
                            borderRadius="xl"
                            boxShadow="lg"
                            border="1px solid"
                            borderColor="cyan.200"
                        >
                            <Heading bgGradient={item.gradient} bgClip="text" size="lg" mb={4}>
                                {item.title}
                            </Heading>
                            <Text color={textColor} lineHeight="1.8">
                                {item.text}
                            </Text>
                        </Box>
                    ))}
                </SimpleGrid>

                {/* STATS */}
                <Heading
                    textAlign="center"
                    size="xl"
                    mb={12}
                    bgGradient="linear(to-r, cyan.400, purple.500)"
                    bgClip="text"
                >
                    By The Numbers
                </Heading>

                {loading ? (
                    <VStack py={12}>
                        <Spinner size="xl" color="cyan.400" />
                        <Text color={mutedText}>Loading insights...</Text>
                    </VStack>
                ) : (
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8}>
                        {stats.map((stat, idx) => (
                            <Box
                                key={idx}
                                bg={cardBg}
                                p={8}
                                borderRadius="xl"
                                textAlign="center"
                                boxShadow="md"
                                border="1px solid"
                                borderColor="cyan.200"
                                transition="all 0.25s ease"
                                _hover={{
                                    transform: "translateY(-6px) scale(1.02)",
                                    boxShadow: "xl",
                                }}
                            >
                                <Heading
                                    size="2xl"
                                    bgGradient="linear(to-r, cyan.400, purple.500)"
                                    bgClip="text"
                                >
                                    {stat.number}
                                </Heading>
                                <Text fontWeight="600" color={textColor}>
                                    {stat.label}
                                </Text>
                            </Box>
                        ))}
                    </SimpleGrid>
                )}
            </Container>

            {/* WHY CHOOSE US */}
            <Box bg={useColorModeValue("gray.100", "gray.700")} py={{ base: 12, md: 20 }}>
                <Container maxW="container.lg">
                    <Heading
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
                                borderRadius="xl"
                                boxShadow="md"
                                border="1px solid"
                                borderColor="cyan.200"
                                transition="all 0.25s ease"
                                _hover={{ transform: "translateY(-6px)", boxShadow: "xl" }}
                            >
                                <Icon as={feature.icon} w={12} h={12} color="cyan.400" mb={4} />
                                <Heading size="md" mb={3}>
                                    {feature.title}
                                </Heading>
                                <Text color={textColor}>{feature.description}</Text>
                            </Box>
                        ))}
                    </SimpleGrid>
                </Container>
            </Box>

            {/* TEAM */}
            <Container maxW="container.lg" py={{ base: 12, md: 20 }}>
                <Heading
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
                            borderRadius="xl"
                            textAlign="center"
                            boxShadow="lg"
                            border="1px solid"
                            borderColor="cyan.200"
                            transition="all 0.25s ease"
                            _hover={{ transform: "translateY(-6px)", boxShadow: "xl" }}
                        >
                            <Box
                                w={16}
                                h={16}
                                mx="auto"
                                mb={4}
                                borderRadius="full"
                                bgGradient="linear(to-r, cyan.400, purple.500)"
                                color="white"
                                fontWeight="bold"
                                fontSize="lg"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {member.name
                                    .split(" ")
                                    .map((w) => w[0])
                                    .join("")}
                            </Box>
                            <Heading size="md">{member.name}</Heading>
                            <Text color="cyan.400" fontWeight="600" fontSize="sm">
                                {member.role}
                            </Text>
                            <Text color={textColor}>{member.description}</Text>
                        </Box>
                    ))}
                </SimpleGrid>
            </Container>

            {/* CTA */}
            <Box
                bg="linear(to-r, gray.900, gray.800)"
                py={{ base: 12, md: 16 }}
                borderTop="2px solid"
                borderColor="cyan.400"
                color="white"
            >
                <Container maxW="container.md">
                    <VStack spacing={6} textAlign="center">
                        <Heading size="xl">
                            Ready to Experience the Future of Shopping?
                        </Heading>
                        <Text fontSize="lg" color="gray.300">
                            Join thousands of customers using RetailIQ every day.
                        </Text>
                        <HStack spacing={4}>
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
                                _hover={{ bg: "cyan.400", color: "gray.900" }}
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
