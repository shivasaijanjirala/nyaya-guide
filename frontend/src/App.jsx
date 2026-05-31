import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// ── Public Pages ──
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// ── Dashboard Pages ──
import DashboardLayout from './components/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import ProfilePage from './pages/dashboard/ProfilePage'
import DocumentsPage from './pages/dashboard/DocumentsPage'
import CalendarPage from './pages/dashboard/CalendarPage'
import ChatPage from './pages/dashboard/ChatPage'
import ApplicationsPage from './pages/dashboard/ApplicationsPage'
import LegalTrendsPage from './pages/dashboard/LegalTrendsPage'
import NotesPage from './pages/dashboard/NotesPage'
import TimelinePage from './pages/dashboard/TimelinePage'

// ── Admin Pages ──
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLogs from './pages/admin/AdminLogs'
import AdminConsents from './pages/admin/AdminConsents'

// ── Guards ──
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
    return (
        <Router>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: 'rgba(15, 23, 42, 0.9)',
                        color: '#f1f5f9',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(12px)',
                    },
                }}
            />
            <Routes>
                {/* ── Public Routes ── */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* ── Protected Dashboard Routes ── */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route index element={<DashboardHome />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="documents" element={<DocumentsPage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="chat" element={<ChatPage />} />
                    <Route path="applications" element={<ApplicationsPage />} />
                    <Route path="legal-trends" element={<LegalTrendsPage />} />
                    <Route path="notes" element={<NotesPage />} />
                    <Route path="timeline" element={<TimelinePage />} />
                </Route>

                {/* ── Admin Routes ── */}
                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="logs" element={<AdminLogs />} />
                    <Route path="consents" element={<AdminConsents />} />
                </Route>
            </Routes>
        </Router>
    )
}
