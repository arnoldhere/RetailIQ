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
import { FiGrid, FiList, FiShoppingCart, FiUser } from 'react-icons/fi'

const items = [
  { to: '/supplier/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/supplier/orders', label: 'Orders', icon: FiList },
  { to: '/supplier/bids', label: 'Bids', icon: FiShoppingCart },
  { to: '/supplier/profile', label: 'Profile', icon: FiUser },
]

export default function SupplierSidebar({ onItemClick }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const loc = useLocation()

  const SidebarContent = (
    <Box as="nav" aria-label="Supplier sidebar" w={{ base: 'full', md: 56 }} p={4}>
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

      <Box display={{ base: 'none', md: 'block' }}>{SidebarContent}</Box>
    </>
  )
}
