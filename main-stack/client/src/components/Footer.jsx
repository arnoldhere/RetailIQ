import React from 'react'
import { Box, Container, Flex, Text, Link as ChakraLink, VStack, HStack, Divider, Icon } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

export default function Footer() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  return (
    <Box bg="gray.900" color="gray.100" mt={16} py={12}>
      <Container maxW="container.xl">
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" mb={8} gap={8}>
          {/* Brand */}
          <VStack align={{ base: 'center', md: 'flex-start' }} spacing={3}>
            <Text fontSize="lg" fontWeight="bold" bgGradient="linear(to-r, blue.400, purple.400)" bgClip="text">
              RetailIQ
            </Text>
            <Text fontSize="sm" color="gray.400" maxW="250px">
              Smart retail analytics & operations platform for local shops, supermarkets, and fashion stores.
            </Text>
          </VStack>

          {/* Links */}
          <HStack spacing={8} justify={{ base: 'center', md: 'flex-start' }} flexWrap="wrap">
            <VStack align="flex-start" spacing={2}>
              <Text fontSize="sm" fontWeight="600" color="gray.200">Product</Text>
              <ChakraLink fontSize="sm" color="gray.400" _hover={{ color: 'gray.200' }}>Dashboard</ChakraLink>
              <ChakraLink fontSize="sm" color="gray.400" _hover={{ color: 'gray.200' }}>Analytics</ChakraLink>
              <ChakraLink fontSize="sm" color="gray.400" _hover={{ color: 'gray.200' }}>Forecasting</ChakraLink>
            </VStack>

            <VStack align="flex-start" spacing={2}>
              <Text fontSize="sm" fontWeight="600" color="gray.200">Company</Text>
              <ChakraLink 
                fontSize="sm" 
                color="gray.400" 
                _hover={{ color: 'gray.200' }}
                onClick={() => navigate('/about-us')}
                cursor="pointer"
              >
                About
              </ChakraLink>
              <ChakraLink fontSize="sm" color="gray.400" _hover={{ color: 'gray.200' }}>Blog</ChakraLink>
              <ChakraLink 
                fontSize="sm" 
                color="gray.400" 
                _hover={{ color: 'gray.200' }}
                onClick={() => navigate('/contact-us')}
                cursor="pointer"
              >
                Contact
              </ChakraLink>
            </VStack>

            <VStack align="flex-start" spacing={2}>
              <Text fontSize="sm" fontWeight="600" color="gray.200">Legal</Text>
              <ChakraLink fontSize="sm" color="gray.400" _hover={{ color: 'gray.200' }}>Privacy</ChakraLink>
              <ChakraLink fontSize="sm" color="gray.400" _hover={{ color: 'gray.200' }}>Terms</ChakraLink>
            </VStack>
          </HStack>
        </Flex>

        <Divider borderColor="gray.700" my={8} />

        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" gap={4}>
          <Text fontSize="sm" color="gray.500">
            © {currentYear} RetailIQ. All rights reserved.
          </Text>
          <HStack spacing={4}>
            <ChakraLink fontSize="sm" color="gray.400" _hover={{ color: 'gray.200' }}>Twitter</ChakraLink>
            <ChakraLink fontSize="sm" color="gray.400" _hover={{ color: 'gray.200' }}>LinkedIn</ChakraLink>
            <ChakraLink fontSize="sm" color="gray.400" _hover={{ color: 'gray.200' }}>GitHub</ChakraLink>
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}
