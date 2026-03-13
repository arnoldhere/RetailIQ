import React, { useEffect, useRef, useState } from "react";
import {
	Box,
	Button,
	Divider,
	FormControl,
	FormLabel,
	Heading,
	HStack,
	Image,
	Input,
	InputGroup,
	InputRightElement,
	Link as ChakraLink,
	Select,
	Stack,
	Text,
	VStack,
	useToast,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useAuth } from "../../context/AuthContext";

function Signup() {
	const { signup } = useAuth();
	const navigate = useNavigate();
	const toast = useToast();
	const [form, setForm] = useState({
		firstname: "",
		lastname: "",
		email: "",
		password: "",
		phone: "",
		gender: "",
		dob: "",
	});
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
		const nextErrors = {};
		if (!values.firstname || values.firstname.trim().length < 2) {
			nextErrors.firstname = "First name is required (min 2 chars)";
		}
		if (!values.lastname || values.lastname.trim().length < 1) {
			nextErrors.lastname = "Last name is required";
		}
		if (!values.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
			nextErrors.email = "Enter a valid email";
		}
		if (!values.password || values.password.length < 8) {
			nextErrors.password = "Password must be at least 8 characters";
		}
		if (values.phone && !/^\+?\d{7,15}$/.test(values.phone)) {
			nextErrors.phone = "Phone must be digits (7-15 chars)";
		}
		if (!values.gender) {
			nextErrors.gender = "Please select gender";
		}
		if (!values.dob) {
			nextErrors.dob = "Date of birth is required";
		}
		return nextErrors;
	}

	async function onSubmit(event) {
		event.preventDefault();
		setErrors({});
		const validationErrors = validate(form);
		if (Object.keys(validationErrors).length) {
			setErrors(validationErrors);
			return;
		}

		try {
			setBusy(true);
			const res = await signup(form);
			if (res?.status === 201 || res?.status === 200) {
				toast({
					title: "Account created",
					description: "Welcome to RetailIQ",
					status: "success",
					duration: 3000,
				});
				navigate("/");
			}
		} catch (err) {
			const payload = err?.response?.data;
			if (payload?.errors && Array.isArray(payload.errors)) {
				const map = {};
				payload.errors.forEach((item) => {
					map[item.field || "form"] = item.msg || item.message || "Error";
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

	const fieldStyles = {
		bg: "var(--surface-secondary)",
		borderColor: "var(--border-light)",
		_hover: { borderColor: "var(--primary-light)" },
		_focus: {
			borderColor: "var(--primary-color)",
			boxShadow: "0 0 0 1px rgba(0, 102, 204, 0.45)",
		},
		color: "var(--text-primary)",
		_placeholder: { color: "var(--text-tertiary)" },
		borderRadius: "xl",
		h: "3.25rem",
	};

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
						>
							RetailIQ Onboarding
						</Text>
						<Heading
							fontSize={{ base: "3xl", md: "4xl" }}
							mb={4}
							fontWeight="extrabold"
							lineHeight="1.1"
							letterSpacing="-0.03em"
						>
							Create your account with the same clean workspace experience.
						</Heading>
						<Text opacity={0.92} fontSize="md" maxW="md">
							Join RetailIQ to access dashboards, orders, supplier workflows, and customer tools from one streamlined platform.
						</Text>
					</Box>

					<VStack align="stretch" spacing={4} position="relative" mt={8}>
						{[
							"Unified access across customer, supplier, and admin experiences",
							"Cleaner workflows for products, orders, and profile management",
							"Modern account onboarding aligned with the updated login design",
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
								<Box mt={1} w={2.5} h={2.5} borderRadius="full" bg="white" flexShrink={0} />
								<Text fontSize="sm" opacity={0.95}>
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
						<Text
							fontSize="xs"
							opacity={0.85}
							mb={2}
							fontWeight="medium"
							textTransform="uppercase"
							letterSpacing="0.16em"
						>
							Account Setup
						</Text>
						<Text fontSize="sm" opacity={0.95}>
							Use your real contact details so RetailIQ can keep your account and role-specific access synchronized.
						</Text>
						<Image rounded="lg" src="/logo_retailiq.png" alt="RetailIQ" w="24" mt={4} />
					</Box>
				</Box>

				<Box flex="1" bg="white" p={{ base: 6, md: 10 }} display="flex" alignItems="center">
					<Box w="full" maxW="md" mx="auto">
						<Text
							fontSize="xs"
							fontWeight="700"
							textTransform="uppercase"
							letterSpacing="0.2em"
							color="var(--primary-color)"
							mb={3}
						>
							New Account
						</Text>
						<Heading
							size="lg"
							mb={2}
							color="var(--text-primary)"
							letterSpacing="-0.02em"
							fontWeight="semibold"
						>
							Create your RetailIQ account
						</Heading>
						<Text fontSize="sm" color="var(--text-secondary)" mb={8}>
							Fill in your details to start using the updated RetailIQ platform.
						</Text>

						<form onSubmit={onSubmit} noValidate>
							<VStack spacing={5} align="stretch">
								<HStack spacing={4} align="start">
									<FormControl isInvalid={!!errors.firstname} isRequired>
										<FormLabel fontSize="sm" color="var(--text-primary)" fontWeight="600">
											First name
										</FormLabel>
										<Input
											value={form.firstname}
											onChange={(e) => setForm({ ...form, firstname: e.target.value })}
											placeholder="First name"
											{...fieldStyles}
										/>
										{errors.firstname && <Text color="red.500" fontSize="xs" mt={1}>{errors.firstname}</Text>}
									</FormControl>

									<FormControl isInvalid={!!errors.lastname} isRequired>
										<FormLabel fontSize="sm" color="var(--text-primary)" fontWeight="600">
											Last name
										</FormLabel>
										<Input
											value={form.lastname}
											onChange={(e) => setForm({ ...form, lastname: e.target.value })}
											placeholder="Last name"
											{...fieldStyles}
										/>
										{errors.lastname && <Text color="red.500" fontSize="xs" mt={1}>{errors.lastname}</Text>}
									</FormControl>
								</HStack>

								<FormControl isInvalid={!!errors.email} isRequired>
									<FormLabel fontSize="sm" color="var(--text-primary)" fontWeight="600">
										Email
									</FormLabel>
									<Input
										type="email"
										value={form.email}
										onChange={(e) => setForm({ ...form, email: e.target.value })}
										placeholder="you@example.com"
										autoComplete="email"
										{...fieldStyles}
									/>
									{errors.email && <Text color="red.500" fontSize="xs" mt={1}>{errors.email}</Text>}
								</FormControl>

								<FormControl isInvalid={!!errors.phone}>
									<FormLabel fontSize="sm" color="var(--text-primary)" fontWeight="600">
										Phone
									</FormLabel>
									<Input
										value={form.phone}
										onChange={(e) => setForm({ ...form, phone: e.target.value })}
										placeholder="1234567890"
										autoComplete="tel"
										{...fieldStyles}
									/>
									{errors.phone && <Text color="red.500" fontSize="xs" mt={1}>{errors.phone}</Text>}
								</FormControl>

								<HStack spacing={4} align="start">
									<FormControl isInvalid={!!errors.gender} isRequired>
										<FormLabel fontSize="sm" color="var(--text-primary)" fontWeight="600">
											Gender
										</FormLabel>
										<Select
											value={form.gender}
											onChange={(e) => setForm({ ...form, gender: e.target.value })}
											placeholder="Select gender"
											{...fieldStyles}
										>
											<option value="male">Male</option>
											<option value="female">Female</option>
										</Select>
										{errors.gender && <Text color="red.500" fontSize="xs" mt={1}>{errors.gender}</Text>}
									</FormControl>

									<FormControl isInvalid={!!errors.dob} isRequired>
										<FormLabel fontSize="sm" color="var(--text-primary)" fontWeight="600">
											Date of Birth
										</FormLabel>
										<Input
											type="date"
											value={form.dob}
											onChange={(e) => setForm({ ...form, dob: e.target.value })}
											{...fieldStyles}
										/>
										{errors.dob && <Text color="red.500" fontSize="xs" mt={1}>{errors.dob}</Text>}
									</FormControl>
								</HStack>

								<FormControl isInvalid={!!errors.password} isRequired>
									<FormLabel fontSize="sm" color="var(--text-primary)" fontWeight="600">
										Password
									</FormLabel>
									<InputGroup>
										<Input
											type={showPass ? "text" : "password"}
											value={form.password}
											onChange={(e) => setForm({ ...form, password: e.target.value })}
											placeholder="Minimum 8 characters"
											autoComplete="new-password"
											{...fieldStyles}
										/>
										<InputRightElement h="3.25rem">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setShowPass((value) => !value)}
												aria-label={showPass ? "Hide password" : "Show password"}
												_hover={{ bg: "transparent" }}
												color="var(--text-secondary)"
											>
												{showPass ? <ViewOffIcon /> : <ViewIcon />}
											</Button>
										</InputRightElement>
									</InputGroup>
									{errors.password && <Text color="red.500" fontSize="xs" mt={1}>{errors.password}</Text>}
								</FormControl>

								{errors.form && (
									<Box
										w="full"
										bg="red.50"
										border="1px solid"
										borderColor="red.200"
										borderRadius="xl"
										p={3}
									>
										<Text color="red.700" fontSize="sm">
											{errors.form}
										</Text>
									</Box>
								)}

								<Button
									type="submit"
									isLoading={busy}
									loadingText="Creating account"
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
									Create account
								</Button>

								<HStack justifyContent="center" spacing={1}>
									<Text fontSize="sm" color="var(--text-secondary)">
										Already have an account?
									</Text>
									<ChakraLink
										as={Link}
										to="/auth/login"
										color="var(--primary-color)"
										fontWeight="600"
										fontSize="sm"
										_hover={{ textDecoration: "underline", color: "var(--primary-dark)" }}
									>
										Sign in
									</ChakraLink>
								</HStack>

								<Divider borderColor="var(--border-light)" pt={2} />
								<Text fontSize="xs" color="var(--text-tertiary)" textAlign="center">
									By creating an account, you agree to our{" "}
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

export default Signup;
