import React from 'react'
import { Box, Container, Flex, Text, Link as ChakraLink, VStack, HStack, Divider, Icon } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { FiFacebook, FiTwitter, FiLinkedin, FiGithub, FiMail, FiPhone } from 'react-icons/fi'

export default function Footer() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  const footerLinkStyle = {
    fontSize: "sm",
    color: "var(--text-secondary)",
    transition: "all var(--transition-normal)",
    _hover: {
      color: "var(--primary-color)",
      textDecoration: "none",
      transform: "translateX(4px)",
    },
  }

  return (
    <Box bg="var(--surface)" borderTop="1px solid var(--border-light)" mt={16} py={12}>
      <Container maxW="container.xl">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          mb={8}
          gap={8}
        >
          {/* Brand Section */}
          <VStack align={{ base: 'center', md: 'flex-start' }} spacing={3} maxW="250px">
            <Text
              fontSize="lg"
              fontWeight="700"
              color="var(--primary-color)"
            >
              RetailIQ
            </Text>
            <Text fontSize="sm" color="var(--text-secondary)">
              Smart retail analytics & operations platform for local shops, supermarkets, and fashion stores.
            </Text>
            <HStack spacing={3} mt={2}>
              <Icon
                as={FiMail}
                boxSize={4}
                color="var(--text-tertiary)"
                cursor="pointer"
                transition="all var(--transition-normal)"
                _hover={{ color: "var(--primary-color)" }}
              />
              <Icon
                as={FiPhone}
                boxSize={4}
                color="var(--text-tertiary)"
                cursor="pointer"
                transition="all var(--transition-normal)"
                _hover={{ color: "var(--primary-color)" }}
              />
            </HStack>
          </VStack>

          {/* Links Section */}
          <HStack
            spacing={12}
            justify={{ base: 'center', md: 'flex-start' }}
            flexWrap="wrap"
          >
            <VStack align="flex-start" spacing={3}>
              <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">Product</Text>
              <ChakraLink {...footerLinkStyle}>Dashboard</ChakraLink>
              <ChakraLink {...footerLinkStyle}>Analytics</ChakraLink>
              <ChakraLink {...footerLinkStyle}>Forecasting</ChakraLink>
              <ChakraLink {...footerLinkStyle}>Integration</ChakraLink>
            </VStack>

            <VStack align="flex-start" spacing={3}>
              <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">Company</Text>
              <ChakraLink
                {...footerLinkStyle}
                onClick={() => navigate('/about-us')}
                cursor="pointer"
              >
                About Us
              </ChakraLink>
              <ChakraLink {...footerLinkStyle}>Blog</ChakraLink>
              <ChakraLink
                {...footerLinkStyle}
                onClick={() => navigate('/contact-us')}
                cursor="pointer"
              >
                Contact Us
              </ChakraLink>
              <ChakraLink {...footerLinkStyle}>Careers</ChakraLink>
            </VStack>

            <VStack align="flex-start" spacing={3}>
              <Text fontSize="sm" fontWeight="600" color="var(--text-primary)">Legal</Text>
              <ChakraLink {...footerLinkStyle}>Privacy Policy</ChakraLink>
              <ChakraLink {...footerLinkStyle}>Terms of Service</ChakraLink>
              <ChakraLink {...footerLinkStyle}>Cookie Policy</ChakraLink>
              <ChakraLink {...footerLinkStyle}>Security</ChakraLink>
            </VStack>
          </HStack>
        </Flex>

        <Divider borderColor="var(--border-light)" my={8} />

        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align="center"
          gap={4}
        >
          <Text fontSize="sm" color="var(--text-tertiary)">
            © {currentYear} RetailIQ. All rights reserved. | Made with ❤️ for retail
          </Text>
          <HStack spacing={4}>
            <Icon
              as={FiTwitter}
              boxSize={4}
              color="var(--text-tertiary)"
              cursor="pointer"
              transition="all var(--transition-normal)"
              _hover={{ color: "var(--primary-color)", transform: "translateY(-2px)" }}
            />
            <Icon
              as={FiLinkedin}
              boxSize={4}
              color="var(--text-tertiary)"
              cursor="pointer"
              transition="all var(--transition-normal)"
              _hover={{ color: "var(--primary-color)", transform: "translateY(-2px)" }}
            />
            <Icon
              as={FiGithub}
              boxSize={4}
              color="var(--text-tertiary)"
              cursor="pointer"
              transition="all var(--transition-normal)"
              _hover={{ color: "var(--primary-color)", transform: "translateY(-2px)" }}
            />
            <Icon
              as={FiFacebook}
              boxSize={4}
              color="var(--text-tertiary)"
              cursor="pointer"
              transition="all var(--transition-normal)"
              _hover={{ color: "var(--primary-color)", transform: "translateY(-2px)" }}
            />
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}
