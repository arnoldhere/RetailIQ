# Technical Details - Bug Fixes

## Bug #1: Profile Address Section with GPS

### Files Modified
- `client/src/pages/Profile.jsx`

### Changes Made

#### 1. Added New Imports
```javascript
import { Textarea } from '@chakra-ui/react';
import { FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import { SmallCloseIcon } from '@chakra-ui/icons';
```

#### 2. Updated State
```javascript
// BEFORE:
const [formData, setFormData] = useState({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
});

// AFTER:
const [formData, setFormData] = useState({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  address: '',  // ✅ NEW
});

const [isDetectingLocation, setIsDetectingLocation] = useState(false); // ✅ NEW
```

#### 3. Initialize Form Data
```javascript
// BEFORE:
useEffect(() => {
  if (user) {
    setFormData({
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  }
}, [user]);

// AFTER:
useEffect(() => {
  if (user) {
    setFormData({
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',  // ✅ NEW
    });
  }
}, [user]);
```

#### 4. Added GPS Detection Function
```javascript
// ✅ NEW FUNCTION
const detectLocation = async () => {
  if (!navigator.geolocation) {
    toast({
      title: 'Geolocation not supported',
      description: 'Your browser does not support geolocation. Please enter address manually.',
      status: 'warning',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
    return;
  }

  setIsDetectingLocation(true);
  try {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to reverse geocode coordinates to address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.address?.road ? 
            `${data.address.road}, ${data.address.city || ''}, ${data.address.postcode || ''}`.trim() :
            `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
          
          setFormData(prev => ({ ...prev, address }));
          toast({
            title: 'Location detected',
            description: 'Address updated from your current location',
            status: 'success',
            duration: 2000,
            isClosable: true,
            position: 'top-right',
          });
        } catch (err) {
          // Fallback to coordinates only
          setFormData(prev => ({ 
            ...prev, 
            address: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`
          }));
          toast({
            title: 'Location detected (coordinates only)',
            description: 'Could not retrieve street address. Saved as coordinates.',
            status: 'info',
            duration: 2000,
            isClosable: true,
            position: 'top-right',
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: 'Location access denied',
          description: 'Please enter address manually or enable location access.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
      }
    );
  } catch (err) {
    console.error('Geolocation error:', err);
  } finally {
    setIsDetectingLocation(false);
  }
};
```

#### 5. Added Address UI Component
```jsx
{/* Address */}
<FormControl isInvalid={!!errors.address} gridColumn={{ base: '1', md: '1 / -1' }}>
  <HStack justify="space-between" align="center" mb={2}>
    <FormLabel fontSize="sm" fontWeight="600" color={textPrimary} m={0}>
      Address
    </FormLabel>
    {isEditing && (
      <Button
        leftIcon={<FaMapMarkerAlt />}
        size="xs"
        colorScheme="cyan"
        variant="ghost"
        onClick={detectLocation}
        isLoading={isDetectingLocation}
        spinner={<FaSpinner />}
        _hover={{ bg: 'whiteAlpha.100' }}
      >
        Detect GPS Location
      </Button>
    )}
  </HStack>
  <Textarea
    name="address"
    value={formData.address}
    onChange={handleInputChange}
    isReadOnly={!isEditing}
    placeholder="Enter your full address (street, city, state, zip code)"
    bg={isEditing ? 'whiteAlpha.50' : 'transparent'}
    border="1px solid"
    borderColor={isEditing ? 'cyan.400' : 'whiteAlpha.200'}
    _hover={{ borderColor: isEditing ? 'cyan.300' : 'whiteAlpha.200' }}
    _focus={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px rgba(34, 211, 238, 0.5)' }}
    color={textPrimary}
    _placeholder={{ color: textSecondary }}
    transition="all 0.2s"
    minH="80px"
    resize="vertical"
  />
  {errors.address && (
    <Text color="red.400" fontSize="xs" mt={1}>
      {errors.address}
    </Text>
  )}
  <Text fontSize="xs" color={textSecondary} mt={1}>
    💡 Click "Detect GPS Location" to auto-fill from your current location, or type manually
  </Text>
</FormControl>
```

#### 6. Updated Cancel Button Reset Logic
```javascript
// BEFORE:
setFormData({
  firstname: user.firstname || '',
  lastname: user.lastname || '',
  email: user.email || '',
  phone: user.phone || '',
});

// AFTER:
setFormData({
  firstname: user.firstname || '',
  lastname: user.lastname || '',
  email: user.email || '',
  phone: user.phone || '',
  address: user.address || '',  // ✅ NEW
});
```

---

## Bug #2: Stock Validation in Cart

### Files Modified
- `server/controllers/cartController.js`
- `client/src/pages/customer/ProductDetail.jsx`
- `client/src/context/CartContext.jsx`

### Backend Changes

#### 1. Enhanced `addToCart()` Function

**BEFORE:**
```javascript
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Get product details
    const product = await db('products').where({ id: productId }).first();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get or create cart
    const cart = await getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await db('customer_cart_items')
      .where({ cart_id: cart.id, product_id: productId })
      .first();

    const unitPrice = parseFloat(product.sell_price) || 0;
    const qty = parseInt(quantity) || 1;
    const totalAmount = unitPrice * qty;

    if (existingItem) {
      // Update existing item quantity (NO VALIDATION)
      const newQty = existingItem.qty + qty;
      // ... rest of code
```

**AFTER:**
```javascript
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Get product details
    const product = await db('products').where({ id: productId }).first();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // ✅ FIX 2: Check if requested quantity exceeds available stock
    const availableStock = parseInt(product.stock_available) || 0;
    if (quantity > availableStock) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${availableStock} item(s) available.`,
        available: availableStock
      });
    }

    // Get or create cart
    const cart = await getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await db('customer_cart_items')
      .where({ cart_id: cart.id, product_id: productId })
      .first();

    const unitPrice = parseFloat(product.sell_price) || 0;
    const qty = parseInt(quantity) || 1;
    const totalAmount = unitPrice * qty;

    if (existingItem) {
      // ✅ FIX 2: Validate new total quantity doesn't exceed stock
      const newQty = existingItem.qty + qty;
      if (newQty > availableStock) {
        return res.status(400).json({ 
          message: `Cannot add ${qty} more item(s). Current cart has ${existingItem.qty}. Only ${availableStock} available in total.`,
          available: availableStock,
          currentQty: existingItem.qty,
          canAdd: Math.max(0, availableStock - existingItem.qty)
        });
      }
      // ... rest of code
```

#### 2. Enhanced `updateCartItemQuantity()` Function

**BEFORE:**
```javascript
exports.updateCartItemQuantity = async (req, res) => {
  try {
    // ... validation code ...
    
    const unitPrice = parseFloat(product.sell_price) || 0;
    const qty = parseInt(quantity) || 1;
    const totalAmount = unitPrice * qty;

    // Update quantity and total (NO VALIDATION)
    await db('customer_cart_items')
      .where({ id: cartItemId })
      .update({
        qty: qty,
        total_amount: totalAmount,
      });
    // ... rest of code
```

**AFTER:**
```javascript
exports.updateCartItemQuantity = async (req, res) => {
  try {
    // ... validation code ...
    
    // ✅ FIX 2: Validate new quantity doesn't exceed available stock
    const availableStock = parseInt(product.stock_available) || 0;
    const qty = parseInt(quantity) || 1;
    if (qty > availableStock) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${availableStock} item(s) available.`,
        available: availableStock
      });
    }

    const unitPrice = parseFloat(product.sell_price) || 0;
    const totalAmount = unitPrice * qty;

    // Update quantity and total
    await db('customer_cart_items')
      .where({ id: cartItemId })
      .update({
        qty: qty,
        total_amount: totalAmount,
      });
    // ... rest of code
```

#### 3. Ensured `stock_available` in Responses
```javascript
// Added to all response mappings in addToCart & updateCartItemQuantity
const items = cartItems.map(item => ({
  cartItemId: item.cartItemId,
  product_id: item.product_id,
  qty: item.qty,
  unit_price: parseFloat(item.unit_price) || 0,
  total_amount: parseFloat(item.total_amount) || 0,
  id: item.id,
  name: item.name,
  description: item.description,
  sell_price: parseFloat(item.sell_price) || 0,
  cost_price: parseFloat(item.cost_price) || 0,
  stock: item.stock,
  stock_available: item.stock_available,  // ✅ ADDED
  category_id: item.category_id,
  supplier_id: item.supplier_id,
  images: normalizeImages(item.images)[0],
  created_at: item.created_at,
}));
```

### Frontend Changes

#### 1. Enhanced `ProductDetail.jsx` - handleAddToCart()

**BEFORE:**
```javascript
const handleAddToCart = () => {
  if (quantity > 0) {
    addToCart(product, quantity)
    toast({
      title: 'Added to cart',
      description: `${quantity} × ${product.name}`,
      status: 'success',
      duration: 2000,
    })
    setQuantity(1)
  }
}
```

**AFTER:**
```javascript
const handleAddToCart = () => {
  // ✅ FIX 2: Validate quantity doesn't exceed stock
  if (quantity <= 0) {
    toast({
      title: 'Invalid quantity',
      description: 'Please select at least 1 item',
      status: 'error',
      duration: 2000,
    })
    return
  }

  if (quantity > product.stock_available) {
    toast({
      title: 'Insufficient stock',
      description: `Only ${product.stock_available} item(s) available in stock.`,
      status: 'error',
      duration: 2000,
    })
    return
  }

  addToCart(product, quantity)
  toast({
    title: 'Added to cart',
    description: `${quantity} × ${product.name}`,
    status: 'success',
    duration: 2000,
  })
  setQuantity(1)
}
```

#### 2. Enhanced `CartContext.jsx` - Error Handling

**BEFORE:**
```javascript
const addToCart = useCallback(
  async (product, quantity = 1) => {
    // ... code ...
    
    if (user && user.id) {
      try {
        const response = await cartAPI.addToCart(product.id, quantity)
        // ... handle response ...
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
  },
  [user, toast]
)
```

**AFTER:**
```javascript
const addToCart = useCallback(
  async (product, quantity = 1) => {
    // ... code ...
    
    if (user && user.id) {
      try {
        const response = await cartAPI.addToCart(product.id, quantity)
        // ... handle response ...
      } catch (err) {
        console.error('Failed to sync add to cart:', err)
        // ✅ FIX 2: Check for stock validation errors
        if (err.response?.status === 400) {
          const errorMessage = err.response?.data?.message || 'Cannot add this quantity'
          
          // Revert optimistic update if validation failed
          setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
              return prev.map(item =>
                item.id === product.id
                  ? { ...item, quantity: Math.max(0, item.quantity - quantity) }
                  : item
              ).filter(item => item.quantity > 0)
            }
            return prev.filter(item => item.id !== product.id)
          })
          
          toast({
            title: 'Stock limit error',
            description: errorMessage,
            status: 'error',
            duration: 3000,
            isClosable: true,
          })
        } else {
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
    }
  },
  [user, toast]
)
```

---

## Bug #3: Wishlist Stock Status

### Files Modified
- `server/controllers/wishlistController.js`

### Changes Made

All functions in wishlist controller needed to include `stock_available` in their mapping:

#### 1. Fixed `getWishlist()`
```javascript
// BEFORE:
const items = wishlistItems.map(item => ({
  wishlistItemId: item.wishlistItemId,
  product_id: item.product_id,
  id: item.id,
  name: item.name,
  description: item.description,
  sell_price: parseFloat(item.sell_price) || 0,
  cost_price: parseFloat(item.cost_price) || 0,
  stock: item.stock,
  category_id: item.category_id,
  supplier_id: item.supplier_id,
  images: normalizeImages(item.images),
  created_at: item.created_at,
}));

// AFTER:
const items = wishlistItems.map(item => ({
  wishlistItemId: item.wishlistItemId,
  product_id: item.product_id,
  id: item.id,
  name: item.name,
  description: item.description,
  sell_price: parseFloat(item.sell_price) || 0,
  cost_price: parseFloat(item.cost_price) || 0,
  stock: item.stock,
  stock_available: item.stock_available,  // ✅ ADDED
  category_id: item.category_id,
  supplier_id: item.supplier_id,
  images: normalizeImages(item.images),
  created_at: item.created_at,
}));
```

#### 2. Fixed `addToWishlist()` - Both Occurrences
```javascript
// In existing item check:
const items = wishlistItems.map(item => ({
  // ... fields ...
  stock_available: item.stock_available,  // ✅ ADDED
  // ... fields ...
}));

// In add new item:
const items = wishlistItems.map(item => ({
  // ... fields ...
  stock_available: item.stock_available,  // ✅ ADDED
  // ... fields ...
}));
```

#### 3. Fixed `removeFromWishlistById()`
```javascript
const items = wishlistItems.map(item => ({
  wishlistItemId: item.wishlistItemId,
  product_id: item.product_id,
  id: item.id,
  name: item.name,
  description: item.description,
  sell_price: parseFloat(item.sell_price) || 0,
  cost_price: parseFloat(item.cost_price) || 0,
  stock: item.stock,
  stock_available: item.stock_available,  // ✅ ADDED
  category_id: item.category_id,
  supplier_id: item.supplier_id,
  images: normalizeImages(item.images),
  created_at: item.created_at,
}));
```

#### 4. Fixed `removeFromWishlistByProductId()`
```javascript
const items = wishlistItems.map(item => ({
  wishlistItemId: item.wishlistItemId,
  product_id: item.product_id,
  id: item.id,
  name: item.name,
  description: item.description,
  sell_price: parseFloat(item.sell_price) || 0,
  cost_price: parseFloat(item.cost_price) || 0,
  stock: item.stock,
  stock_available: item.stock_available,  // ✅ ADDED
  category_id: item.category_id,
  supplier_id: item.supplier_id,
  images: normalizeImages(item.images),
  created_at: item.created_at,
}));
```

---

## Testing Checklist

### Profile Address with GPS
- [ ] Edit profile, enable GPS, detect location works
- [ ] Reverse geocoding returns street address
- [ ] Falls back to coordinates if reverse geocoding fails
- [ ] Manual address entry works
- [ ] Address persists after save
- [ ] Address displays correctly in view mode

### Stock Validation
- [ ] Product with 10 stock: Can add 10, can't add 11+
- [ ] Adding 5, then trying to add 6+ fails with appropriate message
- [ ] Error message shows available quantity
- [ ] Optimistic update reverts on error
- [ ] Stock validation works on quantity update
- [ ] Wishlist "Move to Cart" disabled for out-of-stock

### Wishlist Stock Status
- [ ] Add in-stock product to wishlist: Shows "In Stock"
- [ ] Add out-of-stock product to wishlist: Shows "Out of Stock"
- [ ] Add low-stock product: Shows "Low Stock"
- [ ] All stock statuses persist when viewing wishlist
- [ ] Stock badge colors match availability

---

**End of Technical Details**
