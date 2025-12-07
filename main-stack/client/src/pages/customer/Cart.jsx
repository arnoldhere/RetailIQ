import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Image as ChakraImage,
  Divider,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  SimpleGrid,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react'
import { DeleteIcon, ArrowBackIcon } from '@chakra-ui/icons'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCart } from '../../context/CartContext'

export default function CartPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart()
  const bgCard = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textMuted = useColorModeValue('gray.600', 'gray.400')

  const handleRemove = (productId) => {
    removeFromCart(productId)
    toast({ title: 'Item removed from cart', status: 'info', duration: 2000 })
  }

  const handleClear = () => {
    if (window.confirm('Clear entire cart?')) {
      clearCart()
      toast({ title: 'Cart cleared', status: 'info', duration: 2000 })
    }
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: 'Cart is empty', status: 'warning', duration: 2000 })
      return
    }
    toast({ title: 'Proceeding to checkout...', status: 'info', duration: 2000 })
    // TODO: Implement checkout flow
  }

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg={useColorModeValue('gray.50', 'gray.900')} w='100vw'>
      <Navbar />

      <Box flex={1} py={{ base: 6, md: 12 }}>
        <Box maxW="6xl" mx="auto" px={{ base: 4, md: 8 }}>
          {/* Header */}
          <HStack justify="space-between" mb={8} wrap="wrap" gap={4}>
            <VStack align="start">
              <Heading size="lg">Shopping Cart</Heading>
              <Text color={textMuted}>{cart.length} item(s) in cart</Text>
            </VStack>
            <Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={() => navigate('/customer/products')}>
              Continue Shopping
            </Button>
          </HStack>

          {cart.length === 0 ? (
            <Box bg={bgCard} p={12} borderRadius="xl" textAlign="center">
              <Heading size="md" color="gray.600" mb={3}>Your cart is empty</Heading>
              <Text color={textMuted} mb={6}>Add items to get started</Text>
              <Button colorScheme="blue" onClick={() => navigate('/customer/products')}>
                Start Shopping
              </Button>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
              {/* Cart Items */}
              <Box gridColumn={{ base: '1 / -1', lg: '1 / 3 ' }}>
                <Box bg={bgCard} p={6} borderRadius="xl" boxShadow="md">
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr borderBottomColor={borderColor}>
                          <Th>Product</Th>
                          <Th isNumeric>Price</Th>
                          <Th isNumeric>Qty</Th>
                          <Th isNumeric>Subtotal</Th>
                          <Th>Action</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {cart.map((item) => (
                          <Tr key={item.id} borderBottomColor={borderColor}>
                            <Td>
                              <HStack spacing={3}>
                                {/* {console.log(`${BACKEND_URL}/${item.image}`)} */}
                                {/* {console.log(item.image)} */}
                                {/* <ChakraImage
                                  src={`${BACKEND_URL}/${item.image}`}
                                  alt={item.name}
                                  boxSize="50px"
                                  borderRadius="md"
                                  objectFit="cover"
                                /> */}
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="600" fontSize="sm">{item.name}</Text>
                                  <Text color={textMuted} fontSize="xs">{item.category_name}</Text>
                                </VStack>
                              </HStack>
                            </Td>
                            <Td isNumeric fontWeight="600">${item.sell_price}</Td>
                            <Td isNumeric>
                              <NumberInput
                                value={item.quantity}
                                onChange={(val) => updateQuantity(item.id, parseInt(val) || 1)}
                                min={1}
                                max={item.stock_available}
                                w="70px"
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </Td>
                            <Td isNumeric fontWeight="700" color="green.600">
                              ${(item.sell_price * item.quantity)}
                            </Td>
                            <Td>
                              <IconButton
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleRemove(item.id)}
                              />
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>

                  <Divider my={4} />

                  <HStack justify="space-between" mt={6}>
                    <Button variant="outline" colorScheme="red" onClick={handleClear}>
                      Clear Cart
                    </Button>
                    <Button colorScheme="blue" onClick={() => navigate('/customer/products')}>
                      Add More Items
                    </Button>
                  </HStack>
                </Box>
              </Box>

              {/* Order Summary */}
              <Box bg={bgCard} p={6} borderRadius="xl" boxShadow="md" h="fit-content">
                <Heading size="sm" mb={6}>Order Summary</Heading>

                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text color={textMuted}>Subtotal ({cart.length} items)</Text>
                    <Text fontWeight="600">${getCartTotal().toFixed(2)}</Text>
                  </HStack>

                  <HStack justify="space-between">
                    <Text color={textMuted}>Shipping</Text>
                    <Text fontWeight="600">Free</Text>
                  </HStack>

                  <HStack justify="space-between">
                    <Text color={textMuted}>Tax</Text>
                    <Text fontWeight="600">${(getCartTotal() * 0.1).toFixed(2)}</Text>
                  </HStack>

                  <Divider />

                  <HStack justify="space-between">
                    <Heading size="md">Total</Heading>
                    <Heading size="md" color="green.600">
                      ${(getCartTotal() * 1.1).toFixed(2)}
                    </Heading>
                  </HStack>

                  <Button
                    colorScheme="green"
                    size="lg"
                    w="100%"
                    fontWeight="700"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>

                  <Button variant="outline" w="100%" onClick={() => navigate('/customer/products')}>
                    Continue Shopping
                  </Button>
                </VStack>
              </Box>
            </SimpleGrid>
          )}
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}
