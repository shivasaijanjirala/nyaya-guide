import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { LayoutDashboard, FileSearch, ShieldCheck, LogOut, Scale, ArrowLeft } from 'lucide-react'

const adminNav = [
    { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/admin/logs', icon: FileSearch, label: 'Audit Logs' },
    { to: '/admin/consents', icon: ShieldCheck, label: 'Consents' },
]

export default function AdminLayout() {
    const { logout } = useAuthStore()
    const navigate = useNavigate()

    return (
        <div className="min-h-screen flex bg-navy-900 gradient-mesh">
            <aside className="w-64 bg-navy-900/80 backdrop-blur-2xl border-r border-white/5 flex flex-col">
                <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center shadow-lg">
                        <Scale className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-lg text-white">Admin Panel</h1>
                        <p className="text-xs text-gray-500">NyayaGuide</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {adminNav.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <button onClick={() => navigate('/dashboard')} className="sidebar-link w-full">
                        <ArrowLeft className="w-5 h-5" /> <span>Back to App</span>
                    </button>
                    <button onClick={() => { logout(); navigate('/login') }} className="sidebar-link w-full text-red-400 hover:bg-red-500/10">
                        <LogOut className="w-5 h-5" /> <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    )
}
