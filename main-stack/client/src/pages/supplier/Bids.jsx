import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Badge,
  HStack,
} from '@chakra-ui/react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import * as bidApi from '../../api/bids'

const BID_STATUS_COLOR = {
  submitted: 'blue',
  accepted: 'green',
  rejected: 'red',
}

export default function SupplierBids() {
  const toast = useToast()
  const [asks, setAsks] = useState([])
  const [supplierBids, setSupplierBids] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeAsk, setActiveAsk] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ price: '', quantity: '', message: '' })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [askRes, bidRes] = await Promise.all([
        bidApi.getAsks(100, 0),
        bidApi.getSupplierBids(),
      ])
      setAsks(askRes?.data?.asks || [])
      setSupplierBids(bidRes?.data?.bids || [])
    } catch (err) {
      console.error(err)
      toast({ title: 'Failed to load asks and bids', status: 'error' })
    }
  }

  const latestBidByAsk = useMemo(() => {
    const map = {}
    for (const bid of supplierBids) {
      if (!map[bid.ask_id]) {
        map[bid.ask_id] = bid
      }
    }
    return map
  }, [supplierBids])

  function openBidModal(ask) {
    const existing = latestBidByAsk[ask.id]
    setActiveAsk(ask)
    setForm({
      price: existing?.status === 'submitted' ? String(existing.price || '') : '',
      quantity: existing?.status === 'submitted' ? String(existing.quantity || ask.quantity || '') : String(ask.quantity || ''),
      message: existing?.status === 'submitted' ? String(existing.message || '') : '',
    })
    setIsOpen(true)
  }

  function closeModal() {
    setIsOpen(false)
    setActiveAsk(null)
  }

  async function submitBid() {
    if (!activeAsk) return
    const price = Number(form.price)
    const quantity = parseInt(form.quantity, 10)
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
      return toast({ title: 'Price and quantity must be positive', status: 'warning' })
    }

    try {
      setSubmitting(true)
      const res = await bidApi.placeBid(activeAsk.id, {
        ...form,
        price,
        quantity,
      })
      toast({
        title: res?.data?.message || 'Bid submitted',
        status: 'success',
      })
      closeModal()
      await loadData()
    } catch (err) {
      console.error(err)
      toast({
        title: err?.response?.data?.message || 'Failed to place bid',
        status: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) return 'No expiry'
    const dt = new Date(dateValue)
    if (Number.isNaN(dt.getTime())) return String(dateValue)
    return dt.toLocaleString()
  }

  return (
    <Box minH="100vh" bg="#020617" display="flex" flexDirection="column" w="100vw">
      <Navbar />
      <Container maxW="container.xl" py={12}>
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between" flexWrap="wrap">
            <Box>
              <Heading color="white">Bids</Heading>
              <Text color="gray.400">View admin asks and place or update your bid.</Text>
            </Box>
            <Button size="sm" onClick={loadData}>Refresh</Button>
          </HStack>

          <Table variant="simple" colorScheme="whiteAlpha" bg="whiteAlpha.50" p={4} borderRadius="md">
            <Thead>
              <Tr>
                <Th>Product</Th>
                <Th>Ask Qty</Th>
                <Th>Ask Price</Th>
                <Th>Expires At</Th>
                <Th>Your Latest Bid</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {asks.map((a) => {
                const latest = latestBidByAsk[a.id]
                const isLocked = latest?.status === 'accepted'
                return (
                  <Tr key={a.id}>
                    <Td>{a.product_name}</Td>
                    <Td>{a.quantity}</Td>
                    <Td>{a.min_price || '—'}</Td>
                    <Td>{formatDate(a.expires_at)}</Td>
                    <Td>{latest ? `${latest.quantity} @ ${Number(latest.price).toFixed(2)}` : 'No bid yet'}</Td>
                    <Td>
                      {latest ? (
                        <Badge colorScheme={BID_STATUS_COLOR[latest.status] || 'gray'}>
                          {latest.status}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        isDisabled={isLocked}
                        onClick={() => openBidModal(a)}
                      >
                        {latest?.status === 'submitted' ? 'Update Bid' : 'Place Bid'}
                      </Button>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>

          {asks.length === 0 && (
            <Text color="gray.400">No open asks available right now.</Text>
          )}

          <Modal isOpen={isOpen} onClose={closeModal}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>{latestBidByAsk[activeAsk?.id]?.status === 'submitted' ? 'Update Bid' : 'Place Bid'}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <FormControl>
                  <FormLabel>Price</FormLabel>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </FormControl>
                <FormControl mt={3}>
                  <FormLabel>Quantity</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </FormControl>
                <FormControl mt={3}>
                  <FormLabel>Message (optional)</FormLabel>
                  <Input
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </FormControl>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="cyan" onClick={submitBid} isLoading={submitting}>
                  Submit Bid
                </Button>
                <Button variant="ghost" ml={3} onClick={closeModal}>Cancel</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </VStack>
      </Container>
      <Footer />
    </Box>
  )
}
