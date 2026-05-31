import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import {
    LayoutDashboard, User, FileText, Calendar,
    MessageSquare, FilePlus, TrendingUp, StickyNote,
    Clock, LogOut, Scale, Menu, X, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import FloatingVoiceAssistant from './FloatingVoiceAssistant'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/dashboard/profile', icon: User, label: 'Profile' },
    { to: '/dashboard/documents', icon: FileText, label: 'Documents' },
    { to: '/dashboard/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/dashboard/chat', icon: MessageSquare, label: 'AI Legal Chat' },
    { to: '/dashboard/applications', icon: FilePlus, label: 'Applications' },
    { to: '/dashboard/legal-trends', icon: TrendingUp, label: 'Legal Trends' },
    { to: '/dashboard/notes', icon: StickyNote, label: 'Notes' },
    { to: '/dashboard/timeline', icon: Clock, label: 'Timeline' },
]

export default function DashboardLayout() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Hide the global floating voice assistant on the chat page
    // because ChatPage has its own built-in voice controls
    const isChatPage = location.pathname === '/dashboard/chat'

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen flex bg-navy-900 gradient-mesh">
            {/* ── Mobile overlay ── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-navy-900/80 backdrop-blur-2xl border-r border-white/5
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <Scale className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-lg text-white">NyayaGuide</h1>
                        <p className="text-xs text-gray-500">AI Legal Assistant</p>
                    </div>
                    <button className="lg:hidden ml-auto text-gray-400" onClick={() => setSidebarOpen(false)}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                isActive ? 'sidebar-link-active' : 'sidebar-link'
                            }
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{item.label}</span>
                            <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100" />
                        </NavLink>
                    ))}
                </nav>

                {/* User Card + Logout */}
                <div className="p-4 border-t border-white/5">
                    <div className="glass-card p-3 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-navy-900/60 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
                    <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                        <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium">
                            🔒 DPDP Compliant
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>

            {/* Global Voice Assistant FAB — hidden on chat page (it has its own) */}
            {!isChatPage && <FloatingVoiceAssistant />}
        </div>
    )
}
