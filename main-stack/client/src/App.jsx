import { Routes, Route, Navigate } from 'react-router-dom'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { AuthProvider, useAuth } from './context/AuthContext'

// Auth Pages
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'

// Dashboard Pages
import AdminDashboard from './pages/Admin/Dashboard'
import SupplierDashboard from './pages/supplier/Dashboard'
import CustomerHome from './pages/customer/Home'

// Error Page
import NotFound from './pages/NotFound'

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

      {/* 404 Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <ChakraProvider>
        <AppRoutes />
      </ChakraProvider>
    </AuthProvider>
  )
}

export default App
