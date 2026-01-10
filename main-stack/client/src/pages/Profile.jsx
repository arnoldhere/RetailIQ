import React, { useState, useEffect, useRef } from 'react';
import {
	Box,
	Container,
	Heading,
	VStack,
	HStack,
	FormControl,
	FormLabel,
	Input,
	Button,
	Grid,
	GridItem,
	useToast,
	Spinner,
	Text,
	Divider,
	Avatar,
	Badge,
	useColorModeValue,
	Textarea,
} from '@chakra-ui/react';
import { ArrowBackIcon, EditIcon, CheckIcon, SmallCloseIcon } from '@chakra-ui/icons';
import { FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import * as userApi from "../api/user"
export default function Profile() {
	const { user, loading } = useAuth();
	const navigate = useNavigate();
	const toast = useToast();

	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({
		firstname: '',
		lastname: '',
		name: '',
		email: '',
		phone: '',
		address: '',
		dob: '',
	});

	const [isSaving, setIsSaving] = useState(false);
	const [errors, setErrors] = useState({});
	const [isDetectingLocation, setIsDetectingLocation] = useState(false);
	const formatDateOnly = (dateString) => {
		if (!dateString) return '';
		return dateString.split('T')[0];
	};

	// Colors for dark/light mode
	const bgCard = useColorModeValue('gray.50', 'rgba(11,18,32,0.8)');
	const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
	const textPrimary = useColorModeValue('gray.900', 'gray.50');
	const textSecondary = useColorModeValue('gray.600', 'gray.400');

	// Keep a snapshot of initial form data so we can reset on cancel
	const initialFormDataRef = useRef(null);

	// Initialize form with user data
	useEffect(() => {
		if (user) {
			const base = {
				firstname: user.firstname || '',
				lastname: user.lastname || '',
				name: '',
				email: user.email || '',
				phone: user.phone || '',
				address: user.address || '',
				dob: user.dob || '',
			};

			setFormData(base);
			initialFormDataRef.current = base;

			// If supplier, fetch supplier record to populate 'name'
			if (user.role === 'supplier') {
				(async () => {
					try {
						const res = await fetch('/api/user/supplier-profile', { credentials: 'include' });
						if (res.ok) {
							const json = await res.json();
							setFormData(prev => {
								const updated = { ...prev, name: json.supplier?.name || '' };
								initialFormDataRef.current = updated;
								return updated;
							});
						}
					} catch (err) {
						console.error('Failed to fetch supplier profile', err);
					}
				})();
			}
		}
	}, [user]);

	// Redirect if not logged in
	if (loading) {
		return (
			<Box
				minH="100vh"
				bg="#020617"
				display="flex"
				flexDirection="column"
				alignItems="center"
				justifyContent="center"
			>
				<Spinner size="lg" color="cyan.400" />
			</Box>
		);
	}

	if (!user) {
		navigate('/auth/login');
		return null;
	}

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: '' }));
		}
	};

	const validateForm = () => {
		const newErrors = {};
		if (user?.role === 'supplier') {
			if (!formData.name || !formData.name.trim()) newErrors.name = 'Supplier name is required';
		} else {
			if (!formData.firstname.trim()) newErrors.firstname = 'First name is required';
			if (!formData.lastname.trim()) newErrors.lastname = 'Last name is required';
		}
		if (!formData.email.trim()) newErrors.email = 'Email is required';
		if (formData.email && !formData.email.includes('@')) newErrors.email = 'Invalid email';
		if (formData.phone && formData.phone.length < 7) newErrors.phone = 'Invalid phone number';

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// Detect current location using Geolocation API
	const detectLocation = async () => {
		if (!navigator.geolocation) {
			toast({
				title: 'Geolocation not supported',
				description: 'Your browser does not support geolocation. Please enter address manually.',
				status: 'warning',
				duration: 3000,
				isClosable: true,
				position: 'top-right',
			});
			return;
		}

		setIsDetectingLocation(true);
		try {
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					const { latitude, longitude } = position.coords;

					// Try to reverse geocode coordinates to address
					try {
						const response = await fetch(
							`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
						);
						const data = await response.json();
						const address = data.address?.road ?
							`${data.address.road}, ${data.address.city || ''}, ${data.address.postcode || ''}`.trim() :
							`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;

						setFormData(prev => ({ ...prev, address }));
						toast({
							title: 'Location detected',
							description: 'Address updated from your current location',
							status: 'success',
							duration: 2000,
							isClosable: true,
							position: 'top-right',
						});
					} catch (err) {
						console.error(err)
						// Fallback to coordinates only
						setFormData(prev => ({
							...prev,
							address: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`
						}));
						toast({
							title: 'Location detected (coordinates only)',
							description: 'Could not retrieve street address. Saved as coordinates.',
							status: 'info',
							duration: 2000,
							isClosable: true,
							position: 'top-right',
						});
					}
				},
				(error) => {
					console.error('Geolocation error:', error);
					toast({
						title: 'Location access denied',
						description: 'Please enter address manually or enable location access.',
						status: 'warning',
						duration: 3000,
						isClosable: true,
						position: 'top-right',
					});
				}
			);
		} catch (err) {
			console.error('Geolocation error:', err);
		} finally {
			setIsDetectingLocation(false);
		}
	};

	const handleSave = async () => {
		if (!validateForm()) return;

		try {
			setIsSaving(true);
			// TODO: Implement profile update API call
			// console.log(formData);
			const userId = localStorage.getItem("retailiq_user_id")
			// Add userId safely
			// setFormData(prev => ({
			// 	...prev,
			// 	id: userId,
			// }));
			const res = await userApi.editProfile(formData, userId);
			if (!res) {
				toast({
					title: 'Error in profile update... Try again',
					description: 'error found in profile update.',
					status: 'error',
					duration: 3000,
					isClosable: true,
					position: 'top-right',
				});
				throw new Error("Profile update failed..");

			}
			// For now, show success
			toast({
				title: 'Profile Updated',
				description: 'Your profile has been updated successfully.',
				status: 'success',
				duration: 3000,
				isClosable: true,
				position: 'top-right',
			});
			setIsEditing(false);
		} catch (err) {
			toast({
				title: 'Error',
				description: err?.message || 'Failed to update profile',
				status: 'error',
				duration: 3000,
				isClosable: true,
				position: 'top-right',
			});
		} finally {
			setIsSaving(false);
		}
	};

	const calculateAge = (dob) => {
		if (!dob) return null;
		const birthDate = new Date(dob);
		const today = new Date();
		let age = today.getFullYear() - birthDate.getFullYear();
		const m = today.getMonth() - birthDate.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}
		return age;
	};


	const getRoleBadgeColor = () => {
		switch (user?.role) {
			case 'admin':
				return 'red';
			case 'supplier':
				return 'orange';
			case 'customer':
				return 'green';
			default:
				return 'gray';
		}
	};

	const getRoleLabel = () => {
		switch (user?.role) {
			case 'admin':
				return 'Administrator';
			case 'supplier':
				return 'Supplier';
			case 'customer':
				return 'Customer';
			default:
				return 'User';
		}
	};

	return (
		<Box
			minH="100vh"
			bg="#020617"
			display="flex"
			flexDirection="column"
			w='100vw'
		>
			<Navbar />

			<Box flex={1} py={{ base: 8, md: 12 }}>
				<Container maxW="container.md">
					{/* Back Button & Header */}
					<HStack mb={8} spacing={4}>
						<Button
							leftIcon={<ArrowBackIcon />}
							variant="ghost"
							color="cyan.400"
							onClick={() => navigate(-1)}
							_hover={{ bg: 'whiteAlpha.100' }}
						>
							Back
						</Button>
						<Heading size="lg" color="white">
							My Profile
						</Heading>
					</HStack>

					{/* Main Profile Card */}
					<Box
						bg={bgCard}
						border="1px solid"
						borderColor={borderColor}
						borderRadius="xl"
						p={{ base: 6, md: 8 }}
						boxShadow="lg"
						backdropFilter="blur(10px)"
					>
						{/* Profile Header Section */}
						<VStack spacing={6} align="stretch">
							{/* User Avatar & Role Badge */}
							<HStack justify="space-between" align="flex-start" pb={6} borderBottom="1px solid" borderColor={borderColor}>
								<HStack spacing={4}>
									<Avatar
										size="lg"
										name={user.role === 'supplier' ? (formData.name || `${user.firstname} ${user.lastname}`) : `${user.firstname} ${user.lastname}`}
										bgGradient="linear(to-r, cyan.400, purple.500)"
										color="white"
										fontWeight="bold"
										fontSize="xl"
									/>
									<VStack align="flex-start" spacing={1}>
										<Heading size="md" color={textPrimary}>
											{user.role === 'supplier' ? (formData.name || `${user.firstname} ${user.lastname}`) : `${user.firstname} ${user.lastname}`}
										</Heading>
										<Badge colorScheme={getRoleBadgeColor()} fontSize="xs" px={2} py={1}>
											{getRoleLabel()}
										</Badge>
										<Text fontSize="sm" color={textSecondary}>
											ID: #{user.id}
										</Text>
									</VStack>
								</HStack>
								<Button
									leftIcon={isEditing ? <CheckIcon /> : <EditIcon />}
									colorScheme={isEditing ? 'green' : 'cyan'}
									variant={isEditing ? 'solid' : 'outline'}
									size="sm"
									onClick={() => {
										if (isEditing) {
											handleSave();
										} else {
											setIsEditing(true);
										}
									}}
									isLoading={isSaving}
									loadingText="Saving..."
								>
									{isEditing ? 'Save Changes' : 'Edit Profile'}
								</Button>
							</HStack>

							{/* Form Section */}
							<VStack spacing={5} align="stretch">
								<Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5}>
{/* For suppliers show a single name field, otherwise show first/last name */}
				{user.role === 'supplier' ? (
					<FormControl isInvalid={!!errors.name}>
						<FormLabel fontSize="sm" fontWeight="600" color={textPrimary} mb={2}>Supplier / Company Name</FormLabel>
						<Input
							name="name"
							value={formData.name}
							onChange={handleInputChange}
							isReadOnly={!isEditing}
							placeholder="Supplier / company name"
							bg={isEditing ? 'whiteAlpha.50' : 'transparent'}
							border="1px solid"
							borderColor={isEditing ? 'cyan.400' : 'whiteAlpha.200'}
							_hover={{ borderColor: isEditing ? 'cyan.300' : 'whiteAlpha.200' }}
							_focus={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.5)' }}
							color={textPrimary}
							_placeholder={{ color: textSecondary }}
							transition="all 0.2s"
						/>
						{errors.name && (
							<Text color="red.400" fontSize="xs" mt={1}>{errors.name}</Text>
						)}
					</FormControl>
				) : (
					<>
						<FormControl isInvalid={!!errors.firstname}>
							<FormLabel fontSize="sm" fontWeight="600" color={textPrimary} mb={2}>First Name</FormLabel>
							<Input name="firstname" value={formData.firstname} onChange={handleInputChange} isReadOnly={!isEditing} placeholder="First name" bg={isEditing ? 'whiteAlpha.50' : 'transparent'} border="1px solid" borderColor={isEditing ? 'cyan.400' : 'whiteAlpha.200'} _hover={{ borderColor: isEditing ? 'cyan.300' : 'whiteAlpha.200' }} _focus={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.5)' }} color={textPrimary} _placeholder={{ color: textSecondary }} transition="all 0.2s" />
						{errors.firstname && (<Text color="red.400" fontSize="xs" mt={1}>{errors.firstname}</Text>)}
						</FormControl>

						{/* Last Name */}
						<FormControl isInvalid={!!errors.lastname}>
							<FormLabel fontSize="sm" fontWeight="600" color={textPrimary} mb={2}>Last Name</FormLabel>
							<Input name="lastname" value={formData.lastname} onChange={handleInputChange} isReadOnly={!isEditing} placeholder="Last name" bg={isEditing ? 'whiteAlpha.50' : 'transparent'} border="1px solid" borderColor={isEditing ? 'cyan.400' : 'whiteAlpha.200'} _hover={{ borderColor: isEditing ? 'cyan.300' : 'whiteAlpha.200' }} _focus={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.5)' }} color={textPrimary} _placeholder={{ color: textSecondary }} transition="all 0.2s" />
						{errors.lastname && (<Text color="red.400" fontSize="xs" mt={1}>{errors.lastname}</Text>)}
						</FormControl>
					</>
				)}

									{/* Email */}
									<FormControl isInvalid={!!errors.email} gridColumn={{ base: '1', md: '1 / -1' }}>
										<FormLabel fontSize="sm" fontWeight="600" color={textPrimary} mb={2}>
											Email Address
										</FormLabel>
										<Input
											name="email"
											type="email"
											value={formData.email}
											onChange={handleInputChange}
											isReadOnly={!isEditing}
											placeholder="Email address"
											bg={isEditing ? 'whiteAlpha.50' : 'transparent'}
											border="1px solid"
											borderColor={isEditing ? 'cyan.400' : 'whiteAlpha.200'}
											_hover={{ borderColor: isEditing ? 'cyan.300' : 'whiteAlpha.200' }}
											_focus={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.5)' }}
											color={textPrimary}
											_placeholder={{ color: textSecondary }}
											transition="all 0.2s"
										/>
										{errors.email && (
											<Text color="red.400" fontSize="xs" mt={1}>
												{errors.email}
											</Text>
										)}
									</FormControl>

									{/* Phone */}
									<FormControl isInvalid={!!errors.phone} gridColumn={{ base: '1', md: '1 / -1' }}>
										<FormLabel fontSize="sm" fontWeight="600" color={textPrimary} mb={2}>
											Phone Number
										</FormLabel>
										<Input
											name="phone"
											type="tel"
											value={formData.phone}
											onChange={handleInputChange}
											isReadOnly={!isEditing}
											placeholder="Phone number"
											bg={isEditing ? 'whiteAlpha.50' : 'transparent'}
											border="1px solid"
											borderColor={isEditing ? 'cyan.400' : 'whiteAlpha.200'}
											_hover={{ borderColor: isEditing ? 'cyan.300' : 'whiteAlpha.200' }}
											_focus={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.5)' }}
											color={textPrimary}
											_placeholder={{ color: textSecondary }}
											transition="all 0.2s"
										/>
										{errors.phone && (
											<Text color="red.400" fontSize="xs" mt={1}>
												{errors.phone}
											</Text>
										)}
									</FormControl>

									{/* Date of Birth */}
									<FormControl gridColumn={{ base: '1', md: '1 / -1' }}>
										<FormLabel fontSize="sm" fontWeight="600" color={textPrimary} mb={2}>
											Date of Birth
										</FormLabel>
										<Input
											name="dob"
											type="date"
											value={formData.dob ? formData.dob.slice(0, 10) : ''}
											onChange={handleInputChange}
											isReadOnly={!isEditing}
											bg={isEditing ? 'whiteAlpha.50' : 'transparent'}
											border="1px solid"
											borderColor={isEditing ? 'cyan.400' : 'whiteAlpha.200'}
											_hover={{ borderColor: isEditing ? 'cyan.300' : 'whiteAlpha.200' }}
											_focus={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.5)' }}
											color={textPrimary}
											transition="all 0.2s"
										/>
									</FormControl>


									{/* Address */}
									<FormControl isInvalid={!!errors.address} gridColumn={{ base: '1', md: '1 / -1' }}>
										<HStack justify="space-between" align="center" mb={2}>
											<FormLabel fontSize="sm" fontWeight="600" color={textPrimary} m={0}>
												Address
											</FormLabel>
											{isEditing && (
												<Button
													leftIcon={<FaMapMarkerAlt />}
													size="xs"
													colorScheme="cyan"
													variant="ghost"
													onClick={detectLocation}
													isLoading={isDetectingLocation}
													spinner={<FaSpinner />}
													_hover={{ bg: 'whiteAlpha.100' }}
												>
													Detect GPS Location
												</Button>
											)}
										</HStack>
										<Textarea
											name="address"
											value={formData.address}
											onChange={handleInputChange}
											isReadOnly={!isEditing}
											placeholder="Enter your full address (street, city, state, zip code)"
											bg={isEditing ? 'whiteAlpha.50' : 'transparent'}
											border="1px solid"
											borderColor={isEditing ? 'cyan.400' : 'whiteAlpha.200'}
											_hover={{ borderColor: isEditing ? 'cyan.300' : 'whiteAlpha.200' }}
											_focus={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.5)' }}
											color={textPrimary}
											_placeholder={{ color: textSecondary }}
											transition="all 0.2s"
											minH="80px"
											resize="vertical"
										/>
										{errors.address && (
											<Text color="red.400" fontSize="xs" mt={1}>
												{errors.address}
											</Text>
										)}
										<Text fontSize="xs" color={textSecondary} mt={1}>
											💡 Click "Detect GPS Location" to auto-fill from your current location, or type manually
										</Text>
									</FormControl>
								</Grid>
							</VStack>

							{/* Info Section */}
							<Divider borderColor={borderColor} my={2} />
							<VStack align="flex-start" spacing={3} pt={2}>
								<Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase">
									Account Information
								</Text>
								<Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
									<Box>
										<Text fontSize="xs" color={textSecondary} mb={1}>
											Account Type
										</Text>
										<Text fontSize="sm" fontWeight="600" color={textPrimary}>
											{getRoleLabel()}
										</Text>
									</Box>

									<Box>
										<Text fontSize="xs" color={textSecondary} mb={1}>
											Member Since
										</Text>
										<Text fontSize="sm" fontWeight="600" color={textPrimary}>
											{new Date(user.created_at || Date.now()).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'short',
												day: 'numeric',
											})}
										</Text>
									</Box>

									<Box>
										<Text fontSize="xs" color={textSecondary} mb={1}>
											Age
										</Text>
										<Text fontSize="sm" fontWeight="600" color={textPrimary}>
											{`${user.date_of_birth ? calculateAge(formatDateOnly(user.date_of_birth)) : '—'} years`}
										</Text>
									</Box>


									<Box>
										<Text fontSize="xs" color={textSecondary} mb={1}>
											Date of Birth
										</Text>
										<Text fontSize="sm" fontWeight="600" color={textPrimary}>
											{user.date_of_birth
												? new Date(user.date_of_birth).toLocaleDateString('en-US', {
													year: 'numeric',
													month: 'short',
													day: 'numeric',
												})
												: '—'}
										</Text>
									</Box>

									<Box gridColumn="1 / -1">
										<Text fontSize="xs" color={textSecondary} mb={1}>
											User ID
										</Text>
										<Text fontSize="sm" fontWeight="600" color={textPrimary} fontFamily="mono">
											{user.id}
										</Text>
									</Box>
								</Grid>

							</VStack>

							{/* Cancel Button (when editing) */}
							{isEditing && (
								<Button
									variant="outline"
									color="gray.400"
									_hover={{ bg: 'whiteAlpha.100', color: 'gray.300' }}
									w="100%"
									onClick={() => {
										setIsEditing(false);
						initialFormDataRef.current = { ...formData };
										setFormData(initialFormDataRef.current || {
											firstname: user.firstname || '',
											lastname: user.lastname || '',
											email: user.email || '',
											phone: user.phone || '',
											address: user.address || '',
										});
										setErrors({});
									}}
								>
									Cancel
								</Button>
							)}
						</VStack>
					</Box>

					{/* Additional Info Card */}
					<Box
						mt={8}
						bg={bgCard}
						border="1px solid"
						borderColor={borderColor}
						borderRadius="xl"
						p={{ base: 6, md: 8 }}
						boxShadow="lg"
						backdropFilter="blur(10px)"
					>
						<Heading size="md" color={textPrimary} mb={4}>
							Need Help?
						</Heading>
						<VStack spacing={3} align="stretch">
							<Text color={textSecondary} fontSize="sm">
								If you need to change your password or have other account security concerns, please visit our security settings.
							</Text>
							<HStack spacing={3}>
								<Button
									colorScheme="cyan"
									variant="outline"
									size="sm"
									_hover={{ bg: 'cyan.900' }}
								>
									Security Settings
								</Button>
								<Button
									variant="ghost"
									size="sm"
									color="cyan.400"
									_hover={{ textDecoration: 'underline' }}
								>
									Contact Support
								</Button>
							</HStack>
						</VStack>
					</Box>
				</Container>
			</Box>

			<Footer />
		</Box>
	);
}
