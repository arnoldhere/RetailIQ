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
    RadioGroup,
    Radio,
    HStack,
    Flex,
    Stack,
    InputGroup,
    InputLeftElement,
    Icon,
    Divider,
    useColorModeValue,
} from '@chakra-ui/react'
import { LockIcon, EmailIcon } from '@chakra-ui/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { forgotPassword } from '../../api/auth'

export default function RequestOTP() {
    const [identifier, setIdentifier] = useState('')
    const [channel, setChannel] = useState('email') // no TS union type
    const [loading, setLoading] = useState(false)
    const toast = useToast()
    const navigate = useNavigate()

    const cardBg = useColorModeValue('white', 'gray.800')

    async function handleSubmit(e) {
        e.preventDefault()
        if (!identifier.trim()) {
            return toast({
                title: 'Error',
                description: 'Please enter email or phone',
                status: 'error',
            })
        }

        setLoading(true)
        try {
            await forgotPassword({ identifier, channel })
            toast({
                title: 'OTP sent',
                description: `We’ve sent an OTP to your ${channel}. It will expire in 10 minutes.`,
                status: 'success',
                duration: 2500,
            })

            navigate('/auth/verify-otp', { state: { identifier, channel } })
        } catch (err) {
            const msg =
                err?.response?.data?.errors?.[0]?.msg ||
                err?.response?.data?.message ||
                'Failed to send OTP'
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
            <Box maxW="4xl" w="full">
                <Stack
                    direction={{ base: 'column', md: 'row' }}
                    spacing={{ base: 8, md: 12 }}
                    align="stretch"
                >
                    {/* Left side – description / brand section */}
                    <Flex
                        flex="1"
                        display={{ base: 'none', md: 'flex' }}
                        direction="column"
                        justify="center"
                        pr={{ md: 4 }}
                    >
                        <HStack mb={4}>
                            <Box
                                p={3}
                                borderRadius="full"
                                bg="blue.500"
                                display="inline-flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <LockIcon color="white" />
                            </Box>
                            <Text fontWeight="semibold" color="blue.600">
                                Secure account recovery
                            </Text>
                        </HStack>

                        <Heading size="lg" mb={3}>
                            Forgot your password?
                        </Heading>

                        <Text color="gray.600" fontSize="sm" maxW="md">
                            No worries. Enter your registered email or phone number and choose
                            how you’d like to receive a one-time passcode. We’ll guide you
                            through resetting your password securely.
                        </Text>
                    </Flex>

                    {/* Right side – form card */}
                    <Box
                        flex="1"
                        bg={cardBg}
                        borderRadius="xl"
                        boxShadow="2xl"
                        p={{ base: 6, md: 8 }}
                    >
                        <VStack spacing={6} align="stretch">
                            <Flex align="center" justify="space-between">
                                <HStack spacing={3}>
                                    <Box
                                        p={2}
                                        borderRadius="full"
                                        bg="blue.50"
                                        borderWidth="1px"
                                        borderColor="blue.100"
                                    >
                                        <LockIcon color="blue.500" boxSize={4} />
                                    </Box>
                                    <Box>
                                        <Heading size="md">Reset your password</Heading>
                                        <Text fontSize="sm" color="gray.500">
                                            We’ll send you a one-time passcode
                                        </Text>
                                    </Box>
                                </HStack>
                            </Flex>

                            <Divider />

                            <form onSubmit={handleSubmit}>
                                <VStack spacing={5} align="stretch">
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium">
                                            Email or phone number
                                        </FormLabel>
                                        <InputGroup>
                                            <InputLeftElement pointerEvents="none">
                                                <Icon as={EmailIcon} />
                                            </InputLeftElement>
                                            <Input
                                                placeholder="name@example.com or +1234567890"
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                autoComplete="username"
                                                size="md"
                                                bg={useColorModeValue('gray.50', 'gray.700')}
                                                _focus={{
                                                    borderColor: 'blue.500',
                                                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                                                }}
                                                required
                                            />
                                        </InputGroup>
                                        <Text mt={2} fontSize="xs" color="gray.500">
                                            Use the email or phone number linked to your account.
                                        </Text>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium">
                                            How would you like to receive the OTP?
                                        </FormLabel>
                                        <RadioGroup
                                            value={channel}
                                            onChange={(val) => setChannel(val)}
                                        >
                                            <HStack spacing={4}>
                                                <Radio value="email">Email</Radio>
                                                <Radio value="sms">SMS</Radio>
                                            </HStack>
                                        </RadioGroup>
                                    </FormControl>

                                    <Button
                                        type="submit"
                                        colorScheme="blue"
                                        isLoading={loading}
                                        loadingText="Sending OTP..."
                                        size="md"
                                        w="full"
                                        borderRadius="lg"
                                    >
                                        Send OTP
                                    </Button>

                                    <Text
                                        fontSize="sm"
                                        color="gray.600"
                                        textAlign="center"
                                        pt={2}
                                    >
                                        Remember your password?{' '}
                                        <Link
                                            to="/auth/login"
                                            style={{ fontWeight: 600, textDecoration: 'underline' }}
                                        >
                                            Sign in
                                        </Link>
                                    </Text>
                                </VStack>
                            </form>
                        </VStack>
                    </Box>
                </Stack>
            </Box>
        </Box>
    )
}
