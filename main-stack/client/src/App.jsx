import { Routes, Route, Navigate } from 'react-router-dom'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'

// Auth Pages
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import RequestOTP from './pages/auth/RequestOTP'
import VerifyOTP from './pages/auth/VerifyOTP'
import ResetPassword from './pages/auth/ResetPassword'

// Dashboard Pages
import AdminDashboard from './pages/Admin/Dashboard'
import SupplierDashboard from './pages/supplier/Dashboard'
import CustomerHome from './pages/customer/Home'

// Error Page
import NotFound from './pages/NotFound'
import UsersList from './pages/Admin/UsersList'
import Categories from './pages/Admin/Categories'
import Products from './pages/Admin/Products'

// Customer Pages
import CustomerProducts from './pages/customer/Products'
import ProductDetail from './pages/customer/ProductDetail'
import Cart from './pages/customer/Cart'
import Wishlist from './pages/customer/Wishlist'

// Public Pages
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import FeedbacksPage from './pages/Admin/Feedbacks'
import SuppliersPage from './pages/Admin/Suppliers'
import CustomerOrdersPage from './pages/Admin/CustomerOrders'
import SupplierOrdersPage from './pages/Admin/SupplierOrders'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Box>Loading...</Box>
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/auth/signup" element={!user ? <Signup /> : <Navigate to="/" replace />} />
      <Route path="/auth/forgot-password" element={!user ? <RequestOTP /> : <Navigate to="/" replace />} />
      <Route path="/auth/verify-otp" element={!user ? <VerifyOTP /> : <Navigate to="/" replace />} />
      <Route path="/auth/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/" replace />} />

      {/* Public Pages - Accessible to all */}
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/contact-us" element={<ContactUs />} />

      {/* Protected Routes - Role Based */}
      <Route
        path="/"
        element={
          user ? (
            user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
              user.role === 'supplier' ? <Navigate to="/supplier/dashboard" replace /> :
                <Navigate to="/customer/home" replace />
          ) : (
            <Navigate to="/auth/login" replace />
          )
        }
      />

      <Route path="/admin/dashboard" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/auth/login" replace />} />
      <Route path="/supplier/dashboard" element={user?.role === 'supplier' ? <SupplierDashboard /> : <Navigate to="/auth/login" replace />} />
      <Route path="/customer/home" element={user?.role === 'customer' ? <CustomerHome /> : <Navigate to="/auth/login" replace />} />

      {/* Other Admin Routes */}
      <Route path='/admin/users' element={user?.role === 'admin' ? <UsersList /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/categories' element={user?.role === 'admin' ? <Categories /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/products' element={user?.role === 'admin' ? <Products /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/feedbacks' element={user?.role === 'admin' ? <FeedbacksPage /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/suppliers' element={user?.role === 'admin' ? <SuppliersPage /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/customer-orders' element={user?.role === 'admin' ? <CustomerOrdersPage /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/supplier-orders' element={user?.role === 'admin' ? <SupplierOrdersPage /> : <Navigate to="/auth/login" replace />} />


      {/* Customer Routes */}
      <Route path='/customer/products' element={user?.role === 'customer' ? <CustomerProducts /> : <Navigate to="/auth/login" replace />} />
      <Route path='/customer/products/:id' element={user?.role === 'customer' ? <ProductDetail /> : <Navigate to="/auth/login" replace />} />
      <Route path='/customer/cart' element={user?.role === 'customer' ? <Cart /> : <Navigate to="/auth/login" replace />} />
      <Route path='/customer/wishlist' element={user?.role === 'customer' ? <Wishlist /> : <Navigate to="/auth/login" replace />} />

      {/* 404 Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ChakraProvider>
            <AppRoutes />
          </ChakraProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
