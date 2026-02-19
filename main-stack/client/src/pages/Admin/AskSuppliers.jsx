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

const BID_STATUS_COLOR = {
  submitted: 'blue',
  accepted: 'green',
  rejected: 'red',
}

export default function AskSuppliers() {
  const toast = useToast()

  const [products, setProducts] = useState([])
  const [stores, setStores] = useState([])
  const [asks, setAsks] = useState([])
  const [bids, setBids] = useState([])

  const [loadingAsks, setLoadingAsks] = useState(false)
  const [loadingBids, setLoadingBids] = useState(false)
  const [acceptingBidId, setAcceptingBidId] = useState(null)

  const [bidsModalOpen, setBidsModalOpen] = useState(false)
  const [currentAskId, setCurrentAskId] = useState(null)
  const [currentAskStatus, setCurrentAskStatus] = useState('open')

  const [askStatusFilter, setAskStatusFilter] = useState('all')
  const [selectedStore, setSelectedStore] = useState('')
  const [deliverAt, setDeliverAt] = useState('')

  const [form, setForm] = useState({
    product_id: '',
    quantity: '',
    min_price: '',
    expires_at: '',
    note: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const [p, s] = await Promise.all([
          adminApi.getProducts(100, 0),
          adminApi.getStores(100, 0),
        ])
        setProducts(p?.data?.products || [])
        setStores(s?.data?.stores || [])
      } catch (err) {
        console.error(err)
      }
    }

    load()
    fetchAsks('all')
  }, [])

  async function fetchAsks(status = askStatusFilter) {
    try {
      setLoadingAsks(true)
      const filters = status && status !== 'all' ? { status } : {}
      const res = await bidApi.getAdminAsks(100, 0, filters)
      setAsks(res?.data?.asks || [])
    } catch (err) {
      console.error(err)
      toast({ title: 'Failed to load asks', status: 'error' })
    } finally {
      setLoadingAsks(false)
    }
  }

  async function openBids(ask) {
    setCurrentAskId(ask.id)
    setCurrentAskStatus(ask.status || 'open')
    setSelectedStore('')
    setDeliverAt('')
    setBidsModalOpen(true)
    setLoadingBids(true)
    try {
      const res = await bidApi.adminListBids(ask.id)
      setBids(res?.data?.bids || [])
    } catch (err) {
      console.error(err)
      setBids([])
      toast({ title: 'Failed to load bids', status: 'error' })
    } finally {
      setLoadingBids(false)
    }
  }

  const closeBids = () => {
    setBidsModalOpen(false)
    setCurrentAskId(null)
    setCurrentAskStatus('open')
    setBids([])
    setSelectedStore('')
    setDeliverAt('')
    setAcceptingBidId(null)
  }

  const handleCreate = async () => {
    const qty = parseInt(form.quantity, 10)
    if (!form.product_id || !Number.isInteger(qty) || qty <= 0) {
      return toast({ title: 'Product and valid quantity required', status: 'warning' })
    }

    try {
      await bidApi.createAsk({
        ...form,
        quantity: qty,
        min_price: form.min_price === '' ? null : Number(form.min_price),
        expires_at: form.expires_at || null,
      })
      toast({ title: 'Ask created', status: 'success' })
      setForm({
        product_id: '',
        quantity: '',
        min_price: '',
        expires_at: '',
        note: '',
      })
      fetchAsks()
    } catch (err) {
      console.error(err)
      toast({
        title: err?.response?.data?.message || 'Failed to create ask',
        status: 'error',
      })
    }
  }

  const handleClose = async (id) => {
    try {
      await bidApi.closeAsk(id)
      toast({ title: 'Ask closed', status: 'success' })
      fetchAsks()
    } catch (err) {
      console.error(err)
      toast({
        title: err?.response?.data?.message || 'Failed to close ask',
        status: 'error',
      })
    }
  }

  const handleAcceptBid = async (bid) => {
    const storeId = parseInt(selectedStore, 10)
    if (!Number.isInteger(storeId) || storeId <= 0) {
      return toast({ title: 'Select a store', status: 'warning' })
    }
    if (bid.status !== 'submitted') {
      return toast({ title: 'Only submitted bids can be accepted', status: 'warning' })
    }
    if (currentAskStatus !== 'open') {
      return toast({ title: 'Ask is closed', status: 'warning' })
    }

    try {
      setAcceptingBidId(bid.id)
      await bidApi.acceptBid(bid.id, {
        store_id: storeId,
        deliver_at: deliverAt || null,
      })
      toast({ title: 'Bid accepted and supply order created', status: 'success' })
      closeBids()
      fetchAsks()
    } catch (err) {
      console.error(err)
      toast({
        title: err?.response?.data?.message || 'Failed to accept bid',
        status: 'error',
      })
    } finally {
      setAcceptingBidId(null)
    }
  }

  const getSupplierLabel = (bid) => {
    const userName = `${bid.firstname || ''} ${bid.lastname || ''}`.trim()
    if (userName) return userName
    if (bid.supplier_name) return bid.supplier_name
    if (bid.supplier_email) return bid.supplier_email
    return `Supplier #${bid.supplier_id}`
  }

  return (
    <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column" w="100vw">
      <Navbar />

      <Container maxW="container.xl" py={8} flex={1}>
        <VStack align="stretch" spacing={8}>
          <Box>
            <Heading color="white" size="lg">Ask Suppliers</Heading>
            <Text color="gray.400" mt={1}>
              Create asks, review bids, and accept winning suppliers.
            </Text>
          </Box>

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
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel color="gray.300">Quantity</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    bg="gray.900"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} flexWrap="wrap">
                <FormControl>
                  <FormLabel color="gray.300">Ask Price (Optional)</FormLabel>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
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

          <Box bg="gray.800" p={6} borderRadius="xl" border="1px solid" borderColor="gray.700">
            <HStack justify="space-between" mb={4} flexWrap="wrap" spacing={3}>
              <Heading size="md" color="white">Asks</Heading>
              <HStack spacing={3}>
                <Select
                  size="sm"
                  value={askStatusFilter}
                  onChange={(e) => {
                    const next = e.target.value
                    setAskStatusFilter(next)
                    fetchAsks(next)
                  }}
                  bg="gray.900"
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
                <Button size="sm" onClick={() => fetchAsks()}>Refresh</Button>
              </HStack>
            </HStack>

            <Table variant="simple" size="sm">
              <Thead bg="gray.700">
                <Tr>
                  <Th color="gray.300">Product</Th>
                  <Th color="gray.300">Qty</Th>
                  <Th color="gray.300">Ask Price</Th>
                  <Th color="gray.300">Bids</Th>
                  <Th color="gray.300">Status</Th>
                  <Th color="gray.300">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {asks.map((a) => (
                  <Tr key={a.id}>
                    <Td color="gray.200">{a.product_name}</Td>
                    <Td color="gray.200">{a.quantity}</Td>
                    <Td color="gray.200">{a.min_price || '—'}</Td>
                    <Td color="gray.200">
                      {Number(a.bids_count || 0)}
                      {Number(a.accepted_bids_count || 0) > 0 ? ' (accepted)' : ''}
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={a.status === 'open' ? 'green' : a.status === 'closed' ? 'red' : 'gray'}
                      >
                        {a.status}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack>
                        <Button
                          size="xs"
                          colorScheme="cyan"
                          onClick={() => openBids(a)}
                        >
                          View Bids
                        </Button>
                        {a.status === 'open' && (
                          <Button size="xs" onClick={() => handleClose(a.id)}>
                            Close
                          </Button>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {!loadingAsks && asks.length === 0 && (
              <Text color="gray.400" mt={4}>No asks found for selected status.</Text>
            )}
          </Box>
        </VStack>
      </Container>

      <Modal isOpen={bidsModalOpen} onClose={closeBids} size="2xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bids for Ask #{currentAskId}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {loadingBids ? (
              <Text>Loading bids...</Text>
            ) : bids.length === 0 ? (
              <Text>No bids yet</Text>
            ) : (
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Supplier</Th>
                    <Th>Qty</Th>
                    <Th isNumeric>Price</Th>
                    <Th>Status</Th>
                    <Th>Message</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {bids.map((b) => (
                    <Tr key={b.id}>
                      <Td>{getSupplierLabel(b)}</Td>
                      <Td>{b.quantity}</Td>
                      <Td isNumeric>${Number(b.price).toFixed(2)}</Td>
                      <Td>
                        <Badge colorScheme={BID_STATUS_COLOR[b.status] || 'gray'}>
                          {b.status}
                        </Badge>
                      </Td>
                      <Td>{b.message || '-'}</Td>
                      <Td>
                        <Button
                          size="xs"
                          colorScheme="green"
                          isDisabled={b.status !== 'submitted' || currentAskStatus !== 'open'}
                          isLoading={acceptingBidId === b.id}
                          onClick={() => handleAcceptBid(b)}
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
              <FormControl isRequired>
                <FormLabel>Store</FormLabel>
                <Select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                >
                  <option value="">Select store</option>
                  {stores.map((s) => (
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
