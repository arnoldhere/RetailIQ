import React, { createContext, useContext, useState } from 'react'

const WishlistContext = createContext()

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('retailiq_wishlist')
      return saved ? JSON.parse(saved) : []
    } catch (err) {
      console.error('Failed to load wishlist from localStorage:', err)
      return []
    }
  })

  // Persist wishlist to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('retailiq_wishlist', JSON.stringify(wishlist))
    } catch (err) {
      console.error('Failed to save wishlist to localStorage:', err)
    }
  }, [wishlist])

  const addToWishlist = (product) => {
    if (!product || !product.id) return
    setWishlist((prev) => {
      const exists = prev.find((item) => item.id === product.id)
      if (exists) return prev
      return [...prev, product]
    })
  }

  const removeFromWishlist = (productId) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId))
  }

  const toggleWishlist = (product) => {
    if (!product || !product.id) return
    setWishlist((prev) => {
      const exists = prev.find((item) => item.id === product.id)
      if (exists) {
        return prev.filter((item) => item.id !== product.id)
      }
      return [...prev, product]
    })
  }

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId)
  }

  const clearWishlist = () => {
    setWishlist([])
  }

  const getWishlistCount = () => {
    return wishlist.length
  }

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
