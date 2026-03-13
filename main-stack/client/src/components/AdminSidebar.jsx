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
  Badge,
} from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'
import { FiGrid, FiUsers, FiTag, FiBox, FiMessageSquare, FiShoppingCart, FiTruck, FiChevronRight } from 'react-icons/fi'
import { FaStore } from "react-icons/fa";

const items = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: FiGrid, badge: null },
  { to: '/admin/users', label: 'Users', icon: FiUsers, badge: null },
  { to: '/admin/categories', label: 'Categories', icon: FiTag, badge: null },
  { to: '/admin/products', label: 'Products', icon: FiBox, badge: null },
  { to: '/admin/stores', label: 'Stores', icon: FaStore, badge: null },
  { to: '/admin/store-managers', label: 'Store Managers', icon: FiUsers, badge: null },
  { to: '/admin/feedbacks', label: 'Feedbacks', icon: FiMessageSquare, badge: null },
  { to: '/admin/customer-orders', label: 'Orders', icon: FiShoppingCart, badge: null },
  { to: '/admin/suppliers', label: 'Suppliers', icon: FiTruck, badge: null },
  { to: '/admin/asks', label: 'Ask Suppliers', icon: FiTruck, badge: null },
  { to: '/admin/supplier-orders', label: 'Supplier Orders', icon: FiTruck, badge: null },
]

export default function AdminSidebar({ onItemClick }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const loc = useLocation()

  const SidebarContent = (
    <Box
      as="nav"
      aria-label="Admin sidebar"
      w={{ base: 'full', md: 64 }}
      p={4}
      bg="var(--surface)"
      h="100%"
      borderRight="1px solid var(--border-light)"
    >
      <VStack align="stretch" spacing={2}>
        {/* Sidebar Header */}
        <Box pb={4} mb={2} borderBottom="2px solid var(--border-light)">
          <HStack spacing={2}>
            <Box w={2} h={2} bg="var(--primary-color)" borderRadius="full" />
            <Text fontSize="xs" fontWeight="700" color="var(--text-tertiary)" textTransform="uppercase">
              Admin Panel
            </Text>
          </HStack>
        </Box>

        {items.map((it) => {
          const active = loc.pathname === it.to
          return (
            <ChakraLink
              as={Link}
              to={it.to}
              key={it.to}
              px={3}
              py={2.5}
              borderRadius="md"
              bg={active ? "var(--primary-lighter)" : "transparent"}
              borderLeft={active ? "3px solid var(--primary-color)" : "3px solid transparent"}
              transition="all var(--transition-normal)"
              _hover={{
                textDecoration: 'none',
                bg: active ? "var(--primary-lighter)" : "var(--surface-secondary)",
                borderLeftColor: "var(--primary-color)",
              }}
              onClick={() => {
                if (onItemClick) onItemClick()
              }}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              group
            >
              <HStack spacing={3} align="center" flex={1}>
                <Icon
                  as={it.icon}
                  boxSize={5}
                  color={active ? 'var(--primary-color)' : 'var(--text-secondary)'}
                  transition="color var(--transition-normal)"
                  _groupHover={{ color: 'var(--primary-color)' }}
                />
                <Text
                  fontWeight={active ? 600 : 500}
                  color={active ? 'var(--primary-color)' : 'var(--text-secondary)'}
                  transition="color var(--transition-normal)"
                  _groupHover={{ color: 'var(--primary-color)' }}
                  fontSize="sm"
                >
                  {it.label}
                </Text>
              </HStack>
              {active && <Icon as={FiChevronRight} boxSize={4} color="var(--primary-color)" />}
            </ChakraLink>
          )
        })}
      </VStack>
    </Box>
  )

  return (
    <>
      {/* Mobile: open drawer */}
      <Button
        display={{ base: 'inline-flex', md: 'none' }}
        onClick={onOpen}
        size="sm"
        mb={4}
        bg="var(--primary-color)"
        color="white"
        fontWeight="500"
        _hover={{ bg: "var(--primary-dark)" }}
      >
        ☰ Menu
      </Button>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent bg="var(--surface)">
          <DrawerCloseButton color="var(--primary-color)" mt={2} _focus={{ outline: "none" }} />
          <DrawerBody pt={8} p={0}>{SidebarContent}</DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Desktop sidebar container */}
      <Box
        display={{ base: 'none', md: 'block' }}
        h="calc(100vh - 80px)"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'var(--background)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'var(--text-tertiary)',
          },
        }}
      >
        {SidebarContent}
      </Box>
    </>
  )
}
