import React, { useEffect, useState } from 'react'
import { Box, Heading, Text, VStack, Table, Thead, Tbody, Tr, Th, Td, Spinner, Badge, useToast } from '@chakra-ui/react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import * as bidsApi from '../../api/bids'
import { useParams } from 'react-router-dom'

export default function SupplierOrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await bidsApi.getSupplierOrder(id)
        setOrder(res.data.order)
        setItems(res.data.items || [])
        setPayments(res.data.payments || [])
      } catch (err) {
        console.error('Failed to load order', err)
        toast({ title: 'Failed to load order', status: 'error' })
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id, toast])

  const getStatusColor = (status) => ({ pending: 'yellow', sent: 'blue', received: 'green', cancelled: 'red' }[status] || 'gray')

  if (loading) return (<Box minH="80vh" display="flex" alignItems="center" justifyContent="center"><Spinner /></Box>)

  if (!order) return (<Box minH="80vh"><Text>No order found</Text></Box>)

  return (
    <Box minH="100vh" bg="#020617" display="flex" flexDirection="column">
      <Navbar />
      <Box px={{ base: 4, md: 8 }} py={8} maxW="7xl" mx="auto">
        <VStack align="stretch" spacing={6}>
          <Heading color="white">Order {order.order_no}</Heading>
          <Box bg="whiteAlpha.50" p={4} borderRadius="md">
            <Text><strong>Store:</strong> {order.store_name || '-'}</Text>
            <Text><strong>Status:</strong> <Badge colorScheme={getStatusColor(order.status)}>{order.status}</Badge></Text>
            <Text><strong>Total:</strong> ${Number(order.total_amount||0).toFixed(2)}</Text>
          </Box>

          <Box bg="whiteAlpha.50" p={4} borderRadius="md">
            <Heading size="sm" mb={3}>Items</Heading>
            <Table size="sm">
              <Thead><Tr><Th>Product</Th><Th isNumeric>Qty</Th><Th isNumeric>Unit Cost</Th><Th isNumeric>Total</Th></Tr></Thead>
              <Tbody>
                {items.map(it => (
                  <Tr key={it.id}><Td>{it.product_name}</Td><Td isNumeric>{it.qty}</Td><Td isNumeric>${Number(it.cost).toFixed(2)}</Td><Td isNumeric>${Number(it.total_amount).toFixed(2)}</Td></Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          <Box bg="whiteAlpha.50" p={4} borderRadius="md">
            <Heading size="sm" mb={3}>Payments</Heading>
            {payments.length === 0 ? <Text>No payments recorded</Text> : (
              <Table size="sm">
                <Thead><Tr><Th>Date</Th><Th isNumeric>Amount</Th><Th>Method</Th><Th>Ref</Th></Tr></Thead>
                <Tbody>
                  {payments.map(p => (
                    <Tr key={p.id}><Td>{p.payment_date || new Date(p.created_at).toLocaleDateString()}</Td><Td isNumeric>${Number(p.amount).toFixed(2)}</Td><Td>{p.method}</Td><Td>{p.payment_ref||'-'}</Td></Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>
        </VStack>
      </Box>
      <Footer />
    </Box>
  )
}