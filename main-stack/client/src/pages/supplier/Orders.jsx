import React, { useEffect, useState } from 'react'
import { Box, Heading, VStack, Table, Thead, Tbody, Tr, Th, Td, Spinner, Text, Badge, Button, Flex, useToast } from '@chakra-ui/react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import * as bidsApi from '../../api/bids'
import { useNavigate } from 'react-router-dom'

export default function SupplierOrdersPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await bidsApi.getSupplierOrders(12, 0)
      setOrders(res.data.orders || [])
    } catch (err) {
      console.error('Failed to fetch supplier orders', err)
      toast({ title: 'Failed to load orders', status: 'error' })
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = { pending: 'yellow', sent: 'blue', received: 'green', cancelled: 'red' }
    return colors[status] || 'gray'
  }

  return (
    <Box minH="100vh" bg="#020617" display="flex" flexDirection="column" w='100vw'>
      <Navbar />
      <Box px={{ base: 4, md: 8 }} py={8} maxW="7xl" mx="auto">
        <VStack align="stretch" spacing={6}>
          <Heading color="white">My Supply Orders</Heading>

          {loading ? (
            <Flex justify="center" py={10}><Spinner /></Flex>
          ) : orders.length === 0 ? (
            <Box bg="whiteAlpha.50" p={6} borderRadius="lg"> <Text color="gray.300">No supply orders found.</Text> </Box>
          ) : (
            <Box bg="whiteAlpha.50" p={4} borderRadius="lg">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Order No</Th>
                    <Th>Store</Th>
                    <Th isNumeric>Amount</Th>
                    <Th>Status</Th>
                    <Th>Delivery</Th>
                    <Th>Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orders.map(o => (
                    <Tr key={o.id} _hover={{ bg: 'whiteAlpha.100', cursor: 'pointer' }} onClick={() => navigate(`/supplier/orders/${o.id}`)}>
                      <Td fontWeight="600">{o.order_no}</Td>
                      <Td>{o.store_name || '-'}</Td>
                      <Td isNumeric fontWeight="700">${Number(o.total_amount || 0).toFixed(2)}</Td>
                      <Td><Badge colorScheme={getStatusColor(o.status)}>{o.status}</Badge></Td>
                      <Td>{o.deliver_at ? new Date(o.deliver_at).toLocaleDateString() : '-'}</Td>
                      <Td>{new Date(o.created_at).toLocaleString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </VStack>
      </Box>
      <Footer />
    </Box>
  )
}