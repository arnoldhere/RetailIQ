import React, { useEffect, useState } from 'react'
import { Box, Container, Heading, VStack, FormControl, FormLabel, Input, Select, Button, Table, Thead, Tbody, Tr, Th, Td, useToast } from '@chakra-ui/react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import * as adminApi from '../../api/admin'
import * as bidApi from '../../api/bids'

export default function AskSuppliers() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ product_id: '', quantity: 0, min_price: '', expires_at: '', note: '' })
  const [asks, setAsks] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const p = await adminApi.getProducts(100, 0)
        setProducts(p?.data?.products || [])
      } catch (err) {
        console.error(err)
      }
    }
    load()
    fetchAsks()
  }, [])

  async function fetchAsks() {
    try {
      const res = await bidApi.getAdminAsks()
      setAsks(res?.data?.asks || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreate = async () => {
    try {
      if (!form.product_id || !form.quantity) return toast({ title: 'Product and quantity required', status: 'warning' })
      await bidApi.createAsk(form)
      toast({ title: 'Ask created', status: 'success' })
      setForm({ product_id: '', quantity: 0, min_price: '', expires_at: '', note: '' })
      fetchAsks()
    } catch (err) {
      console.error(err)
      toast({ title: 'Failed to create ask', status: 'error' })
    }
  }

  const handleClose = async (id) => {
    try {
      await bidApi.closeAsk(id)
      toast({ title: 'Ask closed', status: 'success' })
      fetchAsks()
    } catch (err) {
      console.error(err)
      toast({ title: 'Failed', status: 'error' })
    }
  }

  return (
    <Box minH="100vh" bg="#020617" display="flex" flexDirection="column">
      <Navbar />
      <Container maxW="container.lg" py={8}>
        <VStack align="stretch" spacing={6}>
          <Heading color="white">Ask Suppliers</Heading>

          <Box bg="whiteAlpha.50" p={4} borderRadius="md" border="1px" borderColor="whiteAlpha.200">
            <FormControl>
              <FormLabel>Product</FormLabel>
              <Select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </FormControl>
            <FormControl mt={3}>
              <FormLabel>Quantity</FormLabel>
              <Input type="number" value={form.quantity} onChange={(e)=>setForm({...form, quantity: parseInt(e.target.value||0)})} />
            </FormControl>
            <FormControl mt={3}>
              <FormLabel>Minimum Price (optional)</FormLabel>
              <Input value={form.min_price} onChange={(e)=>setForm({...form, min_price:e.target.value})} />
            </FormControl>
            <FormControl mt={3}>
              <FormLabel>Expires At (optional)</FormLabel>
              <Input type="datetime-local" value={form.expires_at} onChange={(e)=>setForm({...form, expires_at:e.target.value})} />
            </FormControl>
            <FormControl mt={3}>
              <FormLabel>Note</FormLabel>
              <Input value={form.note} onChange={(e)=>setForm({...form, note:e.target.value})} />
            </FormControl>
            <Button mt={4} colorScheme="cyan" onClick={handleCreate}>Create Ask</Button>
          </Box>

          <Box bg="whiteAlpha.50" p={4} borderRadius="md" border="1px" borderColor="whiteAlpha.200">
            <Heading size="sm" color="white">Recent Asks</Heading>
            <Table variant="simple" colorScheme="whiteAlpha" mt={3}>
              <Thead>
                <Tr><Th>Product</Th><Th>Qty</Th><Th>Min Price</Th><Th>Status</Th><Th>Actions</Th></Tr>
              </Thead>
              <Tbody>
                {asks.map(a => (
                  <Tr key={a.id}>
                    <Td>{a.product_name}</Td>
                    <Td>{a.quantity}</Td>
                    <Td>{a.min_price || '—'}</Td>
                    <Td>{a.status}</Td>
                    <Td>
                      {a.status === 'open' && <Button size="sm" onClick={()=>handleClose(a.id)}>Close</Button>}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Container>
      <Footer />
    </Box>
  )
}