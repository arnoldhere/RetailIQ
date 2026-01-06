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
	const cardRef = useRef(null);

	useEffect(() => {
		const el = cardRef.current;
		if (!el) return;
		gsap.fromTo(
			el,
			{ opacity: 0, y: 20 },
			{ opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
		);
	}, []);

	function validate(values) {
		const e = {};
		if (!values.firstname || values.firstname.trim().length < 2)
			e.firstname = "First name is required (min 2 chars)";
		if (!values.lastname || values.lastname.trim().length < 1)
			e.lastname = "Last name is required";
		if (!values.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email))
			e.email = "Enter a valid email";
		if (!values.password || values.password.length < 8)
			e.password = "Password must be at least 8 characters";
		if (values.phone && !/^\+?\d{7,15}$/.test(values.phone))
			e.phone = "Phone must be digits (7-15 chars)";
		if (!values.gender)
			e.gender = "Please select gender";
		if (!values.dob)
			e.dob = "Date of birth is required";
		return e;
	}


	async function onSubmit(e) {
		e.preventDefault();
		setErrors({});
		const valErr = validate(form);
		if (Object.keys(valErr).length) return setErrors(valErr);

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
			// Server returns { errors: [{ field, msg }] }
			const payload = err?.response?.data;
			if (payload?.errors && Array.isArray(payload.errors)) {
				const map = {};
				payload.errors.forEach(
					(it) => (map[it.field || "form"] = it.msg || it.message || "Error")
				);
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
				ref={cardRef}
				direction={{ base: "column-reverse", md: "row" }}
				w="full"
				maxW={{ base: "lg", md: "4xl", lg: "5xl" }}
				spacing={{ base: 6, md: 8 }}
				align="stretch"
			>
				{/* Left Panel (brand / hero) */}
				<Box
					flexBasis={{ base: "auto", md: "45%" }}
					bgGradient="linear(to-br, purple.700, cyan.500)"
					color="white"
					p={{ base: 7, md: 9 }}
					borderRadius={{ base: "2xl", md: "2xl 0 0 2xl" }}
					boxShadow={{ base: "2xl", md: "2xl" }}
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
							Create your RetailIQ account
						</Heading>
						<Text opacity={0.95} fontSize="sm" maxW="sm">
							Smart analytics for local shops — forecast demand, optimize
							inventory, and make confident pricing decisions powered by data.
						</Text>
					</Box>
					<Image rounded='lg' src='/logo_retailiq.png' alt='RetailIQ' w='2xs' />
					<Box mt={8} position="relative">
						<Text fontSize="xs" opacity={0.85} mb={1} fontWeight="medium">
							Why join?
						</Text>
						<Text fontSize="sm" opacity={0.95}>
							Get a unified view of your store performance, from sales and stock
							to product trends, all in a single dashboard.
						</Text>
					</Box>
				</Box>

				{/* Right Panel (form) */}
				<Box
					bg="gray.900"
					border="1px solid"
					borderColor="whiteAlpha.100"
					p={{ base: 6, md: 10 }}
					borderRadius={{ base: "2xl", md: "0 2xl 2xl 0" }}
					boxShadow={{ base: "2xl", md: "2xl" }}
					flex={1}
				>
					<Heading
						size="md"
						mb={1}
						color="white"
						letterSpacing="-0.02em"
						fontWeight="semibold"
					>
						Create an account
					</Heading>
					<Text fontSize="sm" color="gray.400" mb={6}>
						Fill in your details to start using RetailIQ.
					</Text>

					<form onSubmit={onSubmit} noValidate>
						<VStack spacing={4} align="stretch">
							<HStack spacing={3}>
								<FormControl isInvalid={!!errors.firstname} isRequired>
									<FormLabel color="gray.200" fontSize="sm">
										First name
									</FormLabel>
									<Input
										value={form.firstname}
										onChange={(e) =>
											setForm({ ...form, firstname: e.target.value })
										}
										placeholder="First name"
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
									{errors.firstname && (
										<Text color="red.400" fontSize="xs" mt={1}>
											{errors.firstname}
										</Text>
									)}
								</FormControl>

								<FormControl isInvalid={!!errors.lastname} isRequired>
									<FormLabel color="gray.200" fontSize="sm">
										Last name
									</FormLabel>
									<Input
										value={form.lastname}
										onChange={(e) =>
											setForm({ ...form, lastname: e.target.value })
										}
										placeholder="Last name"
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
									{errors.lastname && (
										<Text color="red.400" fontSize="xs" mt={1}>
											{errors.lastname}
										</Text>
									)}
								</FormControl>
							</HStack>

							<FormControl isInvalid={!!errors.email} isRequired>
								<FormLabel color="gray.200" fontSize="sm">
									Email
								</FormLabel>
								<Input
									type="email"
									value={form.email}
									onChange={(e) => setForm({ ...form, email: e.target.value })}
									placeholder="you@example.com"
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
								{errors.email && (
									<Text color="red.400" fontSize="xs" mt={1}>
										{errors.email}
									</Text>
								)}
							</FormControl>

							<FormControl isInvalid={!!errors.phone}>
								<FormLabel color="gray.200" fontSize="sm">
									Phone
								</FormLabel>
								<Input
									value={form.phone}
									onChange={(e) => setForm({ ...form, phone: e.target.value })}
									placeholder="1234567890"
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
								{errors.phone && (
									<Text color="red.400" fontSize="xs" mt={1}>
										{errors.phone}
									</Text>
								)}
							</FormControl>

							<HStack spacing={3}>
								{/* Gender */}
								<FormControl isInvalid={!!errors.gender} isRequired>
									<FormLabel color="gray.200" fontSize="sm">
										Gender
									</FormLabel>
									<select
										value={form.gender}
										onChange={(e) => setForm({ ...form, gender: e.target.value })}
										style={{
											width: "100%",
											padding: "10px",
											borderRadius: "6px",
											background: "#1A202C",
											color: "#EDF2F7",
											border: "1px solid #4A5568",
										}}
									>
										<option value="">Select gender</option>
										<option value="male">Male</option>
										<option value="female">Female</option>
									</select>
									{errors.gender && (
										<Text color="red.400" fontSize="xs" mt={1}>
											{errors.gender}
										</Text>
									)}
								</FormControl>

								{/* Date of Birth */}
								<FormControl isInvalid={!!errors.dob} isRequired>
									<FormLabel color="gray.200" fontSize="sm">
										Date of Birth
									</FormLabel>
									<Input
										type="date"
										value={form.dob}
										onChange={(e) => setForm({ ...form, dob: e.target.value })}
										bg="gray.800"
										borderColor="gray.700"
										_hover={{ borderColor: "purple.400" }}
										_focus={{
											borderColor: "purple.400",
											boxShadow: "0 0 0 1px rgba(168, 85, 247, 0.7)",
										}}
										color="gray.50"
									/>
									{errors.dob && (
										<Text color="red.400" fontSize="xs" mt={1}>
											{errors.dob}
										</Text>
									)}
								</FormControl>
							</HStack>


							<FormControl isInvalid={!!errors.password} isRequired>
								<FormLabel color="gray.200" fontSize="sm">
									Password
								</FormLabel>
								<InputGroup>
									<Input
										type={showPass ? "text" : "password"}
										value={form.password}
										onChange={(e) =>
											setForm({ ...form, password: e.target.value })
										}
										placeholder="Minimum 8 characters"
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
											aria-label="toggle password"
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
								colorScheme="purple"
								type="submit"
								isLoading={busy}
								loadingText="Creating account"
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
								Create account
							</Button>

							<HStack justifyContent="center" mt={2}>
								<Text fontSize="sm" color="gray.400">
									Already have an account?
								</Text>
								<ChakraLink
									as={Link}
									to="/auth/login"
									color="purple.300"
									fontWeight="600"
									fontSize="sm"
									_hover={{ textDecoration: "underline", color: "purple.200" }}
								>
									Sign in
								</ChakraLink>
							</HStack>

							<Divider borderColor="gray.700" pt={2} />
							<Text fontSize="xs" color="gray.500" textAlign="center">
								By creating an account, you agree to our{" "}
								<ChakraLink as={Link} to="/legal/terms" color="purple.300">
									Terms
								</ChakraLink>{" "}
								&amp{" "}
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

export default Signup;
