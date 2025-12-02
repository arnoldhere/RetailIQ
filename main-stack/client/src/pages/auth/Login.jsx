import React, { useEffect, useRef, useState } from "react";
import {
	Box,
	Button,
	FormControl,
	FormLabel,
	Input,
	InputGroup,
	InputRightElement,
	Heading,
	Text,
	VStack,
	HStack,
	useToast,
	Link as ChakraLink,
	Stack,
	Divider,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import gsap from "gsap";

function Login() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const toast = useToast();

	const [form, setForm] = useState({ identifier: "", password: "" });
	const [errors, setErrors] = useState({});
	const [busy, setBusy] = useState(false);
	const [showPass, setShowPass] = useState(false);
	const rootRef = useRef(null);

	useEffect(() => {
		const el = rootRef.current;
		if (!el) return;
		gsap.fromTo(
			el,
			{ opacity: 0, y: 16 },
			{ opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
		);
	}, []);

	function validate(values) {
		const e = {};
		if (!values.identifier || values.identifier.trim().length < 3) {
			e.identifier = "Email or phone is required";
		}
		if (!values.password || values.password.length < 1) {
			e.password = "Password is required";
		}
		return e;
	}

	async function onSubmit(e) {
		e.preventDefault();
		setErrors({});
		const val = validate(form);
		if (Object.keys(val).length) return setErrors(val);

		try {
			setBusy(true);
			const res = await login(form);
			if (res?.status === 200) {
				toast({
					title: "Signed in",
					status: "success",
					duration: 2000,
					isClosable: true,
				});
				navigate("/");
			}
		} catch (err) {
			const payload = err?.response?.data;
			if (payload?.errors && Array.isArray(payload.errors)) {
				const map = {};
				payload.errors.forEach((it) => {
					map[it.field || "form"] = it.msg || it.message || "Error";
				});
				setErrors(map);
			} else if (payload?.message) {
				setErrors({ form: payload.message });
			} else {
				setErrors({ form: "Unexpected error, please try again" });
			}
		} finally {
			setBusy(false);
		}
	}

	return (
		<Box
			h="100vh"
			w="100vw"
			bgGradient="linear(to-br, gray.900, gray.800)"
			display="flex"
			alignItems="center"
			justifyContent="center"
			px={{ base: 4, md: 6 }}
			py={{ base: 8, md: 12 }}
			fontFamily="'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            overflow="hidden"
		>
			<Stack
				ref={rootRef}
				w="full"
				maxW={{ base: "lg", md: "4xl", lg: "5xl" }}
				direction={{ base: "column-reverse", md: "row" }}
				spacing={{ base: 6, md: 8 }}
				align="stretch"
			>
				{/* Left Panel (brand / hero) */}
				<Box
					flex={{ base: "0 0 auto", md: "0 0 42%" }}
					bgGradient="linear(to-br, purple.700, cyan.500)"
					color="white"
					borderRadius={{ base: "2xl", md: "2xl 0 0 2xl" }}
					boxShadow={{ base: "2xl", md: "2xl" }}
					p={{ base: 7, md: 9 }}
					display="flex"
					flexDirection="column"
					justifyContent="space-between"
					position="relative"
					overflow="hidden"
				>
					{/* Subtle gradient overlay accent */}
					<Box
						position="absolute"
						top="-50%"
						right="-40%"
						w="80%"
						h="80%"
						bgGradient="radial(circle, whiteAlpha.300, transparent)"
						opacity={0.4}
						pointerEvents="none"
					/>

					<Box position="relative">
						<Text
							fontWeight="semibold"
							fontSize="xs"
							textTransform="uppercase"
							letterSpacing="0.15em"
							mb={3}
							opacity={0.9}
						>
							RetailIQ
						</Text>
						<Heading
							size="lg"
							mb={3}
							fontWeight="extrabold"
							lineHeight="1.2"
							letterSpacing="-0.03em"
						>
							Welcome back,
							<br />
							let&apos;s grow your store 📈
						</Heading>
						<Text opacity={0.95} fontSize="sm" maxW="sm">
							Access your analytics, monitor live performance, and uncover
							insights that help you make confident, data-driven decisions.
						</Text>
					</Box>

					<Box mt={8} position="relative">
						<Text fontSize="xs" opacity={0.85} mb={1} fontWeight="medium">
							Pro tip
						</Text>
						<Text fontSize="sm" opacity={0.95}>
							Use the same email or phone you registered with RetailIQ to keep
							your dashboards synced across all devices.
						</Text>
					</Box>
				</Box>

				{/* Right Panel (form) */}
				<Box
					bg="gray.900"
					border="1px solid"
					borderColor="whiteAlpha.100"
					borderRadius={{ base: "2xl", md: "0 2xl 2xl 0" }}
					boxShadow={{ base: "2xl", md: "2xl" }}
					flex="1"
					p={{ base: 6, md: 8 }}
				>
					<Heading
						size="md"
						mb={1}
						color="white"
						letterSpacing="-0.02em"
						fontWeight="semibold"
					>
						Sign in to your account
					</Heading>
					<Text fontSize="sm" color="gray.400" mb={6}>
						Enter your credentials to continue to your RetailIQ dashboard.
					</Text>

					<form onSubmit={onSubmit} noValidate>
						<VStack spacing={4} align="stretch">
							<FormControl isInvalid={!!errors.identifier} isRequired>
								<FormLabel fontSize="sm" color="gray.200">
									Email or Phone
								</FormLabel>
								<Input
									size="md"
									value={form.identifier}
									onChange={(e) =>
										setForm({ ...form, identifier: e.target.value })
									}
									placeholder="you@example.com or +11234567890"
									autoComplete="username"
									bg="gray.800"
									borderColor="gray.700"
									_hover={{ borderColor: "purple.400" }}
									_focus={{
										borderColor: "purple.400",
										boxShadow: "0 0 0 1px rgba(168, 85, 247, 0.7)",
									}}
									color="gray.50"
									_placeholder={{ color: "gray.500" }}
								/>
								{errors.identifier && (
									<Text color="red.400" fontSize="xs" mt={1}>
										{errors.identifier}
									</Text>
								)}
							</FormControl>

							<FormControl isInvalid={!!errors.password} isRequired>
								<HStack justify="space-between" mb={1}>
									<FormLabel fontSize="sm" mb={0} color="gray.200">
										Password
									</FormLabel>
									<ChakraLink
										as={Link}
										to="/auth/forgot-password"
										fontSize="xs"
										color="purple.300"
										_hover={{
											textDecoration: "underline",
											color: "purple.200",
										}}
									>
										Forgot password?
									</ChakraLink>
								</HStack>
								<InputGroup>
									<Input
										size="md"
										type={showPass ? "text" : "password"}
										value={form.password}
										onChange={(e) =>
											setForm({ ...form, password: e.target.value })
										}
										placeholder="Your password"
										autoComplete="current-password"
										bg="gray.800"
										borderColor="gray.700"
										_hover={{ borderColor: "purple.400" }}
										_focus={{
											borderColor: "purple.400",
											boxShadow: "0 0 0 1px rgba(168, 85, 247, 0.7)",
										}}
										color="gray.50"
										_placeholder={{ color: "gray.500" }}
									/>
									<InputRightElement>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setShowPass((s) => !s)}
											aria-label={showPass ? "Hide password" : "Show password"}
											_hover={{ bg: "whiteAlpha.100" }}
										>
											{showPass ? (
												<ViewOffIcon color="gray.400" />
											) : (
												<ViewIcon color="gray.400" />
											)}
										</Button>
									</InputRightElement>
								</InputGroup>
								{errors.password && (
									<Text color="red.400" fontSize="xs" mt={1}>
										{errors.password}
									</Text>
								)}
							</FormControl>

							{errors.form && (
								<Box
									w="full"
									bg="red.900"
									border="1px solid"
									borderColor="red.500"
									borderRadius="md"
									p={2.5}
									mt={1}
								>
									<Text color="red.100" fontSize="xs">
										{errors.form}
									</Text>
								</Box>
							)}

							<Button
								type="submit"
								isLoading={busy}
								loadingText="Signing in"
								size="md"
								mt={2}
								w="full"
								bgGradient="linear(to-r, purple.500, cyan.400)"
								color="white"
								fontWeight="semibold"
								_hover={{
									bgGradient: "linear(to-r, purple.400, cyan.300)",
									transform: "translateY(-1px)",
									boxShadow: "lg",
								}}
								_active={{
									transform: "translateY(0px) scale(0.99)",
									boxShadow: "md",
								}}
							>
								Sign in
							</Button>

							<HStack justifyContent="center" spacing={1} mt={1}>
								<Text fontSize="sm" color="gray.400">
									New to RetailIQ?
								</Text>
								<ChakraLink
									as={Link}
									to="/auth/signup"
									color="purple.300"
									fontWeight="600"
									fontSize="sm"
									_hover={{ textDecoration: "underline", color: "purple.200" }}
								>
									Create an account
								</ChakraLink>
							</HStack>

							<Divider borderColor="gray.700" pt={2} />
							<Text fontSize="xs" color="gray.500" textAlign="center">
								By signing in, you agree to our{" "}
								<ChakraLink as={Link} to="/legal/terms" color="purple.300">
									Terms
								</ChakraLink>{" "}
								&amp;{" "}
								<ChakraLink as={Link} to="/legal/privacy" color="purple.300">
									Privacy Policy
								</ChakraLink>
								.
							</Text>
						</VStack>
					</form>
				</Box>
			</Stack>
		</Box>
	);
}

export default Login;
