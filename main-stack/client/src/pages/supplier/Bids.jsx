import React from "react";
import { Box, Container, Heading, Text, VStack, Button } from "@chakra-ui/react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import React, { useEffect, useState } from "react";
import { Box, Container, Heading, Text, VStack, Button, Table, Thead, Tbody, Tr, Th, Td, useToast, Input, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel } from "@chakra-ui/react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import * as bidApi from '../../api/bids'

export default function SupplierBids() {
	const toast = useToast()
	const [asks, setAsks] = useState([])
	const [isOpen, setIsOpen] = useState(false)
	const [activeAsk, setActiveAsk] = useState(null)
	const [form, setForm] = useState({ price: '', quantity: '' , message: ''})

	useEffect(()=>{ fetchAsks() }, [])

	async function fetchAsks() {
		try {
			const res = await bidApi.getAsks()
			setAsks(res?.data?.asks || [])
		} catch (err) { console.error(err) }
	}

	const openBidModal = (ask) => { setActiveAsk(ask); setForm({ price: '', quantity: ask.quantity }); setIsOpen(true)}
	const closeModal = ()=>{ setIsOpen(false); setActiveAsk(null) }

	const submitBid = async ()=>{
		try {
			if (!form.price || !form.quantity) return toast({ title: 'Price and quantity required', status: 'warning' })
			await bidApi.placeBid(activeAsk.id, form)
			toast({ title: 'Bid placed', status: 'success' })
			closeModal()
		} catch (err) { console.error(err); toast({ title: 'Failed to place bid', status: 'error' }) }
	}

	return (
		<Box minH="100vh" bg="#020617" display="flex" flexDirection="column">
			<Navbar />
			<Container maxW="container.md" py={12}>
				<VStack spacing={6} align="stretch">
					<Heading color="white">Bids</Heading>
					<Text color="gray.400">View available asks and place bids.</Text>

					<Table variant="simple" colorScheme="whiteAlpha" bg="whiteAlpha.50" p={4} borderRadius="md">
						<Thead><Tr><Th>Product</Th><Th>Qty</Th><Th>Min Price</Th><Th>Expires At</Th><Th>Action</Th></Tr></Thead>
						<Tbody>
							{asks.map(a=> (
								<Tr key={a.id}><Td>{a.product_name}</Td><Td>{a.quantity}</Td><Td>{a.min_price||'—'}</Td><Td>{a.expires_at||'—'}</Td><Td><Button size="sm" onClick={()=>openBidModal(a)}>Place Bid</Button></Td></Tr>
							))}
						</Tbody>
					</Table>

					<Modal isOpen={isOpen} onClose={closeModal}>
						<ModalOverlay />
						<ModalContent>
							<ModalHeader>Place Bid</ModalHeader>
							<ModalCloseButton />
							<ModalBody>
								<FormControl>
									<FormLabel>Price</FormLabel>
									<Input value={form.price} onChange={(e)=>setForm({...form, price: e.target.value})} />
								</FormControl>
								<FormControl mt={3}>
									<FormLabel>Quantity</FormLabel>
									<Input value={form.quantity} onChange={(e)=>setForm({...form, quantity: e.target.value})} />
								</FormControl>
								<FormControl mt={3}>
									<FormLabel>Message (optional)</FormLabel>
									<Input value={form.message} onChange={(e)=>setForm({...form, message: e.target.value})} />
								</FormControl>
							</ModalBody>
							<ModalFooter>
								<Button colorScheme="cyan" onClick={submitBid}>Submit Bid</Button>
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