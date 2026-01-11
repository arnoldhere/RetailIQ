import { Routes, Route, Navigate } from 'react-router-dom'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Categories from "./pages/admin/Categories"
import Products from "./pages/admin/Products"
import StoresPage from './pages/Admin/Stores'
import StoreManagersPage from './pages/Admin/StoreManagers'
import FeedbacksPage from "./pages/Admin/Feedbacks"
import SuppliersPage from './pages/Admin/Suppliers'
import AskSuppliers from './pages/Admin/AskSuppliers'
import CustomerOrdersPage from "./pages/Admin/CustomerOrders"
import SupplierOrdersPage from './pages/supplier/Orders'
// Auth Pages
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import RequestOTP from './pages/auth/RequestOTP'
import VerifyOTP from './pages/auth/VerifyOTP'
import ResetPassword from './pages/auth/ResetPassword'
// import About from './pages/AboutUs'
import Contactus from "./pages/ContactUs"

// Dashboard Pages
import AdminDashboard from './pages/Admin/Dashboard'
import SupplierDashboard from './pages/supplier/Dashboard'
import Orders from './pages/supplier/Orders'
import OrderDetail from './pages/supplier/OrderDetail'
import Bids from './pages/supplier/Bids'
import ProductDetail from './pages/customer/ProductDetail'
import SupplierProductsPage from './pages/supplier/Products'
import CartPage from './pages/customer/Cart'
import WishlistPage from './pages/customer/Wishlist'
import Profile from './pages/Profile'
import CustomerHome from './pages/customer/Home'

// Error Page
import NotFound from './pages/NotFound'
import UsersList from './pages/Admin/UsersList'
import AboutUs from './pages/AboutUs'
// import { ProductsPage as CustomerProductPage } from './pages/customer/Products';
import CustomerProductPage from './pages/customer/Products';
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'


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
      <Route path="/supplier/orders" element={user?.role === 'supplier' ? <Orders /> : <Navigate to="/auth/login" replace />} />
      <Route path="/supplier/orders/:id" element={user?.role === 'supplier' ? <OrderDetail /> : <Navigate to="/auth/login" replace />} />
      <Route path="/supplier/bids" element={user?.role === 'supplier' ? <Bids /> : <Navigate to="/auth/login" replace />} />
      <Route path="/supplier/products" element={user?.role === 'supplier' ? <SupplierProductsPage /> : <Navigate to="/auth/login" replace />} />
      <Route path="/supplier/products/:id" element={user?.role === 'supplier' ? <ProductDetail /> : <Navigate to="/auth/login" replace />} />
      <Route path="/supplier/profile" element={user?.role === 'supplier' ? <Profile /> : <Navigate to="/auth/login" replace />} />
      <Route path="/customer/home" element={user?.role === 'customer' ? <CustomerHome /> : <Navigate to="/auth/login" replace />} />
      <Route path='/customer/products' element={user?.role === "customer" ? <CustomerProductPage /> : <Navigate to="/auth/login" replace />} />
      <Route path='/customer/products/:id' element={user?.role === 'customer' ? <ProductDetail /> : <Navigate to="/auth/login" replace />} />
      <Route path="/customer/cart" element={user?.role === 'customer' ? <CartPage /> : <Navigate to="/auth/login" replace />} />
      <Route path="/customer/wishlist" element={user?.role === 'customer' ? <WishlistPage /> : <Navigate to="/auth/login" replace />} />

      {/* Other Admin Routes */}
      <Route path='/admin/users' element={user?.role === 'admin' ? <UsersList /> : <Navigate to="/auth/login" replace />} />
      {/* Other Admin Routes */}
      <Route path='/admin/users' element={user?.role === 'admin' ? <UsersList /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/categories' element={user?.role === 'admin' ? <Categories /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/products' element={user?.role === 'admin' ? <Products /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/stores' element={user?.role === 'admin' ? <StoresPage /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/store-managers' element={user?.role === 'admin' ? <StoreManagersPage /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/feedbacks' element={user?.role === 'admin' ? <FeedbacksPage /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/suppliers' element={user?.role === 'admin' ? <SuppliersPage /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/asks' element={user?.role === 'admin' ? <AskSuppliers /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/customer-orders' element={user?.role === 'admin' ? <CustomerOrdersPage /> : <Navigate to="/auth/login" replace />} />
      <Route path='/admin/supplier-orders' element={user?.role === 'admin' ? <SupplierOrdersPage /> : <Navigate to="/auth/login" replace />} />

      {/* 404 Catch All */}
      <Route path="*" element={<NotFound />} />
      {/* other routes */}
      <Route path='/about-us' element={<AboutUs />} />
      <Route path='/contact-us' element={<Contactus />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <ChakraProvider>
        <CartProvider>
          <WishlistProvider>
            <AppRoutes />
          </WishlistProvider>
        </CartProvider>
      </ChakraProvider>
    </AuthProvider>
  )
}

export default App
