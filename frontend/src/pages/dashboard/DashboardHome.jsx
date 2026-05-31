import { useState, useEffect } from 'react'
import {
    MessageSquare, FileText, Clock, TrendingUp,
    Shield, Scale, ArrowRight, Plus
} from 'lucide-react'
import { Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const quickActions = [
    { to: '/dashboard/chat', icon: MessageSquare, label: 'AI Legal Chat', color: 'from-primary-500 to-primary-400', desc: 'Ask legal questions' },
    { to: '/dashboard/documents', icon: FileText, label: 'Upload Document', color: 'from-accent-500 to-accent-400', desc: 'Upload and analyze' },
    { to: '/dashboard/applications', icon: Plus, label: 'Draft Application', color: 'from-saffron-500 to-yellow-400', desc: 'Generate letter/complaint' },
    { to: '/dashboard/legal-trends', icon: TrendingUp, label: 'Legal Trends', color: 'from-green-500 to-emerald-400', desc: 'Latest case updates' },
]

export default function DashboardHome() {
    const { user } = useAuthStore()
    const [greeting, setGreeting] = useState('')

    useEffect(() => {
        const h = new Date().getHours()
        setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening')
    }, [])

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome */}
            <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute inset-0 gradient-primary opacity-5" />
                <div className="relative z-10">
                    <p className="text-gray-400 mb-1">{greeting},</p>
                    <h1 className="font-display font-bold text-3xl text-white mb-2">
                        {user?.name || 'User'} 👋
                    </h1>
                    <p className="text-gray-400">
                        Welcome to your legal dashboard. How can NyayaGuide help you today?
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="font-display font-semibold text-lg text-white mb-4">Quick Actions</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((a) => (
                        <Link key={a.to} to={a.to} className="glass-card-hover p-5 group">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-r ${a.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                                <a.icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-semibold text-white mb-1">{a.label}</h3>
                            <p className="text-xs text-gray-400">{a.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div>
                <h2 className="font-display font-semibold text-lg text-white mb-4">Recent Activity</h2>
                <div className="glass-card p-8 text-center">
                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Your recent chats, uploads, and case notes will appear here.</p>
                    <Link to="/dashboard/chat" className="inline-flex items-center gap-2 text-primary-400 text-sm font-medium mt-4 hover:text-primary-300 transition-colors">
                        Start your first chat <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* DPDP Compliance badge */}
            <div className="glass-card p-4 flex items-center gap-4">
                <Shield className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-white">Your Data is Protected</p>
                    <p className="text-xs text-gray-400">All sensitive data is encrypted with AES-256 and processed in compliance with India's DPDP Act, 2023.</p>
                </div>
            </div>
        </div>
    )
}
