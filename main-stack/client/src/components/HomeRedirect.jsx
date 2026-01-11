import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

export default function HomeRedirect() {
    const { user, loading } = useAuth()

    if (loading) return null

    if (!user) return <Navigate to="/customer/home" replace />

    switch (user.role) {
        case 'admin':
            return <Navigate to="/admin/dashboard" replace />
        case 'supplier':
            return <Navigate to="/supplier/dashboard" replace />
        case 'customer':
        default:
            return <Navigate to="/customer/home" replace />
    }
}
