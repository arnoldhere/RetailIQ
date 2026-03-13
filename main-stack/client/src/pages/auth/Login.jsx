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
	Image,
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
			minH="100vh"
			w="100vw"
			bg="linear-gradient(180deg, #eef5ff 0%, #f8fbff 55%, #ffffff 100%)"
			position="relative"
			overflow="hidden"
			px={{ base: 4, md: 8 }}
			py={{ base: 6, md: 10 }}
		>
			<Box
				position="absolute"
				top="-10rem"
				right="-6rem"
				w="24rem"
				h="24rem"
				borderRadius="full"
				bg="rgba(0, 102, 204, 0.12)"
				filter="blur(18px)"
			/>
			<Box
				position="absolute"
				bottom="-8rem"
				left="-4rem"
				w="20rem"
				h="20rem"
				borderRadius="full"
				bg="rgba(0, 168, 232, 0.12)"
				filter="blur(18px)"
			/>
			<Stack
				ref={rootRef}
				w="full"
				maxW={{ base: "lg", md: "6xl" }}
				direction={{ base: "column-reverse", md: "row" }}
				spacing={{ base: 6, md: 0 }}
				align="stretch"
				mx="auto"
				position="relative"
				zIndex={1}
				borderRadius="3xl"
				overflow="hidden"
				boxShadow="0 28px 80px rgba(15, 23, 42, 0.12)"
				border="1px solid"
				borderColor="rgba(226, 232, 240, 0.9)"
				bg="white"
				textColor="blackAlpha.400"
			>
				<Box
					flex={{ base: "0 0 auto", md: "0 0 48%" }}
					bgGradient="linear(160deg, #0f3d91 0%, #0066cc 55%, #12a4d9 100%)"
					color="white"
					p={{ base: 7, md: 10 }}
					display="flex"
					flexDirection="column"
					justifyContent="space-between"
					position="relative"
					overflow="hidden"
				>
					<Box
						position="absolute"
						top="-20%"
						right="-10%"
						w="16rem"
						h="16rem"
						borderRadius="full"
						bgGradient="radial(circle, whiteAlpha.300, transparent)"
						opacity={0.55}
						pointerEvents="none"
					/>
					<Box
						position="absolute"
						bottom="-4rem"
						left="-4rem"
						w="14rem"
						h="14rem"
						borderRadius="full"
						bg="whiteAlpha.200"
						filter="blur(8px)"
					/>

					<Box position="relative">
						<Text
							fontWeight="semibold"
							fontSize="xs"
							textTransform="uppercase"
							letterSpacing="0.24em"
							mb={4}
							opacity={0.9}
							textColor="wheat"
						>
							RetailIQ Control Center
						</Text>
						<Heading
							fontSize={{ base: "3xl", md: "4xl" }}
							mb={4}
							fontWeight="extrabold"
							lineHeight="1.1"
							letterSpacing="-0.03em"
							textColor="yellowgreen"
						>
							Run your store with cleaner signals and faster decisions.
						</Heading>
						<Text fontSize="md" maxW="md" textColor="wheat">
							Access customer orders, supplier workflows, dashboards, and operational tools from one consistent workspace.
						</Text>
					</Box>

					<VStack align="stretch" spacing={4} position="relative" mt={8} >
						{[
							"Unified access for admin, supplier, and customer roles",
							"Real-time order visibility and product insights",
							"Faster workflows built around the updated RetailIQ design",
						].map((item) => (
							<HStack
								key={item}
								align="flex-start"
								spacing={3}
								bg="whiteAlpha.160"
								border="1px solid"
								borderColor="whiteAlpha.260"
								borderRadius="2xl"
								px={4}
								py={3}
							>
								<Box
									mt={1}
									w={2.5}
									h={2.5}
									borderRadius="full"
									bg="white"
									flexShrink={0}
								/>
								<Text fontSize="sm" opacity={0.95} textColor="wheat">
									{item}
								</Text>
							</HStack>
						))}
					</VStack>

					<Box
						mt={8}
						position="relative"
						bg="rgba(255,255,255,0.14)"
						border="1px solid"
						borderColor="whiteAlpha.250"
						borderRadius="2xl"
						p={5}
					>
						<Text fontSize="xs" opacity={0.85} mb={2} fontWeight="medium" textTransform="uppercase" letterSpacing="0.16em">
							Recommended
						</Text>
						<Text fontSize="sm" opacity={0.95}>
							Sign in with the same email or phone used during registration so your role-specific dashboard opens correctly.
						</Text>
						<Image rounded="lg" src="/logo_retailiq.png" alt="RetailIQ" w="24" mt={4} />
					</Box>
				</Box>

				<Box
					flex="1"
					bg="white"
					p={{ base: 6, md: 10 }}
					display="flex"
					alignItems="center"
				>
					<Box w="full" maxW="md" mx="auto">
						<Text
							fontSize="xs"
							fontWeight="700"
							textTransform="uppercase"
							letterSpacing="0.2em"
							color="var(--primary-color)"
							mb={3}
						>
							Account Login
						</Text>
						<Heading
							size="lg"
							mb={2}
							color="var(--text-primary)"
							letterSpacing="-0.02em"
							fontWeight="semibold"
						>
							Sign in to RetailIQ
						</Heading>
						<Text fontSize="sm" color="var(--text-secondary)" mb={8}>
							Use your email or phone number to continue to the latest dashboard experience.
						</Text>

						<form onSubmit={onSubmit} noValidate>
							<VStack spacing={5} align="stretch">
								<FormControl isInvalid={!!errors.identifier} isRequired>
									<FormLabel fontSize="sm" color="var(--text-primary)" fontWeight="600">
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
										bg="var(--surface-secondary)"
										borderColor="var(--border-light)"
										_hover={{ borderColor: "var(--primary-light)" }}
										_focus={{
											borderColor: "var(--primary-color)",
											boxShadow: "0 0 0 1px rgba(0, 102, 204, 0.45)",
										}}
										color="var(--text-primary)"
										_placeholder={{ color: "var(--text-tertiary)" }}
										borderRadius="xl"
										h="3.25rem"
									/>
									{errors.identifier && (
										<Text color="red.500" fontSize="xs" mt={1}>
											{errors.identifier}
										</Text>
									)}
								</FormControl>

								<FormControl isInvalid={!!errors.password} isRequired>
									<HStack justify="space-between" mb={1}>
										<FormLabel fontSize="sm" mb={0} color="var(--text-primary)" fontWeight="600">
											Password
										</FormLabel>
										<ChakraLink
											as={Link}
											to="/auth/forgot-password"
											fontSize="xs"
											color="var(--primary-color)"
											_hover={{
												textDecoration: "underline",
												color: "var(--primary-dark)",
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
											bg="var(--surface-secondary)"
											borderColor="var(--border-light)"
											_hover={{ borderColor: "var(--primary-light)" }}
											_focus={{
												borderColor: "var(--primary-color)",
												boxShadow: "0 0 0 1px rgba(0, 102, 204, 0.45)",
											}}
											color="var(--text-primary)"
											_placeholder={{ color: "var(--text-tertiary)" }}
											borderRadius="xl"
											h="3.25rem"
										/>
										<InputRightElement>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setShowPass((s) => !s)}
												aria-label={showPass ? "Hide password" : "Show password"}
												_hover={{ bg: "transparent" }}
												color="var(--text-secondary)"
											>
												{showPass ? (
													<ViewOffIcon />
												) : (
													<ViewIcon />
												)}
											</Button>
										</InputRightElement>
									</InputGroup>
									{errors.password && (
										<Text color="red.500" fontSize="xs" mt={1}>
											{errors.password}
										</Text>
									)}
								</FormControl>

								{errors.form && (
									<Box
										w="full"
										bg="red.50"
										border="1px solid"
										borderColor="red.200"
										borderRadius="xl"
										p={3}
										mt={1}
									>
										<Text color="red.700" fontSize="sm">
											{errors.form}
										</Text>
									</Box>
								)}

								<Button
									type="submit"
									isLoading={busy}
									loadingText="Signing in"
									size="lg"
									mt={2}
									w="full"
									bg="var(--primary-color)"
									color="white"
									fontWeight="semibold"
									borderRadius="xl"
									h="3.35rem"
									_hover={{
										bg: "var(--primary-dark)",
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
									<Text fontSize="sm" color="var(--text-secondary)">
										New to RetailIQ?
									</Text>
									<ChakraLink
										as={Link}
										to="/auth/signup"
										color="var(--primary-color)"
										fontWeight="600"
										fontSize="sm"
										_hover={{ textDecoration: "underline", color: "var(--primary-dark)" }}
									>
										Create an account
									</ChakraLink>
								</HStack>

								<Divider borderColor="var(--border-light)" pt={2} />
								<Text fontSize="xs" color="var(--text-tertiary)" textAlign="center">
									By signing in, you agree to our{" "}
									<ChakraLink as={Link} to="/legal/terms" color="var(--primary-color)">
										Terms
									</ChakraLink>{" "}
									&amp;{" "}
									<ChakraLink as={Link} to="/legal/privacy" color="var(--primary-color)">
										Privacy Policy
									</ChakraLink>
									.
								</Text>
							</VStack>
						</form>
					</Box>
				</Box>
			</Stack>
		</Box>
	);
}

export default Login;
