import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    SimpleGrid,
    Card,
    CardBody,
    CardHeader,
    Button,
    Select,
    FormControl,
    FormLabel,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Badge,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useToast,
    Icon,
    Checkbox,
    CheckboxGroup,
    Stack,
} from '@chakra-ui/react';
import { FiTrendingUp, FiPackage, FiCalendar, FiBarChart } from 'react-icons/fi';
import { getDemandForecast, getBulkDemandForecast } from '../../api/ml_services';
import { listProducts } from '../../api/products';

function DemandForecasting() {
    const [loading, setLoading] = useState(false);
    const [forecastData, setForecastData] = useState(null);
    const [error, setError] = useState(null);
    const [productId, setProductId] = useState('');
    const [daysAhead, setDaysAhead] = useState(7);
    const [historicalDays, setHistoricalDays] = useState(30);
    const [products, setProducts] = useState([]);
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [bulkResults, setBulkResults] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [productLoading, setProductLoading] = useState(false);
    const toast = useToast();

    const handleSingleForecast = async () => {
        if (!productId.trim()) {
            toast({
                title: 'Error',
                description: 'Please select a product from the dropdown',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setLoading(true);
        setError(null);
        setForecastData(null);

        try {
            const result = await getDemandForecast(
                parseInt(productId.trim()),
                daysAhead,
                historicalDays
            );
            setForecastData(result);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to get demand forecast');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        async function loadProducts() {
            setProductLoading(true);
            try {
                const res = await listProducts(100, 0);
                setProducts(res.data.products || []);
            } catch (err) {
                console.error('Failed to load forecast products:', err);
                toast({
                    title: 'Error',
                    description: 'Unable to load products for forecasting. Please refresh.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setProductLoading(false);
            }
        }
        loadProducts();
    }, [toast]);

    const handleBulkForecast = async () => {
        const ids = selectedProductIds.map((id) => Number(id));

        if (ids.length === 0) {
            toast({
                title: 'Error',
                description: 'Please select at least one product for bulk forecasting',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (ids.length > 50) {
            toast({
                title: 'Error',
                description: 'Cannot forecast more than 50 products at once',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setBulkLoading(true);
        setBulkResults(null);

        try {
            const result = await getBulkDemandForecast(ids, daysAhead, historicalDays);
            setBulkResults(result);
        } catch (err) {
            toast({
                title: 'Error',
                description: err.response?.data?.message || 'Failed to get bulk demand forecasts',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setBulkLoading(false);
        }
    };

    const formatForecastValue = (value) => {
        return typeof value === 'number' ? value.toFixed(1) : value;
    };

    const getConfidenceColor = (score) => {
        if (score >= 0.8) return 'green';
        if (score >= 0.6) return 'yellow';
        return 'red';
    };

    return (
        <Box p={6} maxW="1200px" mx="auto">
            <VStack spacing={8} align="stretch">
                <Box>
                    <Heading size="lg" color="var(--text-primary)" mb={2}>
                        Demand Forecasting
                    </Heading>
                    <Text color="var(--text-secondary)" fontSize="lg">
                        Predict future product demand using advanced ML algorithms to optimize inventory and supply chain decisions.
                    </Text>
                </Box>

                {/* Single Product Forecast */}
                <Card>
                    <CardHeader>
                        <HStack>
                            <Icon as={FiPackage} color="var(--primary-color)" />
                            <Heading size="md" color="var(--text-primary)">
                                Single Product Forecast
                            </Heading>
                        </HStack>
                    </CardHeader>
                    <CardBody>
                        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
                            <FormControl>
                                <FormLabel>Product</FormLabel>
                                <Select
                                    placeholder={productLoading ? 'Loading products...' : 'Select a product'}
                                    value={productId}
                                    onChange={(e) => setProductId(e.target.value)}
                                >
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Days Ahead</FormLabel>
                                <Select value={daysAhead} onChange={(e) => setDaysAhead(parseInt(e.target.value))}>
                                    <option value={7}>7 days</option>
                                    <option value={14}>14 days</option>
                                    <option value={30}>30 days</option>
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Historical Data (Days)</FormLabel>
                                <Select value={historicalDays} onChange={(e) => setHistoricalDays(parseInt(e.target.value))}>
                                    <option value={30}>30 days</option>
                                    <option value={60}>60 days</option>
                                    <option value={90}>90 days</option>
                                    <option value={180}>180 days</option>
                                </Select>
                            </FormControl>
                            <Box pt={8}>
                                <Button
                                    colorScheme="blue"
                                    onClick={handleSingleForecast}
                                    isLoading={loading}
                                    loadingText="Forecasting..."
                                    width="full"
                                >
                                    Generate Forecast
                                </Button>
                            </Box>
                        </SimpleGrid>

                        {error && (
                            <Alert status="error" borderRadius="lg" mb={4}>
                                <AlertIcon />
                                <AlertTitle>Forecast Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {forecastData && (
                            <Box>
                                <HStack justify="space-between" align="center" mb={4}>
                                    <Heading size="md" color="var(--text-primary)">
                                        Forecast Results for {forecastData.data.product.name}
                                    </Heading>
                                    <HStack>
                                        <Badge colorScheme={getConfidenceColor(forecastData.data.forecast.confidence_score)}>
                                            Confidence: {(forecastData.data.forecast.confidence_score * 100).toFixed(0)}%
                                        </Badge>
                                        <Badge colorScheme="blue">
                                            Algorithm: {forecastData.data.forecast.algorithm_used.replace('_', ' ')}
                                        </Badge>
                                    </HStack>
                                </HStack>

                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                                    <Stat>
                                        <StatLabel>Historical Data Points</StatLabel>
                                        <StatNumber>{forecastData.data.historical_data_used}</StatNumber>
                                        <StatHelpText>Used for forecasting</StatHelpText>
                                    </Stat>
                                    <Stat>
                                        <StatLabel>Forecast Period</StatLabel>
                                        <StatNumber>{forecastData.data.requested_period.days_ahead} days</StatNumber>
                                        <StatHelpText>Next {forecastData.data.requested_period.days_ahead} days</StatHelpText>
                                    </Stat>
                                    <Stat>
                                        <StatLabel>Average Daily Demand</StatLabel>
                                        <StatNumber>
                                            {forecastData.data.forecast.forecast_next_7_days.length > 0
                                                ? (forecastData.data.forecast.forecast_next_7_days.reduce((a, b) => a + b, 0) / forecastData.data.forecast.forecast_next_7_days.length).toFixed(1)
                                                : '0.0'
                                            }
                                        </StatNumber>
                                        <StatHelpText>Forecasted average</StatHelpText>
                                    </Stat>
                                </SimpleGrid>

                                <Box bg="gray.50" p={4} borderRadius="lg">
                                    <HStack mb={3}>
                                        <Icon as={FiTrendingUp} color="var(--primary-color)" />
                                        <Text fontWeight="600" color="var(--text-primary)">
                                            7-Day Demand Forecast
                                        </Text>
                                    </HStack>
                                    <SimpleGrid columns={{ base: 1, md: 7 }} spacing={2}>
                                        {forecastData.data.forecast.forecast_next_7_days.map((demand, index) => (
                                            <Box key={index} textAlign="center" p={3} bg="white" borderRadius="md" boxShadow="sm">
                                                <Text fontSize="sm" color="var(--text-secondary)" mb={1}>
                                                    Day {index + 1}
                                                </Text>
                                                <Text fontSize="lg" fontWeight="bold" color="var(--text-primary)">
                                                    {formatForecastValue(demand)}
                                                </Text>
                                            </Box>
                                        ))}
                                    </SimpleGrid>
                                </Box>
                            </Box>
                        )}
                    </CardBody>
                </Card>

                {/* Bulk Forecast */}
                <Card>
                    <CardHeader>
                        <HStack>
                            <Icon as={FiBarChart} color="var(--primary-color)" />
                            <Heading size="md" color="var(--text-primary)">
                                Bulk Product Forecast
                            </Heading>
                        </HStack>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={4} align="stretch">
                            <FormControl>
                                <FormLabel>Select Products for Bulk Forecast</FormLabel>
                                <Box border="1px solid" borderColor="var(--border-light)" borderRadius="xl" maxH="320px" overflowY="auto" p={3} bg="white">
                                    <CheckboxGroup value={selectedProductIds} onChange={(values) => setSelectedProductIds(values)}>
                                        <Stack spacing={2}>
                                            {products.map((product) => (
                                                <Checkbox key={product.id} value={String(product.id)}>
                                                    {product.name}
                                                </Checkbox>
                                            ))}
                                        </Stack>
                                    </CheckboxGroup>
                                </Box>
                                <Text fontSize="sm" color="var(--text-secondary)" mt={1}>
                                    Select up to 50 products from the list. Use the dropdown above to choose a single product forecast.
                                </Text>
                            </FormControl>

                            <HStack spacing={4}>
                                <FormControl maxW="200px">
                                    <FormLabel>Days Ahead</FormLabel>
                                    <Select value={daysAhead} onChange={(e) => setDaysAhead(parseInt(e.target.value))}>
                                        <option value={7}>7 days</option>
                                        <option value={14}>14 days</option>
                                        <option value={30}>30 days</option>
                                    </Select>
                                </FormControl>
                                <FormControl maxW="200px">
                                    <FormLabel>Historical Data (Days)</FormLabel>
                                    <Select value={historicalDays} onChange={(e) => setHistoricalDays(parseInt(e.target.value))}>
                                        <option value={30}>30 days</option>
                                        <option value={60}>60 days</option>
                                        <option value={90}>90 days</option>
                                        <option value={180}>180 days</option>
                                    </Select>
                                </FormControl>
                                <Box pt={8}>
                                    <Button
                                        colorScheme="green"
                                        onClick={handleBulkForecast}
                                        isLoading={bulkLoading}
                                        loadingText="Forecasting..."
                                    >
                                        Generate Bulk Forecast
                                    </Button>
                                </Box>
                            </HStack>

                            {bulkResults && (
                                <Box mt={6}>
                                    <HStack justify="space-between" align="center" mb={4}>
                                        <Heading size="md" color="var(--text-primary)">
                                            Bulk Forecast Results ({selectedProductIds.length} selected)
                                        </Heading>
                                        <HStack>
                                            <Badge colorScheme="green">
                                                Successful: {bulkResults.data.summary.successful}
                                            </Badge>
                                            {bulkResults.data.summary.failed > 0 && (
                                                <Badge colorScheme="red">
                                                    Failed: {bulkResults.data.summary.failed}
                                                </Badge>
                                            )}
                                        </HStack>
                                    </HStack>

                                    {bulkResults.data.forecasts.length > 0 && (
                                        <Box overflowX="auto">
                                            <Table variant="simple">
                                                <Thead>
                                                    <Tr>
                                                        <Th>Product</Th>
                                                        <Th>Algorithm</Th>
                                                        <Th>Confidence</Th>
                                                        <Th>Historical Data</Th>
                                                        <Th>Day 1</Th>
                                                        <Th>Day 2</Th>
                                                        <Th>Day 3</Th>
                                                        <Th>Day 4</Th>
                                                        <Th>Day 5</Th>
                                                        <Th>Day 6</Th>
                                                        <Th>Day 7</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {bulkResults.data.forecasts.map((item, index) => (
                                                        <Tr key={index}>
                                                            <Td fontWeight="600">{item.product.name}</Td>
                                                            <Td>
                                                                <Badge colorScheme="blue">
                                                                    {item.forecast.algorithm_used.replace('_', ' ')}
                                                                </Badge>
                                                            </Td>
                                                            <Td>
                                                                <Badge colorScheme={getConfidenceColor(item.forecast.confidence_score)}>
                                                                    {(item.forecast.confidence_score * 100).toFixed(0)}%
                                                                </Badge>
                                                            </Td>
                                                            <Td>{item.forecast.historical_data_points} points</Td>
                                                            {item.forecast.forecast_next_7_days.slice(0, 7).map((demand, dayIndex) => (
                                                                <Td key={dayIndex} textAlign="center">
                                                                    {formatForecastValue(demand)}
                                                                </Td>
                                                            ))}
                                                        </Tr>
                                                    ))}
                                                </Tbody>
                                            </Table>
                                        </Box>
                                    )}

                                    {bulkResults.data.errors.length > 0 && (
                                        <Box mt={4}>
                                            <Heading size="sm" color="red.600" mb={2}>
                                                Errors ({bulkResults.data.errors.length})
                                            </Heading>
                                            <VStack align="stretch" spacing={2}>
                                                {bulkResults.data.errors.map((error, index) => (
                                                    <Alert key={index} status="error" size="sm">
                                                        <AlertIcon />
                                                        <Text fontSize="sm">
                                                            Product ID {error.product_id}: {error.error}
                                                        </Text>
                                                    </Alert>
                                                ))}
                                            </VStack>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </VStack>
                    </CardBody>
                </Card>

                {/* Information Card */}
                <Card bg="blue.50" borderColor="blue.200">
                    <CardBody>
                        <VStack align="start" spacing={3}>
                            <HStack>
                                <Icon as={FiCalendar} color="blue.600" />
                                <Heading size="sm" color="blue.800">
                                    How Demand Forecasting Works
                                </Heading>
                            </HStack>
                            <VStack align="start" spacing={2} fontSize="sm" color="blue.700">
                                <Text>
                                    <strong>Moving Average:</strong> Uses recent historical data to predict future demand.
                                    Best for products with stable demand patterns.
                                </Text>
                                <Text>
                                    <strong>Linear Regression:</strong> Analyzes trends in historical data to forecast future demand.
                                    Best for products showing clear upward or downward trends.
                                </Text>
                                <Text>
                                    <strong>Confidence Score:</strong> Indicates how reliable the forecast is based on data quality and quantity.
                                </Text>
                                <Text>
                                    <strong>Robust Error Handling:</strong> If the ML service is unavailable, the system provides safe fallback responses
                                    without interrupting other RetailIQ features.
                                </Text>
                            </VStack>
                        </VStack>
                    </CardBody>
                </Card>
            </VStack>
        </Box>
    );
}

export default DemandForecasting;