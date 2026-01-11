import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Badge,
  Text,
  Divider,
  Stack,
} from '@chakra-ui/react'

import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import * as adminApi from '../../api/admin'
import * as bidApi from '../../api/bids'

export default function AskSuppliers() {
  const toast = useToast()

  const [products, setProducts] = useState([])
  const [stores, setStores] = useState([])
  const [asks, setAsks] = useState([])
  const [bids, setBids] = useState([])

  const [bidsModalOpen, setBidsModalOpen] = useState(false)
  const [currentAskId, setCurrentAskId] = useState(null)

  const [selectedStore, setSelectedStore] = useState(null)
  const [deliverAt, setDeliverAt] = useState('')

  const [form, setForm] = useState({
    product_id: '',
    quantity: 0,
    min_price: '',
    expires_at: '',
    note: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const p = await adminApi.getProducts(100, 0)
        setProducts(p?.data?.products || [])

        const s = await adminApi.getStores(100, 0)
        setStores(s?.data?.stores || [])
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

  async function openBids(askId) {
    setCurrentAskId(askId)
    setBidsModalOpen(true)
    try {
      const res = await bidApi.adminListBids(askId)
      setBids(res?.data?.bids || [])
    } catch (err) {
      console.error(err)
      setBids([])
    }
  }

  const closeBids = () => {
    setBidsModalOpen(false)
    setCurrentAskId(null)
    setBids([])
    setSelectedStore(null)
    setDeliverAt('')
  }

  const handleCreate = async () => {
    if (!form.product_id || !form.quantity) {
      return toast({ title: 'Product and quantity required', status: 'warning' })
    }
    try {
      await bidApi.createAsk(form)
      toast({ title: 'Ask created', status: 'success' })
      setForm({
        product_id: '',
        quantity: 0,
        min_price: '',
        expires_at: '',
        note: '',
      })
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

  const handleAcceptBid = async (bidId) => {
    if (!selectedStore) {
      return toast({ title: 'Select a store', status: 'warning' })
    }
    try {
      await bidApi.acceptBid(bidId, {
        store_id: selectedStore,
        deliver_at: deliverAt || null,
      })
      toast({ title: 'Bid accepted & order created', status: 'success' })
      closeBids()
      fetchAsks()
    } catch (err) {
      console.error(err)
      toast({ title: 'Failed to accept bid', status: 'error' })
    }
  }

  return (
    <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column" w="100vw">
      <Navbar />

      <Container maxW="container.xl" py={8} flex={1}>
        <VStack align="stretch" spacing={8}>
          {/* Header */}
          <Box>
            <Heading color="white" size="lg">Ask Suppliers</Heading>
            <Text color="gray.400" mt={1}>
              Request quotes from suppliers and manage incoming bids
            </Text>
          </Box>

          {/* Create Ask */}
          <Box bg="gray.800" p={6} borderRadius="xl" border="1px solid" borderColor="gray.700">
            <Heading size="md" color="white" mb={4}>Create New Ask</Heading>

            <Stack spacing={4}>
              <HStack spacing={4} flexWrap="wrap">
                <FormControl>
                  <FormLabel color="gray.300">Product</FormLabel>
                  <Select
                    value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                    bg="gray.900"
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel color="gray.300">Quantity</FormLabel>
                  <Input
                    type="number"
                    bg="gray.900"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: parseInt(e.target.value || 0) })
                    }
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} flexWrap="wrap">
                <FormControl>
                  <FormLabel color="gray.300">Minimum Price</FormLabel>
                  <Input
                    bg="gray.900"
                    value={form.min_price}
                    onChange={(e) => setForm({ ...form, min_price: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="gray.300">Expires At</FormLabel>
                  <Input
                    type="datetime-local"
                    bg="gray.900"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel color="gray.300">Note</FormLabel>
                <Input
                  bg="gray.900"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </FormControl>

              <Button colorScheme="cyan" alignSelf="flex-start" onClick={handleCreate}>
                Create Ask
              </Button>
            </Stack>
          </Box>

          {/* Recent Asks */}
          <Box bg="gray.800" p={6} borderRadius="xl" border="1px solid" borderColor="gray.700">
            <Heading size="md" color="white" mb={4}>Recent Asks</Heading>

            <Table variant="simple" size="sm">
              <Thead bg="gray.700">
                <Tr>
                  <Th color="gray.300">Product</Th>
                  <Th color="gray.300">Qty</Th>
                  <Th color="gray.300">Min Price</Th>
                  <Th color="gray.300">Status</Th>
                  <Th color="gray.300">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {asks.map(a => (
                  <Tr key={a.id}>
                    <Td color="gray.200">{a.product_name}</Td>
                    <Td color="gray.200">{a.quantity}</Td>
                    <Td color="gray.200">{a.min_price || '—'}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          a.status === 'open' ? 'green' :
                            a.status === 'closed' ? 'red' : 'gray'
                        }
                      >
                        {a.status}
                      </Badge>
                    </Td>
                    <Td>
                      {a.status === 'open' && (
                        <HStack>
                          <Button size="xs" onClick={() => handleClose(a.id)}>
                            Close
                          </Button>
                          <Button size="xs" colorScheme="cyan" onClick={() => openBids(a.id)}>
                            View Bids
                          </Button>
                        </HStack>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Container>

      {/* Bids Modal */}
      <Modal isOpen={bidsModalOpen} onClose={closeBids} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bids for Ask #{currentAskId}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {bids.length === 0 ? (
              <Text>No bids yet</Text>
            ) : (
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Supplier</Th>
                    <Th>Qty</Th>
                    <Th isNumeric>Price</Th>
                    <Th>Message</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {bids.map(b => (
                    <Tr key={b.id}>
                      <Td>{b.firstname || b.lastname ? `${b.firstname || ''} ${b.lastname || ''}` : b.supplier_id}</Td>
                      <Td>{b.quantity}</Td>
                      <Td isNumeric>${Number(b.price).toFixed(2)}</Td>
                      <Td>{b.message || '-'}</Td>
                      <Td>
                        <Button
                          size="xs"
                          colorScheme="green"
                          onClick={() => handleAcceptBid(b.id)}
                        >
                          Accept
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}

            <Divider my={4} />

            <VStack spacing={3} align="stretch">
              <FormControl>
                <FormLabel>Store</FormLabel>
                <Select
                  value={selectedStore || ''}
                  onChange={(e) => setSelectedStore(e.target.value)}
                >
                  <option value="">Select store</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Deliver At</FormLabel>
                <Input
                  type="datetime-local"
                  value={deliverAt}
                  onChange={(e) => setDeliverAt(e.target.value)}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={closeBids}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Footer />
    </Box>
  )
}
