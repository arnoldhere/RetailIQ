import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as cartAPI from '../api/cart'
import { useAuth } from './AuthContext'
import { useToast } from '@chakra-ui/react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth()
  const toast = useToast()

  const [cart, setCart] = useState(() => {
    // Initialize from localStorage for fast first render
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem('retailiq_cart')
      return saved ? JSON.parse(saved) : []
    } catch (err) {
      console.error('Failed to load cart from localStorage:', err)
      return []
    }
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [synced, setSynced] = useState(false)

  // Fetch cart from server on user login/mount
  useEffect(() => {
    let isMounted = true

    const fetchCartFromServer = async () => {
      if (!user || !user.id || authLoading) return

      try {
        setLoading(true)
        setError(null)

        const response = await cartAPI.getCart()

        if (isMounted && response.items) {
          // Merge server cart with localStorage (server takes precedence)
          const mergedCart = response.items.map(item => ({
            id: item.product_id,
            ...item,
            quantity: item.qty,
            cartItemId: item.cartItemId,
          }))

          setCart(mergedCart)
          setSynced(true)

          // Update localStorage with synced data
          localStorage.setItem('retailiq_cart', JSON.stringify(mergedCart))
        }
      } catch (err) {
        console.error('Error fetching cart from server:', err)
        if (isMounted) {
          const errorMessage = err.response?.data?.message || err.message || 'Failed to sync cart'
          setError(errorMessage)
          // Fall back to localStorage on error
          setSynced(false)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchCartFromServer()

    return () => {
      isMounted = false
    }
  }, [user, authLoading])

  // Persist cart to localStorage whenever it changes (for offline support)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('retailiq_cart', JSON.stringify(cart))
      }
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err)
    }
  }, [cart])

  const addToCart = useCallback(
    async (product, quantity = 1) => {
      if (!product || !product.id || quantity < 1) return

      try {
        // Optimistic update
        setCart(prev => {
          const existing = prev.find(item => item.id === product.id)
          if (existing) {
            return prev.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          }
          return [
            ...prev,
            {
              ...product,
              quantity,
            },
          ]
        })

        // Sync with server if user is logged in
        if (user && user.id) {
          try {
            const response = await cartAPI.addToCart(product.id, quantity)
            // Update cart with server response (includes cartItemId and other details)
            if (response.items) {
              const mergedCart = response.items.map(item => ({
                id: item.product_id,
                ...item,
                quantity: item.qty,
                cartItemId: item.cartItemId,
              }))
              setCart(mergedCart)
            }
          } catch (err) {
            console.error('Failed to sync add to cart:', err)
            const errorMessage = err.response?.data?.message || err.message || 'Failed to sync with server'
            toast({
              title: 'Warning',
              description: `Item added locally. ${errorMessage}`,
              status: 'warning',
              duration: 3000,
              isClosable: true,
            })
          }
        }
      } catch (err) {
        console.error('Error adding to cart:', err)
        const errorMessage = err.response?.data?.message || err.message || 'Failed to add to cart'
        setError(errorMessage)
        toast({
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    },
    [user, toast]
  )

  const removeFromCart = useCallback(
    async (productId) => {
      if (!productId) return

      try {
        // Find cart item ID if synced with server
        const cartItem = cart.find(item => item.id === productId)
        const cartItemId = cartItem?.cartItemId

        // Optimistic update
        setCart(prev => prev.filter(item => item.id !== productId))

        // Sync with server if user is logged in and we have the cart item ID
        if (user && user.id && cartItemId) {
          try {
            await cartAPI.removeFromCart(cartItemId)
          } catch (err) {
            console.error('Failed to sync remove from cart:', err)
            const errorMessage = err.response?.data?.message || err.message || 'Failed to sync with server'
            toast({
              title: 'Warning',
              description: `Item removed locally. ${errorMessage}`,
              status: 'warning',
              duration: 3000,
              isClosable: true,
            })
          }
        }
      } catch (err) {
        console.error('Error removing from cart:', err)
        const errorMessage = err.response?.data?.message || err.message || 'Failed to remove from cart'
        setError(errorMessage)
      }
    },
    [user, cart, toast]
  )

  const updateQuantity = useCallback(
    async (productId, quantity) => {
      if (quantity < 1) {
        removeFromCart(productId)
        return
      }

      try {
        // Find cart item ID
        const cartItem = cart.find(item => item.id === productId)
        const cartItemId = cartItem?.cartItemId

        // Optimistic update
        setCart(prev =>
          prev.map(item =>
            item.id === productId ? { ...item, quantity } : item
          )
        )

        // Sync with server if user is logged in
        if (user && user.id && cartItemId) {
          try {
            await cartAPI.updateCartItemQuantity(cartItemId, quantity)
          } catch (err) {
            console.error('Failed to sync quantity update:', err)
            const errorMessage = err.response?.data?.message || err.message || 'Failed to sync with server'
            toast({
              title: 'Warning',
              description: `Quantity updated locally. ${errorMessage}`,
              status: 'warning',
              duration: 3000,
              isClosable: true,
            })
          }
        }
      } catch (err) {
        console.error('Error updating quantity:', err)
        const errorMessage = err.response?.data?.message || err.message || 'Failed to update quantity'
        setError(errorMessage)
      }
    },
    [user, cart, removeFromCart, toast]
  )

  const clearCart = useCallback(async () => {
    try {
      // Optimistic update
      setCart([])

      // Sync with server if user is logged in
      if (user && user.id) {
        try {
          await cartAPI.clearCart()
        } catch (err) {
          console.error('Failed to sync clear cart:', err)
          const errorMessage = err.response?.data?.message || err.message || 'Failed to sync with server'
          toast({
            title: 'Warning',
            description: `Cart cleared locally. ${errorMessage}`,
            status: 'warning',
            duration: 3000,
            isClosable: true,
          })
        }
      }
    } catch (err) {
      console.error('Error clearing cart:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to clear cart'
      setError(errorMessage)
    }
  }, [user, toast])

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const price = item.sell_price || 0
      const qty = item.quantity || 0
      return total + price * qty
    }, 0)
  }, [cart])

  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + (item.quantity || 0), 0)
  }, [cart])

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    loading,
    error,
    synced,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

