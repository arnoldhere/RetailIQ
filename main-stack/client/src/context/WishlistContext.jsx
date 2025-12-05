import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import * as wishlistAPI from '../api/wishlist'
import { useAuth } from './AuthContext'
import { useToast } from '@chakra-ui/react'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth()
  const toast = useToast()

  const [wishlist, setWishlist] = useState(() => {
    // Local cache fallback (for faster first paint / offline)
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem('retailiq_wishlist')
      return saved ? JSON.parse(saved) : []
    } catch (err) {
      console.error('Failed to load wishlist from localStorage:', err)
      return []
    }
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [synced, setSynced] = useState(false)

  // Fetch wishlist from backend on user login/mount
  useEffect(() => {
    let isMounted = true

    const fetchWishlist = async () => {
      if (!user || !user.id || authLoading) return

      try {
        setLoading(true)
        setError(null)

        const response = await wishlistAPI.getWishlist()

        // Expecting: { items: [ { id, name, ... } ], count }
        if (isMounted && Array.isArray(response.items)) {
          // Merge server wishlist with localStorage (server takes precedence)
          const mergedWishlist = response.items.map(item => ({
            id: item.product_id,
            ...item,
            wishlistItemId: item.wishlistItemId,
          }))

          setWishlist(mergedWishlist)
          setSynced(true)

          // Update localStorage with synced data
          localStorage.setItem('retailiq_wishlist', JSON.stringify(mergedWishlist))
        }
      } catch (err) {
        console.error('Error fetching wishlist from API:', err)
        if (isMounted) {
          const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch wishlist'
          setError(errorMessage)
          // Fall back to localStorage on error
          setSynced(false)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchWishlist()

    return () => {
      isMounted = false
    }
  }, [user, authLoading])

  // Persist wishlist to localStorage whenever it changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('retailiq_wishlist', JSON.stringify(wishlist))
      }
    } catch (err) {
      console.error('Failed to save wishlist to localStorage:', err)
    }
  }, [wishlist])

  const addToWishlist = useCallback(
    async (product) => {
      if (!product || !product.id) return

      try {
        // Optimistic update
        setWishlist((prev) => {
          const exists = prev.find((item) => item.id === product.id)
          if (exists) return prev
          return [...prev, product]
        })

        // Sync with server if user is logged in
        if (user && user.id) {
          try {
            const response = await wishlistAPI.addToWishlist(product.id)
            // Update wishlist with server response
            if (response.items) {
              const mergedWishlist = response.items.map(item => ({
                id: item.product_id,
                ...item,
                wishlistItemId: item.wishlistItemId,
              }))
              setWishlist(mergedWishlist)
            }
          } catch (err) {
            console.error('Failed to sync add to wishlist:', err)
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
        console.error('Error adding to wishlist:', err)
        const errorMessage = err.response?.data?.message || err.message || 'Failed to add to wishlist'
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

  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!productId) return

      try {
        // Find wishlist item ID
        const wishlistItem = wishlist.find(item => item.id === productId)
        const wishlistItemId = wishlistItem?.wishlistItemId

        // Optimistic update
        setWishlist((prev) => prev.filter((item) => item.id !== productId))

        // Sync with server if user is logged in
        if (user && user.id && wishlistItemId) {
          try {
            await wishlistAPI.removeFromWishlistById(wishlistItemId)
          } catch (err) {
            console.error('Failed to sync remove from wishlist:', err)
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
        console.error('Error removing from wishlist:', err)
        const errorMessage = err.response?.data?.message || err.message || 'Failed to remove from wishlist'
        setError(errorMessage)
      }
    },
    [user, wishlist, toast]
  )

  const toggleWishlist = useCallback(
    async (product) => {
      if (!product || !product.id) return

      const alreadyIn = wishlist.some((item) => item.id === product.id)
      if (alreadyIn) {
        await removeFromWishlist(product.id)
      } else {
        await addToWishlist(product)
      }
    },
    [wishlist, addToWishlist, removeFromWishlist]
  )

  const isInWishlist = useCallback(
    (productId) => wishlist.some((item) => item.id === productId),
    [wishlist]
  )

  const clearWishlist = useCallback(async () => {
    try {
      // Optimistic update
      setWishlist([])

      // Sync with server if user is logged in
      if (user && user.id) {
        try {
          await wishlistAPI.clearWishlist()
        } catch (err) {
          console.error('Failed to sync clear wishlist:', err)
          const errorMessage = err.response?.data?.message || err.message || 'Failed to sync with server'
          toast({
            title: 'Warning',
            description: `Wishlist cleared locally. ${errorMessage}`,
            status: 'warning',
            duration: 3000,
            isClosable: true,
          })
        }
      }
    } catch (err) {
      console.error('Error clearing wishlist:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to clear wishlist'
      setError(errorMessage)
    }
  }, [user, toast])

  const getWishlistCount = useCallback(() => wishlist.length, [wishlist])

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        getWishlistCount,
        loading,
        error,
        synced,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider')
  }
  return context
}
