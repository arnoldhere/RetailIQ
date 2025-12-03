import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Icon,
  Text,
  Link as ChakraLink,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useDisclosure,
  Button,
} from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'
import { FiGrid, FiUsers, FiTag, FiBox, FiMessageSquare, FiShoppingCart, FiTruck } from 'react-icons/fi'

const items = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/categories', label: 'Product Categories', icon: FiTag },
  { to: '/admin/products', label: 'Products', icon: FiBox },
  { to: '/admin/feedbacks', label: 'Feedbacks', icon: FiMessageSquare },
  { to: '/admin/customer-orders', label: 'Customer Orders', icon: FiShoppingCart },
  { to: '/admin/suppliers', label: 'Suppliers', icon: FiTruck },
  { to: '/admin/supplier-orders', label: 'Supplier Orders', icon: FiTruck },
]

export default function AdminSidebar({ onItemClick }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const loc = useLocation()

  const SidebarContent = (
    <Box as="nav" aria-label="Admin sidebar" w={{ base: 'full', md: 64 }} p={4}>
      <VStack align="stretch" spacing={3}>
        {items.map((it) => {
          const active = loc.pathname === it.to
          return (
            <ChakraLink
              as={Link}
              to={it.to}
              key={it.to}
              px={3}
              py={2}
              borderRadius="md"
              bg={active ? 'blue.50' : 'transparent'}
              _hover={{ textDecoration: 'none', bg: 'blue.50' }}
              onClick={() => {
                if (onItemClick) onItemClick()
              }}
            >
              <HStack spacing={3} align="center">
                <Icon as={it.icon} boxSize={5} color={active ? 'blue.600' : 'gray.600'} />
                <Text fontWeight={active ? 700 : 500} color={active ? 'blue.600' : 'gray.700'}>
                  {it.label}
                </Text>
              </HStack>
            </ChakraLink>
          )
        })}
      </VStack>
    </Box>
  )

  return (
    <>
      {/* Mobile: open drawer */}
      <Button display={{ base: 'inline-flex', md: 'none' }} onClick={onOpen} size="sm" mb={4}>
        Menu
      </Button>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody>{SidebarContent}</DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Desktop sidebar container */}
      <Box display={{ base: 'none', md: 'block' }}>{SidebarContent}</Box>
    </>
  )
}
