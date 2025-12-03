import React, { useEffect, useRef } from 'react'
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  Icon,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'

export default function NotFound() {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline()
    
    tl.fromTo(
      containerRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out' }
    )
    .fromTo(
      textRef.current?.children,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.4 },
      0.2
    )
    .fromTo(
      buttonRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4 },
      0.6
    )

    // Floating animation on the error code
    gsap.to('.error-code', {
      y: -10,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  }, [])

  return (
    <Box minH="100vh" bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" display="flex" alignItems="center">
      <Container maxW="container.md">
        <Flex ref={containerRef} direction="column" align="center" justify="center" textAlign="center">
          {/* 404 Code with animation */}
          <Heading
            className="error-code"
            fontSize={{ base: '6xl', md: '8xl' }}
            fontWeight="900"
            bgGradient="linear(to-r, white, rgba(255,255,255,0.7))"
            bgClip="text"
            mb={6}
            lineHeight={1}
          >
            404
          </Heading>

          {/* Text Content */}
          <VStack ref={textRef} spacing={4} mb={8}>
            <Heading size="lg" color="white" fontWeight="bold">
              Page Not Found
            </Heading>
            <Text fontSize="md" color="whiteAlpha.800" maxW="400px">
              The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
            </Text>
          </VStack>

          {/* Action Buttons */}
          <VStack ref={buttonRef} spacing={3} direction={{ base: 'column', sm: 'row' }}>
            <Button
              colorScheme="whiteAlpha"
              variant="solid"
              size="lg"
              onClick={() => navigate('/')}
              fontWeight="600"
              px={8}
            >
              Go Home
            </Button>
            <Button
              colorScheme="whiteAlpha"
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
              fontWeight="600"
              px={8}
            >
              Go Back
            </Button>
          </VStack>

          {/* Decorative Elements */}
          <Box position="absolute" top="10%" left="5%" opacity={0.1}>
            <Box w="150px" h="150px" borderRadius="full" bg="white" filter="blur(40px)" />
          </Box>
          <Box position="absolute" bottom="15%" right="10%" opacity={0.1}>
            <Box w="200px" h="200px" borderRadius="full" bg="white" filter="blur(50px)" />
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}
