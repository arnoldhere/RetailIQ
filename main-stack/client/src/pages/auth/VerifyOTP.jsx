import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Heading,
    Text,
    useToast,
    HStack,
    Flex,
    Stack,
    Divider,
    Tag,
    TagLabel,
    useColorModeValue,
    Container,
} from '@chakra-ui/react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { verifyOTP } from '../../api/auth'

export default function VerifyOTPPage() {
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()
    const { identifier = '', channel = 'email' } = location.state || {}

    const cardBg = useColorModeValue('white', 'gray.800')
    const pageBg = useColorModeValue('gray.50', 'gray.900')

    // Timer for OTP expiry
    useEffect(() => {
        if (timeLeft <= 0) return
        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [timeLeft])

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (otp.length !== 6) {
            return toast({
                title: 'Error',
                description: 'OTP must be 6 digits',
                status: 'error',
            })
        }

        setLoading(true)
        try {
            const res = await verifyOTP({ identifier, otp })
            const resetToken = res?.data?.resetToken
            toast({ title: 'OTP verified', status: 'success', duration: 1500 })
            navigate('/auth/reset-password', { state: { resetToken } })
        } catch (err) {
            const msg =
                err?.response?.data?.errors?.[0]?.msg ||
                err?.response?.data?.message ||
                'Failed to verify OTP'
            toast({ title: 'Error', description: msg, status: 'error' })
        } finally {
            setLoading(false)
        }
    }
    return (
        <Box
            minH="100vh"
            // bg={pageBg}
            px={10}
            display="flex"
            alignItems="center"
            justifyContent="center"
            centerContent={true}
        >
            {/* ✅ Unified Centered Wrapper */}
            <Box maxW="lg" w="full">
                <VStack spacing={8} align="center">

                    {/* ✅ Centered Heading Block */}
                    <VStack spacing={1} textAlign="center">
                        <Heading size="md">Verify one-time passcode</Heading>

                        <Text fontSize="sm" color="gray.500">
                            We sent a 6-digit code to your{" "}
                            <Text as="span" fontWeight="semibold">
                                {channel === "email" ? "email" : "phone"}
                            </Text>
                        </Text>

                        {identifier && (
                            <Tag size="sm" variant="subtle" colorScheme="blue" mt={1}>
                                <TagLabel>{identifier}</TagLabel>
                            </Tag>
                        )}
                    </VStack>

                    {/* ✅ Centered OTP Card */}
                    <Box
                        bg={cardBg}
                        borderRadius="xl"
                        boxShadow="2xl"
                        p={{ base: 6, md: 8 }}
                        w="full"
                    >
                        <VStack spacing={6} align="stretch">
                            <Text fontSize="sm" color="gray.500" textAlign="center">
                                Enter the code we just sent you. For your security, this code will
                                expire in 10 minutes.
                            </Text>

                            <Divider />

                            <form onSubmit={handleSubmit}>
                                <VStack spacing={5} align="stretch">
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium">
                                            Enter OTP
                                        </FormLabel>

                                        <Input
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) =>
                                                setOtp(
                                                    e.target.value.replace(/[^0-9]/g, "").slice(0, 6)
                                                )
                                            }
                                            maxLength={6}
                                            textAlign="center"
                                            fontSize="2xl"
                                            letterSpacing="0.4em"
                                            py={6}
                                            bg={useColorModeValue("gray.50", "gray.700")}
                                            _focus={{
                                                borderColor: "blue.500",
                                                boxShadow:
                                                    "0 0 0 1px var(--chakra-colors-blue-500)",
                                            }}
                                            required
                                        />

                                        <Text mt={2} fontSize="xs" color="gray.500" textAlign="center">
                                            Only digits are allowed.
                                        </Text>
                                    </FormControl>

                                    {/* ✅ Timer + Resend */}
                                    <HStack justify="space-between" align="center">
                                        <Text
                                            fontSize="sm"
                                            color={timeLeft < 60 ? "red.500" : "gray.600"}
                                        >
                                            Expires in{" "}
                                            <Text as="span" fontWeight="semibold">
                                                {formatTime(timeLeft)}
                                            </Text>
                                        </Text>

                                        {timeLeft <= 0 && (
                                            <Link
                                                to="/auth/forgot-password"
                                                style={{
                                                    color: "#0066cc",
                                                    fontSize: "14px",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                Resend OTP
                                            </Link>
                                        )}
                                    </HStack>

                                    {/* ✅ Verify Button */}
                                    <Button
                                        type="submit"
                                        colorScheme="blue"
                                        isLoading={loading}
                                        loadingText="Verifying..."
                                        isDisabled={timeLeft <= 0}
                                        w="full"
                                        borderRadius="lg"
                                        mt={2}
                                    >
                                        Verify OTP
                                    </Button>

                                    {/* ✅ Wrong Identifier */}
                                    <Text fontSize="sm" color="gray.600" textAlign="center" pt={2}>
                                        Entered the wrong email or phone?{" "}
                                        <Link
                                            to="/auth/forgot-password"
                                            style={{ color: "#0066cc", fontWeight: "bold" }}
                                        >
                                            Request a new code
                                        </Link>
                                    </Text>
                                </VStack>
                            </form>
                        </VStack>
                    </Box>

                </VStack>
            </Box>
        </Box>
    );
}
