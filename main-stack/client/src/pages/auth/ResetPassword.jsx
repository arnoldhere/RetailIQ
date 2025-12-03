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
    Flex,
    Stack,
    InputGroup,
    InputRightElement,
    IconButton,
    Divider,
    HStack,
    useColorModeValue,
} from '@chakra-ui/react'
import { LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useState } from 'react'
import { resetPassword } from '../../api/auth'

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)

    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()
    const { resetToken = '' } = location.state || {}

    const cardBg = useColorModeValue('white', 'gray.800')
    const pageBg = useColorModeValue('gray.50', 'gray.900')

    async function handleSubmit(e) {
        e.preventDefault()

        if (!resetToken) {
            return toast({
                title: 'Error',
                description: 'Invalid or missing reset token. Please request a new link.',
                status: 'error',
            })
        }

        if (newPassword.length < 8) {
            return toast({
                title: 'Error',
                description: 'Password must be at least 8 characters',
                status: 'error',
            })
        }

        if (newPassword !== confirmPassword) {
            return toast({
                title: 'Error',
                description: 'Passwords do not match',
                status: 'error',
            })
        }

        setLoading(true)
        try {
            await resetPassword({ resetToken, newPassword })
            toast({
                title: 'Success',
                description: 'Password reset successfully',
                status: 'success',
                duration: 2000,
            })
            navigate('/auth/login')
        } catch (err) {
            const msg =
                err?.response?.data?.errors?.[0]?.msg ||
                err?.response?.data?.message ||
                'Failed to reset password'
            toast({ title: 'Error', description: msg, status: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box
            minH="100vh"
            bg={pageBg}
            px={4}
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Box maxW="lg" w="full">
                <Stack spacing={8}>
                    <Flex justify="center">
                        <HStack spacing={3}>
                            <Box
                                p={3}
                                borderRadius="full"
                                bg="green.500"
                                display="inline-flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <LockIcon color="white" />
                            </Box>
                            <Box>
                                <Text fontSize="sm" color="green.600" fontWeight="semibold">
                                    Secure password reset
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                    You’re just one step away from accessing your account
                                </Text>
                            </Box>
                        </HStack>
                    </Flex>

                    <Box
                        bg={cardBg}
                        borderRadius="xl"
                        boxShadow="2xl"
                        p={{ base: 6, md: 8 }}
                    >
                        <VStack spacing={6} align="stretch">
                            <Box>
                                <Heading size="md">Create a new password</Heading>
                                <Text mt={1} color="gray.500" fontSize="sm">
                                    Choose a strong password that you don’t reuse on other sites.
                                </Text>
                            </Box>

                            <Divider />

                            <form onSubmit={handleSubmit}>
                                <VStack spacing={5} align="stretch">
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium">
                                            New password
                                        </FormLabel>
                                        <InputGroup>
                                            <Input
                                                type={showNew ? 'text' : 'password'}
                                                placeholder="At least 8 characters"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                autoComplete="new-password"
                                                bg={useColorModeValue('gray.50', 'gray.700')}
                                                _focus={{
                                                    borderColor: 'green.500',
                                                    boxShadow:
                                                        '0 0 0 1px var(--chakra-colors-green-500)',
                                                }}
                                                required
                                            />
                                            <InputRightElement>
                                                <IconButton
                                                    variant="ghost"
                                                    size="sm"
                                                    aria-label={showNew ? 'Hide password' : 'Show password'}
                                                    icon={showNew ? <ViewOffIcon /> : <ViewIcon />}
                                                    onClick={() => setShowNew((prev) => !prev)}
                                                />
                                            </InputRightElement>
                                        </InputGroup>
                                        <Text mt={2} fontSize="xs" color="gray.500">
                                            Use at least 8 characters, including a mix of letters,
                                            numbers, and symbols.
                                        </Text>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium">
                                            Confirm password
                                        </FormLabel>
                                        <InputGroup>
                                            <Input
                                                type={showConfirm ? 'text' : 'password'}
                                                placeholder="Repeat your password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                autoComplete="new-password"
                                                bg={useColorModeValue('gray.50', 'gray.700')}
                                                _focus={{
                                                    borderColor: 'green.500',
                                                    boxShadow:
                                                        '0 0 0 1px var(--chakra-colors-green-500)',
                                                }}
                                                required
                                            />
                                            <InputRightElement>
                                                <IconButton
                                                    variant="ghost"
                                                    size="sm"
                                                    aria-label={
                                                        showConfirm ? 'Hide password' : 'Show password'
                                                    }
                                                    icon={showConfirm ? <ViewOffIcon /> : <ViewIcon />}
                                                    onClick={() => setShowConfirm((prev) => !prev)}
                                                />
                                            </InputRightElement>
                                        </InputGroup>
                                    </FormControl>

                                    <Button
                                        type="submit"
                                        colorScheme="green"
                                        isLoading={loading}
                                        loadingText="Resetting password..."
                                        size="md"
                                        w="full"
                                        borderRadius="lg"
                                        mt={2}
                                    >
                                        Reset password
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

                                    {!resetToken && (
                                        <Text fontSize="xs" color="red.500" textAlign="center">
                                            This reset link seems invalid or expired. Go back to{' '}
                                            <Link
                                                to="/auth/request-otp"
                                                style={{
                                                    fontWeight: 600,
                                                    textDecoration: 'underline',
                                                }}
                                            >
                                                request a new reset link
                                            </Link>
                                            .
                                        </Text>
                                    )}
                                </VStack>
                            </form>
                        </VStack>
                    </Box>
                </Stack>
            </Box>
        </Box>
    )
}