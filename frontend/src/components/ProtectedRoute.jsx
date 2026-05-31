import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../lib/api'
import { Shield } from 'lucide-react'

/**
 * ProtectedRoute – Wraps pages that require authentication.
 * - Verifies JWT on mount by calling /api/auth/me
 * - Redirects to /login if not authenticated
 * - Shows a loading spinner while verifying
 * - If adminOnly is true, checks user.role === 'admin'
 *
 * WHY verify on mount? JWTs can expire. We validate server-side every page load.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
    const { isAuthenticated, user, setUser, setLoading, logout } = useAuthStore()
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await api.get('/auth/me')
                setUser(res.data.user)
            } catch {
                logout()
            } finally {
                setChecking(false)
                setLoading(false)
            }
        }
        verify()
    }, [])

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-navy-900 gradient-mesh">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <div className="relative">
                        <Shield className="w-12 h-12 text-primary-400 animate-pulse" />
                        <div className="absolute inset-0 w-12 h-12 bg-primary-400/20 rounded-full animate-ping" />
                    </div>
                    <p className="text-gray-400 font-medium">Verifying your identity...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (adminOnly && user?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />
    }

    return children
}
