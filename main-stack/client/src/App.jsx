import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import { ChakraProvider, Container } from '@chakra-ui/react'
import { AuthProvider, useAuth } from './context/AuthContext'

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={user ? <Home /> : <Navigate to="/auth/login" replace />} />
      <Route path="/auth/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/auth/signup" element={!user ? <Signup /> : <Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Container>
        <AppRoutes />
      </Container>
    </AuthProvider>
  )
}

export default App
